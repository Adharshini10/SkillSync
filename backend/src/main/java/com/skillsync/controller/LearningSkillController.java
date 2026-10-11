package com.skillsync.controller;

import com.skillsync.dto.LearningSkillDTO;
import com.skillsync.dto.LearningSkillRequest;
import com.skillsync.service.LearningSkillService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing skills a student wants to learn.
 *
 * Base path: /api/profile/learning-skills
 *
 * All endpoints require a valid JWT token.
 * The logged-in student is determined strictly from the JWT — client never passes user ID.
 *
 * Endpoints:
 *   GET    /api/profile/learning-skills            -> Get my learning skills
 *   POST   /api/profile/learning-skills            -> Add a learning skill
 *   DELETE /api/profile/learning-skills/{skillId}  -> Remove a learning skill from my profile
 */
@RestController
@RequestMapping("/api/profile/learning-skills")
public class LearningSkillController {

    private final LearningSkillService learningSkillService;

    public LearningSkillController(LearningSkillService learningSkillService) {
        this.learningSkillService = learningSkillService;
    }

    // ── GET /api/profile/learning-skills ──────────────────────

    /**
     * Get the list of skills the authenticated student wants to learn.
     */
    @GetMapping
    public ResponseEntity<List<LearningSkillDTO>> getLearningSkills() {
        return ResponseEntity.ok(learningSkillService.getLearningSkills());
    }

    // ── POST /api/profile/learning-skills ─────────────────────

    /**
     * Add a skill to the authenticated student's learning list.
     * Request body: { "name": "Python" }
     */
    @PostMapping
    public ResponseEntity<LearningSkillDTO> addLearningSkill(
            @Valid @RequestBody LearningSkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(learningSkillService.addLearningSkill(request));
    }

    // ── DELETE /api/profile/learning-skills/{skillId} ──────────

    /**
     * Remove a learning skill from the authenticated student's profile.
     * Only disassociates from the current user; does NOT delete the global entity.
     */
    @DeleteMapping("/{skillId}")
    public ResponseEntity<Void> removeLearningSkill(@PathVariable Long skillId) {
        learningSkillService.removeLearningSkill(skillId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }
}
