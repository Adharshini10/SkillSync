package com.skillsync.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test controller to verify the backend is up and reachable.
 * Remove or replace once real feature controllers are added.
 */
@RestController
@RequestMapping("/api")
public class TestController {

    /**
     * Simple health / smoke-test endpoint.
     *
     * GET /api/test
     * Response: 200 OK  "SkillSync Backend is running"
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("SkillSync Backend is running");
    }
}
