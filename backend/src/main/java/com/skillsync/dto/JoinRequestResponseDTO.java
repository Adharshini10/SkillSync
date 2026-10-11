package com.skillsync.dto;

import com.skillsync.model.MembershipStatus;
import com.skillsync.model.ProjectMember;
import com.skillsync.model.User;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO representing a join request for a project.
 */
public class JoinRequestResponseDTO {

    private Long membershipId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userBio;
    private String userLocation;
    private String userEducation;
    private String userProfilePicture;
    private List<String> userSkills = new ArrayList<>();

    private Long projectId;
    private String projectTitle;
    private String ownerName;
    private MembershipStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime joinedAt;

    public JoinRequestResponseDTO() {}

    public static JoinRequestResponseDTO from(ProjectMember member) {
        JoinRequestResponseDTO dto = new JoinRequestResponseDTO();
        dto.membershipId = member.getId();
        dto.status       = member.getStatus();
        dto.requestedAt  = member.getRequestedAt();
        dto.joinedAt     = member.getJoinedAt();

        if (member.getUser() != null) {
            User u = member.getUser();
            dto.userId    = u.getId();
            dto.userName  = u.getName();
            dto.userEmail = u.getEmail();

            if (u.getProfile() != null) {
                dto.userBio            = u.getProfile().getBio();
                dto.userLocation       = u.getProfile().getLocation();
                dto.userEducation      = u.getProfile().getEducation();
                dto.userProfilePicture = u.getProfile().getProfilePicture();
            }

            if (u.getSkills() != null) {
                dto.userSkills = u.getSkills().stream()
                        .map(s -> s.getName())
                        .collect(Collectors.toList());
            }
        }

        if (member.getProject() != null) {
            dto.projectId    = member.getProject().getId();
            dto.projectTitle = member.getProject().getTitle();
            if (member.getProject().getOwner() != null) {
                dto.ownerName = member.getProject().getOwner().getName();
            }
        }

        return dto;
    }

    public Long getMembershipId() {
        return membershipId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public String getUserBio() {
        return userBio;
    }

    public String getUserLocation() {
        return userLocation;
    }

    public String getUserEducation() {
        return userEducation;
    }

    public String getUserProfilePicture() {
        return userProfilePicture;
    }

    public List<String> getUserSkills() {
        return userSkills;
    }

    public Long getProjectId() {
        return projectId;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public MembershipStatus getStatus() {
        return status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
}
