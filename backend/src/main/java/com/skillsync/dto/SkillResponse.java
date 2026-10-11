package com.skillsync.dto;

import com.skillsync.model.Skill;

/**
 * Response body for skill-related endpoints.
 * Maps from the Skill entity — does NOT include the back-reference to users.
 */
public class SkillResponse {

    private Long   id;
    private String name;

    /** Static factory — build from a Skill entity. */
    public static SkillResponse from(Skill skill) {
        SkillResponse r = new SkillResponse();
        r.id   = skill.getId();
        r.name = skill.getName();
        return r;
    }

    // ── Getters ───────────────────────────────────────────────

    public Long   getId()   { return id; }
    public String getName() { return name; }
}
