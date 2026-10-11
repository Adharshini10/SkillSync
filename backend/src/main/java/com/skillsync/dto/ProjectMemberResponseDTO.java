package com.skillsync.dto;

import com.skillsync.model.MembershipStatus;
import com.skillsync.model.Project;
import com.skillsync.model.ProjectMember;

import java.time.LocalDateTime;

/**
 * DTO representing an accepted member or owner of a project.
 * Never exposes passwords or sensitive credentials.
 */
public class ProjectMemberResponseDTO {

    private Long membershipId;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long projectId;
    private String projectTitle;
    private MembershipStatus status;
    private boolean isOwner;
    private LocalDateTime requestedAt;
    private LocalDateTime joinedAt;

    public ProjectMemberResponseDTO() {}

    public static ProjectMemberResponseDTO from(ProjectMember member) {
        ProjectMemberResponseDTO dto = new ProjectMemberResponseDTO();
        dto.membershipId = member.getId();
        dto.status       = member.getStatus();
        dto.requestedAt  = member.getRequestedAt();
        dto.joinedAt     = member.getJoinedAt();
        dto.isOwner      = false;

        if (member.getUser() != null) {
            dto.userId    = member.getUser().getId();
            dto.userName  = member.getUser().getName();
            dto.userEmail = member.getUser().getEmail();
        }

        if (member.getProject() != null) {
            dto.projectId    = member.getProject().getId();
            dto.projectTitle = member.getProject().getTitle();
            if (member.getProject().getOwner() != null && member.getUser() != null) {
                dto.isOwner = member.getProject().getOwner().getId().equals(member.getUser().getId());
            }
        }

        return dto;
    }

    public static ProjectMemberResponseDTO forOwner(Project project) {
        ProjectMemberResponseDTO dto = new ProjectMemberResponseDTO();
        dto.membershipId = 0L;
        dto.status       = MembershipStatus.ACCEPTED;
        dto.requestedAt  = project.getCreatedAt();
        dto.joinedAt     = project.getCreatedAt();
        dto.isOwner      = true;

        if (project.getOwner() != null) {
            dto.userId    = project.getOwner().getId();
            dto.userName  = project.getOwner().getName();
            dto.userEmail = project.getOwner().getEmail();
        }

        dto.projectId    = project.getId();
        dto.projectTitle = project.getTitle();
        return dto;
    }

    public Long getMembershipId() {
        return membershipId;
    }

    public void setMembershipId(Long membershipId) {
        this.membershipId = membershipId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public void setProjectTitle(String projectTitle) {
        this.projectTitle = projectTitle;
    }

    public MembershipStatus getStatus() {
        return status;
    }

    public void setStatus(MembershipStatus status) {
        this.status = status;
    }

    public boolean isOwner() {
        return isOwner;
    }

    public void setOwner(boolean owner) {
        isOwner = owner;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}
