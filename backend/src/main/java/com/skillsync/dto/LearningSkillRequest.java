package com.skillsync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /api/profile/learning-skills.
 */
public class LearningSkillRequest {

    @NotBlank(message = "Skill name is required")
    @Size(min = 1, max = 100, message = "Skill name must be between 1 and 100 characters")
    private String name;

    public LearningSkillRequest() {}

    public LearningSkillRequest(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
