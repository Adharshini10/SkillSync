package com.skillsync.service;

import com.skillsync.dto.ProfileRequest;
import com.skillsync.dto.ProfileResponse;
import com.skillsync.dto.SkillRequest;
import com.skillsync.dto.SkillResponse;
import com.skillsync.exception.DuplicateResourceException;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.Profile;
import com.skillsync.model.Skill;
import com.skillsync.model.User;
import com.skillsync.repository.ProfileRepository;
import com.skillsync.repository.SkillRepository;
import com.skillsync.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for User Profile and Skills management.
 *
 * How the logged-in user is identified:
 *   Spring Security stores the authenticated principal in SecurityContextHolder
 *   after the JwtAuthenticationFilter validates the JWT token.
 *   We call SecurityContextHolder.getContext().getAuthentication().getName()
 *   to retrieve the email (which was set as the JWT subject during login),
 *   then load the User from the database. The client never sends a user ID.
 */
@Service
@Transactional
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final SkillRepository   skillRepository;
    private final UserRepository    userRepository;

    public ProfileService(ProfileRepository profileRepository,
                          SkillRepository skillRepository,
                          UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.skillRepository   = skillRepository;
        this.userRepository    = userRepository;
    }

    // ── Helper: resolve the authenticated user ────────────────

    /**
     * Extract the email from the JWT (via SecurityContext) and load the User from DB.
     * This is called by every profile/skill operation to identify who is logged in.
     */
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();   // returns the JWT subject (email)
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    // ── Helper: get or create profile ────────────────────────

    /**
     * Return the existing profile for this user, or create a blank one if none exists.
     * This means users do not need to "create" a profile — it is initialised lazily.
     */
    private Profile getOrCreateProfile(User user) {
        return profileRepository.findByUser(user)
                .orElseGet(() -> {
                    Profile newProfile = new Profile(user);
                    return profileRepository.save(newProfile);
                });
    }

    // ── GET /api/profile ─────────────────────────────────────

    public ProfileResponse getProfile() {
        User    user    = getAuthenticatedUser();
        Profile profile = getOrCreateProfile(user);
        return ProfileResponse.from(profile, user);
    }

    // ── PUT /api/profile ─────────────────────────────────────

    public ProfileResponse updateProfile(ProfileRequest request) {
        User    user    = getAuthenticatedUser();
        Profile profile = getOrCreateProfile(user);

        // Only update fields that were provided in the request (null = no change)
        if (request.getBio()            != null) profile.setBio(request.getBio());
        if (request.getProfilePicture() != null) profile.setProfilePicture(request.getProfilePicture());
        if (request.getLocation()       != null) profile.setLocation(request.getLocation());
        if (request.getEducation()      != null) profile.setEducation(request.getEducation());

        Profile saved = profileRepository.save(profile);
        return ProfileResponse.from(saved, user);
    }

    // ── GET /api/profile/skills ───────────────────────────────

    @Transactional(readOnly = true)
    public List<SkillResponse> getSkills() {
        User user = getAuthenticatedUser();
        return user.getSkills()
                .stream()
                .map(SkillResponse::from)
                .collect(Collectors.toList());
    }

    // ── POST /api/profile/skills ──────────────────────────────

    public SkillResponse addSkill(SkillRequest request) {
        User user = getAuthenticatedUser();

        // Trim and normalise the skill name
        String skillName = request.getName().trim();

        // Reuse existing skill row, or create a new one
        Skill skill = skillRepository.findByName(skillName)
                .orElseGet(() -> skillRepository.save(new Skill(skillName)));

        // Check if the user already has this skill
        boolean alreadyAdded = user.getSkills().stream()
                .anyMatch(s -> s.getId().equals(skill.getId()));

        if (alreadyAdded) {
            throw new DuplicateResourceException("You already have the skill: " + skillName);
        }

        user.getSkills().add(skill);
        userRepository.save(user);

        return SkillResponse.from(skill);
    }

    // ── DELETE /api/profile/skills/{skillId} ─────────────────

    public void removeSkill(Long skillId) {
        User user = getAuthenticatedUser();

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillId));

        boolean removed = user.getSkills().removeIf(s -> s.getId().equals(skillId));

        if (!removed) {
            throw new ResourceNotFoundException("You do not have the skill: " + skill.getName());
        }

        userRepository.save(user);
    }
}
