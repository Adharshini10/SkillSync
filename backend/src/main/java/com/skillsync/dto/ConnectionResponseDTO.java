package com.skillsync.dto;

import com.skillsync.model.Connection;
import com.skillsync.model.ConnectionStatus;
import com.skillsync.model.User;

import java.time.LocalDateTime;

/**
 * Response DTO representing a student connection or connection request.
 * Contains information about the other party involved in the connection.
 * Never exposes passwords or credentials.
 */
public class ConnectionResponseDTO {

    private Long connectionId;
    private Long userId;
    private String userName;
    private String userEmail;
    private ConnectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private java.util.List<String> skills = new java.util.ArrayList<>();

    public ConnectionResponseDTO() {}

    public static ConnectionResponseDTO from(Connection conn, User otherUser) {
        ConnectionResponseDTO dto = new ConnectionResponseDTO();
        dto.connectionId = conn.getId();
        dto.status       = conn.getStatus();
        dto.createdAt    = conn.getCreatedAt();
        dto.updatedAt    = conn.getUpdatedAt();

        if (otherUser != null) {
            dto.userId    = otherUser.getId();
            dto.userName  = otherUser.getName();
            dto.userEmail = otherUser.getEmail();
            if (otherUser.getSkills() != null) {
                dto.skills = otherUser.getSkills().stream()
                        .map(com.skillsync.model.Skill::getName)
                        .collect(java.util.stream.Collectors.toList());
            }
        }

        return dto;
    }

    public java.util.List<String> getSkills() {
        return skills;
    }

    public Long getConnectionId() {
        return connectionId;
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

    public ConnectionStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
