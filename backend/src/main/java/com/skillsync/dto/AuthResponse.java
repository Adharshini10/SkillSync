package com.skillsync.dto;

/**
 * Response body returned after successful registration or login.
 * Contains the JWT token and basic user information.
 */
public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private Long id;
    private String name;
    private String email;

    public AuthResponse(String token, Long id, String name, String email) {
        this.token = token;
        this.id    = id;
        this.name  = name;
        this.email = email;
    }

    // ── Getters ───────────────────────────────────────────────

    public String getToken()  { return token; }
    public String getType()   { return type; }
    public Long   getId()     { return id; }
    public String getName()   { return name; }
    public String getEmail()  { return email; }
}
