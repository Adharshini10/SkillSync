package com.skillsync.controller;

import com.skillsync.dto.UserResponseDTO;
import com.skillsync.service.ConnectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Student Discovery and Search.
 *
 * Endpoints:
 *  - GET /api/users                -> Discover students
 *  - GET /api/users/search?name=   -> Search students by name
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final ConnectionService connectionService;

    public UserController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    /**
     * Get all students for discovery.
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(connectionService.searchUsers(null));
    }

    /**
     * Search students by name.
     * GET /api/users/search?name=abc
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserResponseDTO>> searchUsers(@RequestParam(required = false) String name) {
        return ResponseEntity.ok(connectionService.searchUsers(name));
    }
}
