package com.skillsync.service;

import com.skillsync.dto.SkillMatchDTO;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.*;
import com.skillsync.repository.ConnectionRepository;
import com.skillsync.repository.ProfileRepository;
import com.skillsync.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service implementing the Skill Swapper matching logic.
 *
 * Matching Direction:
 *   Current authenticated student's "Skills I Want to Learn" (Learning Skills)
 *                                  ↓
 *                                MATCH
 *                                  ↓
 *                Other students' "My Skills" (Known Skills)
 *
 * Key Rules:
 *   1. The current student never appears in their own results.
 *   2. Case-insensitive and whitespace-trimmed skill name comparison.
 *   3. Unique matching count (duplicate skill entries do not inflate score).
 *   4. Zero-match candidates are completely excluded.
 *   5. If the current user has no learning skills, an empty list is returned immediately.
 *   6. Results sorted by matchCount DESC, then name ASC (case-insensitive), then userId ASC.
 *   7. Reuses existing Connection system for connectionStatus (NONE, PENDING_SENT, PENDING_RECEIVED, ACCEPTED, REJECTED).
 */
@Service
@Transactional(readOnly = true)
public class SkillSwapperService {

    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;
    private final ProfileRepository profileRepository;

    public SkillSwapperService(UserRepository userRepository,
                               ConnectionRepository connectionRepository,
                               ProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.connectionRepository = connectionRepository;
        this.profileRepository = profileRepository;
    }

