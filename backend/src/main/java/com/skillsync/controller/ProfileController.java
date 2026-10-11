package com.skillsync.controller;

import com.skillsync.dto.ProfileRequest;
import com.skillsync.dto.ProfileResponse;
import com.skillsync.dto.SkillRequest;
import com.skillsync.dto.SkillResponse;
import com.skillsync.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for user profile and skills management.
 *
 * All endpoints require a valid JWT token (enforced by SecurityConfig).
 * The logged-in user is identified from the JWT — the client never passes a user ID.
 *
 * Endpoints:
 *   GET    /api/profile                    → Get my profile
 *   PUT    /api/profile                    → Update my profile
 *   GET    /api/profile/skills             → Get my skills
 *   POST   /api/profile/skills             → Add a skill
 *   DELETE /api/profile/skills/{skillId}   → Remove a skill
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // ── GET /api/profile ──────────────────────────────────────

    /**
     * Get the authenticated user's profile.
     * A blank profile is auto-created if the user has never updated it.
     */
    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        return ResponseEntity.ok(profileService.getProfile());
    }

    // ── PUT /api/profile ──────────────────────────────────────

    /**
     * Update the authenticated user's profile.
     * Only provided fields are updated; omitted fields remain unchanged.
     *
     * Request body example:
     * {
     *   "bio":            "Full-stack developer",
     *   "profilePicture": "https://example.com/pic.jpg",
     *   "location":       "Chennai, India",
     *   "education":      "B.E. Computer Science"
     * }
     */
    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody ProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(request));
    }

    // ── GET /api/profile/skills ───────────────────────────────

    /**
     * Get the list of skills for the authenticated user.
     */
    @GetMapping("/skills")
    public ResponseEntity<List<SkillResponse>> getSkills() {
        return ResponseEntity.ok(profileService.getSkills());
    }

    // ── POST /api/profile/skills ──────────────────────────────

    /**
     * Add a new skill to the authenticated user's profile.
     *
     * Request body:
     * { "name": "Java" }
     *
     * If the skill already exists in the skills table, it is reused.
     * Returns 409 if the user already has that skill.
     */
    @PostMapping("/skills")
    public ResponseEntity<SkillResponse> addSkill(
            @Valid @RequestBody SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService.addSkill(request));
    }

    // ── DELETE /api/profile/skills/{skillId} ──────────────────

    /**
     * Remove a skill from the authenticated user's profile.
     * Does NOT delete the skill from the skills table — only removes the association.
     */
    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<Void> removeSkill(@PathVariable Long skillId) {
        profileService.removeSkill(skillId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }
}
