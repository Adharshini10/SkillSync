package com.skillsync.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Security configuration.
 *
 * Rules:
 *  - Stateless sessions (JWT-based, no HTTP session)
 *  - CSRF disabled (safe for stateless REST APIs)
 *  - Public: /api/auth/**, /api/test
 *  - Protected: all other /api/** endpoints require a valid JWT
 *  - CORS configured to allow the React frontend (localhost:3000)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider  authenticationProvider;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          AuthenticationProvider authenticationProvider) {
        this.jwtAuthFilter         = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ── CSRF ──────────────────────────────────────────
            // Disabled: stateless JWT APIs don't need CSRF protection
            .csrf(AbstractHttpConfigurer::disable)

            // ── CORS ──────────────────────────────────────────
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ── 401 for unauthenticated requests ──────────────
            // Without this, Spring returns 403 instead of 401 when no token is present.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(unauthorizedEntryPoint())
            )

            // ── Authorization rules ───────────────────────────
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints
                .requestMatchers("/api/auth/**").permitAll()
                // Public test endpoint (can be restricted later)
                .requestMatchers("/api/test").permitAll()
                // WebSocket handshake endpoint (STOMP connection authenticates via WebSocketAuthInterceptor)
                .requestMatchers("/ws/**").permitAll()
                // Standalone test client for viva/demonstration
                .requestMatchers("/chat_test.html", "/favicon.ico").permitAll()
                // Everything else requires a valid JWT
                .anyRequest().authenticated()
            )

            // ── Session management ────────────────────────────
            // STATELESS: no HttpSession – each request must carry a JWT
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ── Authentication provider ───────────────────────
            .authenticationProvider(authenticationProvider)

            // ── JWT filter ────────────────────────────────────
            // Run our filter before Spring's default username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Returns HTTP 401 with a JSON body when a request hits a protected endpoint
     * without a valid JWT token. Without this, Spring Security defaults to 403.
     */
    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            String body = "{" +
                    "\"timestamp\":\"" + LocalDateTime.now() + "\"," +
                    "\"status\":401," +
                    "\"error\":\"Unauthorized\"," +
                    "\"message\":\"Authentication required. Please provide a valid JWT token.\"" +
                    "}";
            response.getWriter().write(body);
        };
    }

    /**
     * CORS configuration – allows the React frontend to call the API.
     * Adjust origins/methods/headers for production.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow local development servers and deployed frontend domains
        config.setAllowedOriginPatterns(List.of("*"));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
