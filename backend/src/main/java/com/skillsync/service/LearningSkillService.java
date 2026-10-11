package com.skillsync.service;

import com.skillsync.dto.LearningSkillDTO;
import com.skillsync.dto.LearningSkillRequest;
import com.skillsync.exception.DuplicateResourceException;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.LearningSkill;
import com.skillsync.model.User;
import com.skillsync.repository.LearningSkillRepository;
import com.skillsync.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing skills a student wants to learn.
 *
 * Current authenticated student is extracted from the JWT token via SecurityContextHolder.
 * Frontend user IDs are never trusted or accepted for personal learning-skill operations.
 */
@Service
@Transactional
public class LearningSkillService {

    private final LearningSkillRepository learningSkillRepository;
    private final UserRepository userRepository;

    public LearningSkillService(LearningSkillRepository learningSkillRepository,
                                UserRepository userRepository) {
        this.learningSkillRepository = learningSkillRepository;
        this.userRepository = userRepository;
    }

    // ── Helper: resolve the authenticated user ────────────────

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    // ── GET /api/profile/learning-skills ──────────────────────

    @Transactional(readOnly = true)
    public List<LearningSkillDTO> getLearningSkills() {
        User user = getAuthenticatedUser();
        return user.getLearningSkills().stream()
                .map(LearningSkillDTO::from)
                .collect(Collectors.toList());
    }

    // ── POST /api/profile/learning-skills ─────────────────────

    public LearningSkillDTO addLearningSkill(LearningSkillRequest request) {
        if (request == null || request.getName() == null || request.getName().trim().isBlank()) {
            throw new IllegalArgumentException("Learning skill name cannot be blank");
        }

        User user = getAuthenticatedUser();
        String trimmedName = request.getName().trim();

        // Case-insensitive reuse of existing LearningSkill entity or create new
        LearningSkill learningSkill = learningSkillRepository.findByNameIgnoreCase(trimmedName)
                .orElseGet(() -> learningSkillRepository.save(new LearningSkill(trimmedName)));

        // Verify if current user already has this learning skill
        boolean alreadyAdded = user.getLearningSkills().stream()
                .anyMatch(s -> s.getId().equals(learningSkill.getId()) || s.getName().equalsIgnoreCase(trimmedName));

        if (alreadyAdded) {
            throw new DuplicateResourceException("You already have the learning skill: " + learningSkill.getName());
        }

        user.getLearningSkills().add(learningSkill);
        userRepository.save(user);

        return LearningSkillDTO.from(learningSkill);
    }

    // ── DELETE /api/profile/learning-skills/{skillId} ──────────

    public void removeLearningSkill(Long skillId) {
        User user = getAuthenticatedUser();

        // Check if the learning skill is actually in the authenticated user's list
        boolean removed = user.getLearningSkills().removeIf(s -> s.getId().equals(skillId));

        if (!removed) {
            throw new ResourceNotFoundException("Learning skill not found in your learning list with id: " + skillId);
        }

        userRepository.save(user);
    }
}