    /**
     * Find matched students based on the authenticated student's learning skills.
     *
     * @param minMatches Minimum number of matching skills required (default 1)
     * @return List of SkillMatchDTO sorted with strongest matches first
     */
    public List<SkillMatchDTO> findMatches(int minMatches) {
        if (minMatches < 1) {
            minMatches = 1;
        }

        // Step 1: Get the authenticated user
        User currentUser = getAuthenticatedUser();

        // Step 2: Get current user's "Skills I Want to Learn"
        Set<LearningSkill> learningSkills = currentUser.getLearningSkills();

        // If the current student has no learning skills, return an empty list
        if (learningSkills == null || learningSkills.isEmpty()) {
            return Collections.emptyList();
        }

        // Normalize current user's learning skills (trimmed, lower-case, unique)
        Set<String> normalizedLearningSkills = learningSkills.stream()
                .filter(ls -> ls != null && ls.getName() != null && !ls.getName().trim().isBlank())
                .map(ls -> ls.getName().trim().toLowerCase())
                .collect(Collectors.toSet());

        int totalDesiredSkills = normalizedLearningSkills.size();
        if (totalDesiredSkills == 0) {
            return Collections.emptyList();
        }

        // Pre-fetch candidate users
        List<User> allUsers = userRepository.findAll();

        // Pre-fetch profiles into a map by userId to avoid lazy loading issues
        Map<Long, Profile> profileMap = new HashMap<>();
        try {
            for (Profile p : profileRepository.findAll()) {
                if (p != null && p.getUser() != null && p.getUser().getId() != null) {
                    profileMap.put(p.getUser().getId(), p);
                }
            }
        } catch (Exception ignored) {
            // Fallback to candidate.getProfile() if bulk fetch fails
        }

        // Pre-fetch all connections involving the current user in a single query
        Map<Long, Connection> connectionMap = buildConnectionMapForUser(currentUser);

        List<SkillMatchDTO> matchResults = new ArrayList<>();

        for (User candidate : allUsers) {
            // Rule: Current user must NEVER appear in results
            if (candidate.getId() == null || candidate.getId().equals(currentUser.getId())) {
                continue;
            }

            // Step 3: Get other student's "My Skills"
            Set<Skill> candidateSkills = candidate.getSkills();
            if (candidateSkills == null || candidateSkills.isEmpty()) {
                continue;
            }

            // Normalize and deduplicate candidate's skills (case-insensitive & trimmed)
            Map<String, String> candidateSkillsMap = new LinkedHashMap<>();
            for (Skill skill : candidateSkills) {
                if (skill == null || skill.getName() == null || skill.getName().trim().isBlank()) {
                    continue;
                }
                String rawName = skill.getName().trim();
                String normalized = rawName.toLowerCase();
                candidateSkillsMap.putIfAbsent(normalized, rawName);
            }

            if (candidateSkillsMap.isEmpty()) {
                continue;
            }

            // Step 4 & 5: Compare skill names and find common skills
            List<String> matchedSkillsList = new ArrayList<>();
            for (Map.Entry<String, String> entry : candidateSkillsMap.entrySet()) {
                if (normalizedLearningSkills.contains(entry.getKey())) {
                    matchedSkillsList.add(entry.getValue());
                }
            }

            // Step 6: Count the common skills (unique matches)
            int matchCount = matchedSkillsList.size();

            // Step 8: Ignore students with zero matches (or below minMatches threshold)
            if (matchCount < minMatches) {
                continue;
            }

            // Step 7: Calculate match percentage: (matched skills / current user's learning skills) * 100
            double rawPercentage = ((double) matchCount / totalDesiredSkills) * 100.0;
            double matchPercentage = BigDecimal.valueOf(rawPercentage)
                    .setScale(2, RoundingMode.HALF_UP)
                    .doubleValue();

            // Sort skill lists alphabetically for clean display
            List<String> allCandidateSkills = new ArrayList<>(candidateSkillsMap.values());
            allCandidateSkills.sort(String.CASE_INSENSITIVE_ORDER);
            matchedSkillsList.sort(String.CASE_INSENSITIVE_ORDER);

            // Safe profile details extraction
            Profile candidateProfile = profileMap.get(candidate.getId());
            if (candidateProfile == null) {
                candidateProfile = candidate.getProfile();
            }

            String bio = candidateProfile != null ? candidateProfile.getBio() : null;
            String location = candidateProfile != null ? candidateProfile.getLocation() : null;
            String education = candidateProfile != null ? candidateProfile.getEducation() : null;
            String profilePictureUrl = candidateProfile != null ? candidateProfile.getProfilePicture() : null;

            // Determine connection status using the pre-fetched connections
            String connectionStatus = determineConnectionStatus(currentUser, candidate, connectionMap);

            SkillMatchDTO matchDTO = new SkillMatchDTO(
                    candidate.getId(),
                    candidate.getName(),
                    bio,
                    location,
                    education,
                    profilePictureUrl,
                    allCandidateSkills,
                    matchedSkillsList,
                    matchCount,
                    matchPercentage,
                    connectionStatus
            );

            matchResults.add(matchDTO);
        }

        // Step 9: Sort by matchCount DESC, secondary name ASC, tertiary userId ASC
        matchResults.sort(
                Comparator.comparingInt(SkillMatchDTO::getMatchCount).reversed()
                        .thenComparing(SkillMatchDTO::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(SkillMatchDTO::getUserId, Comparator.nullsLast(Comparator.naturalOrder()))
        );

        // Step 10: Return matching students
        return matchResults;
    }

    // ── Helper: build map of connections for current user ─────

    private Map<Long, Connection> buildConnectionMapForUser(User currentUser) {
        Map<Long, Connection> map = new HashMap<>();
        List<Connection> userConnections = connectionRepository.findAllConnectionsForUser(currentUser);

        for (Connection conn : userConnections) {
            Long otherUserId = conn.getSender().getId().equals(currentUser.getId())
                    ? conn.getReceiver().getId()
                    : conn.getSender().getId();

            Connection existing = map.get(otherUserId);
            if (existing == null) {
                map.put(otherUserId, conn);
            } else {
                // Priority: ACCEPTED > PENDING > REJECTED
                if (conn.getStatus() == ConnectionStatus.ACCEPTED) {
                    map.put(otherUserId, conn);
                } else if (conn.getStatus() == ConnectionStatus.PENDING && existing.getStatus() != ConnectionStatus.ACCEPTED) {
                    map.put(otherUserId, conn);
                }
            }
        }
        return map;
    }

    // ── Helper: determine connection status ───────────────────

    private String determineConnectionStatus(User currentUser, User candidate, Map<Long, Connection> connectionMap) {
        Connection conn = connectionMap.get(candidate.getId());
        if (conn == null) {
            return "NONE";
        }

        if (conn.getStatus() == ConnectionStatus.ACCEPTED) {
            return "ACCEPTED";
        }
        if (conn.getStatus() == ConnectionStatus.REJECTED) {
            return "REJECTED";
        }
        if (conn.getStatus() == ConnectionStatus.PENDING) {
            if (conn.getSender().getId().equals(currentUser.getId())) {
                return "PENDING_SENT";
            } else {
                return "PENDING_RECEIVED";
            }
        }

        return "NONE";
    }

    // ── Helper: resolve authenticated user ────────────────────

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }
}

