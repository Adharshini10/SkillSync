package com.skillsync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /api/profile/skills.
 */
public class SkillRequest {

    @NotBlank(message = "Skill name is required")
    @Size(min = 1, max = 100, message = "Skill name must be between 1 and 100 characters")
    private String name;

    // ── Getters & Setters ─────────────────────────────────────

    public String getName()              { return name; }
    public void   setName(String name)   { this.name = name; }
}
