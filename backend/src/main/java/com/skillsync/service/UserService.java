package com.skillsync.service;

import com.skillsync.dto.AuthResponse;
import com.skillsync.dto.LoginRequest;
import com.skillsync.dto.RegisterRequest;
import com.skillsync.exception.DuplicateResourceException;
import com.skillsync.model.User;
import com.skillsync.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service layer for user registration and authentication.
 */
@Service
public class UserService {

    private final UserRepository       userRepository;
    private final PasswordEncoder      passwordEncoder;
    private final JwtService           jwtService;
    private final AuthenticationManager authenticationManager;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userRepository        = userRepository;
        this.passwordEncoder       = passwordEncoder;
        this.jwtService            = jwtService;
        this.authenticationManager = authenticationManager;
    }

    // ── Register ──────────────────────────────────────────────

    /**
     * Register a new user.
     *
     * Steps:
     *  1. Validate the email is not already taken.
     *  2. Hash the password with BCrypt.
     *  3. Persist the new User to the database.
     *  4. Generate a JWT token for immediate use.
     *
     * @throws IllegalArgumentException if the email is already registered.
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered: " + request.getEmail());
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()) // BCrypt hash
        );

        userRepository.save(user);

        // Wrap the User as a UserDetails principal for JWT generation
        org.springframework.security.core.userdetails.User principal =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPassword(),
                        java.util.Collections.emptyList()
                );

        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    // ── Login ─────────────────────────────────────────────────

    /**
     * Authenticate an existing user.
     *
     * Steps:
     *  1. Delegate to Spring Security's AuthenticationManager (verifies BCrypt hash).
     *  2. If credentials are wrong, AuthenticationManager throws BadCredentialsException → 401.
     *  3. Retrieve the user from DB and generate a fresh JWT token.
     *
     * @throws org.springframework.security.authentication.BadCredentialsException
     *         if email or password is incorrect.
     */
    public AuthResponse login(LoginRequest request) {
        // This line throws BadCredentialsException if credentials are invalid
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found after authentication"));

        org.springframework.security.core.userdetails.User principal =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPassword(),
                        java.util.Collections.emptyList()
                );

        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }
}
