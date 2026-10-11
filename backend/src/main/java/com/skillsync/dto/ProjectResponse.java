package com.skillsync.dto;

import com.skillsync.model.Project;
import com.skillsync.model.ProjectStatus;
import com.skillsync.model.User;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO representing project details.
 * Never exposes sensitive information such as user passwords.
 */
public class ProjectResponse {

    private Long id;
    private String title;
    private String description;
    private ProjectStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<SkillResponse> requiredSkills = new ArrayList<>();
    private ProjectOwnerResponse owner;
    private Integer maxMembers = 5;
    private Integer currentMembers = 1;
    private String lookingFor;
    private List<String> lookingForRoles = new ArrayList<>();

    public ProjectResponse() {}

    /**
     * Factory method to create a ProjectResponse from a Project entity.
     */
    public static ProjectResponse from(Project project) {
        return from(project, 1);
    }

    /**
     * Factory method to create a ProjectResponse with calculated member count.
     */
    public static ProjectResponse from(Project project, int memberCount) {
        ProjectResponse r = new ProjectResponse();
        r.id          = project.getId();
        r.title       = project.getTitle();
        r.description = project.getDescription();
        r.status      = project.getStatus();
        r.createdAt   = project.getCreatedAt();
        r.updatedAt   = project.getUpdatedAt();
        r.maxMembers  = project.getMaxMembers() != null ? project.getMaxMembers() : 5;
        r.currentMembers = Math.max(1, memberCount);
        r.lookingFor  = project.getLookingFor();

        if (project.getLookingFor() != null && !project.getLookingFor().isBlank()) {
            r.lookingForRoles = java.util.Arrays.stream(project.getLookingFor().split("[,•\n]"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        if (project.getRequiredSkills() != null) {
            r.requiredSkills = project.getRequiredSkills().stream()
                    .map(SkillResponse::from)
                    .collect(Collectors.toList());
        }

        if (project.getOwner() != null) {
            r.owner = ProjectOwnerResponse.from(project.getOwner());
        }

        return r;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public ProjectStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<SkillResponse> getRequiredSkills() {
        return requiredSkills;
    }

    public ProjectOwnerResponse getOwner() {
        return owner;
    }

    public Integer getMaxMembers() {
        return maxMembers;
    }

    public Integer getCurrentMembers() {
        return currentMembers;
    }

    public String getLookingFor() {
        return lookingFor;
    }

    public List<String> getLookingForRoles() {
        return lookingForRoles;
    }

    /**
     * Safe owner information DTO (excludes password).
     */
    public static class ProjectOwnerResponse {
        private Long id;
        private String name;
        private String email;

        public ProjectOwnerResponse() {}

        public ProjectOwnerResponse(Long id, String name, String email) {
            this.id    = id;
            this.name  = name;
            this.email = email;
        }

        public static ProjectOwnerResponse from(User user) {
            if (user == null) return null;
            return new ProjectOwnerResponse(user.getId(), user.getName(), user.getEmail());
        }

        public Long getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }
    }
}
