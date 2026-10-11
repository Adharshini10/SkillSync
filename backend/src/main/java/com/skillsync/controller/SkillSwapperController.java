package com.skillsync.controller;

import com.skillsync.dto.SkillMatchDTO;
import com.skillsync.service.SkillSwapperService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for Skill Swapper matching.
 *
 * Base path: /api/skill-swapper
 *
 * All endpoints require a valid JWT token.
 * The searching student is determined strictly from the JWT — client never passes user ID.
 *
 * Endpoints:
 *   GET /api/skill-swapper/matches
 *   GET /api/skill-swapper/matches?minMatches=2
 */
@RestController
@RequestMapping("/api/skill-swapper")
public class SkillSwapperController {

    private final SkillSwapperService skillSwapperService;

    public SkillSwapperController(SkillSwapperService skillSwapperService) {
        this.skillSwapperService = skillSwapperService;
    }

    /**
     * Retrieve matching students whose known skills overlap with the authenticated
     * student's learning skills, ordered with strongest matches first.
     *
     * @param minMatches Optional minimum matching skills threshold (defaults to 1)
     * @return List of SkillMatchDTO
     */
    @GetMapping("/matches")
    public ResponseEntity<List<SkillMatchDTO>> getMatches(
            @RequestParam(name = "minMatches", defaultValue = "1", required = false) Integer minMatches) {
        int threshold = (minMatches != null && minMatches > 0) ? minMatches : 1;
        return ResponseEntity.ok(skillSwapperService.findMatches(threshold));
    }
}
