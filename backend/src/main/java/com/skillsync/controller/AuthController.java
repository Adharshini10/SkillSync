package com.skillsync.controller;

import com.skillsync.dto.AuthResponse;
import com.skillsync.dto.LoginRequest;
import com.skillsync.dto.RegisterRequest;
import com.skillsync.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication endpoints.
 *
 * Public endpoints (no token required):
 *   POST /api/auth/register
 *   POST /api/auth/login
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Register a new user.
     *
     * Request body:
     * {
     *   "name":     "Alice",
     *   "email":    "alice@example.com",
     *   "password": "secret123"
     * }
     *
     * Response 201 Created:
     * {
     *   "token": "<jwt>",
     *   "type":  "Bearer",
     *   "id":    1,
     *   "name":  "Alice",
     *   "email": "alice@example.com"
     * }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Log in with an existing account.
     *
     * Request body:
     * {
     *   "email":    "alice@example.com",
     *   "password": "secret123"
     * }
     *
     * Response 200 OK:
     * {
     *   "token": "<jwt>",
     *   "type":  "Bearer",
     *   ...
     * }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }
}
