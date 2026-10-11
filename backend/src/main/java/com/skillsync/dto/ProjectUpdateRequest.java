package com.skillsync.dto;

import com.skillsync.model.ProjectStatus;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request DTO for updating an existing Project.
 * All fields are optional — null values mean "leave unchanged".
 */
public class ProjectUpdateRequest {

    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @Size(min = 5, max = 3000, message = "Description must be between 5 and 3000 characters")
    private String description;

    private List<String> requiredSkills;

    private ProjectStatus status;

    private Integer maxMembers;

    private String lookingFor;

    private List<String> lookingForRoles;

    public ProjectUpdateRequest() {}

    public ProjectUpdateRequest(String title, String description, List<String> requiredSkills, ProjectStatus status) {
        this.title          = title;
        this.description    = description;
        this.requiredSkills = requiredSkills;
        this.status         = status;
    }

    public ProjectUpdateRequest(String title, String description, List<String> requiredSkills, ProjectStatus status, Integer maxMembers, String lookingFor) {
        this.title          = title;
        this.description    = description;
        this.requiredSkills = requiredSkills;
        this.status         = status;
        this.maxMembers     = maxMembers;
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

    public ProjectStatus getStatus() {
        return status;
    }

    public void setStatus(ProjectStatus status) {
        this.status = status;
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
