package com.skillsync.dto;

import com.skillsync.model.LearningSkill;

/**
 * Response DTO for learning skill endpoints.
 * Maps from the LearningSkill entity — does not expose user references or internal metadata.
 */
public class LearningSkillDTO {

    private Long id;
    private String name;

    public LearningSkillDTO() {}

    public LearningSkillDTO(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    /** Static factory method to build DTO from entity. */
    public static LearningSkillDTO from(LearningSkill learningSkill) {
        if (learningSkill == null) {
            return null;
        }
        return new LearningSkillDTO(learningSkill.getId(), learningSkill.getName());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
