package com.skillsync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request DTO for creating a new Project.
 */
public class ProjectRequest {

    @NotBlank(message = "Project title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @NotBlank(message = "Project description is required")
    @Size(min = 5, max = 3000, message = "Description must be between 5 and 3000 characters")
    private String description;

    @NotEmpty(message = "At least one required skill must be specified")
    private List<@NotBlank(message = "Skill name cannot be blank") String> requiredSkills;

    private Integer maxMembers = 5;

    private String lookingFor;

    private List<String> lookingForRoles;

    public ProjectRequest() {}

    public ProjectRequest(String title, String description, List<String> requiredSkills) {
        this.title          = title;
        this.description    = description;
        this.requiredSkills = requiredSkills;
    }

    public ProjectRequest(String title, String description, List<String> requiredSkills, Integer maxMembers, String lookingFor) {
        this.title          = title;
        this.description    = description;
        this.requiredSkills = requiredSkills;
        this.maxMembers     = maxMembers != null ? maxMembers : 5;
        this.lookingFor     = lookingFor;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(List<String> requiredSkills) {
        this.requiredSkills = requiredSkills;
    }

    public Integer getMaxMembers() {
        return maxMembers;
    }

    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers;
    }

    public String getLookingFor() {
        return lookingFor;
    }

    public void setLookingFor(String lookingFor) {
        this.lookingFor = lookingFor;
    }

    public List<String> getLookingForRoles() {
        return lookingForRoles;
    }

    public void setLookingForRoles(List<String> lookingForRoles) {
        this.lookingForRoles = lookingForRoles;
    }
}
