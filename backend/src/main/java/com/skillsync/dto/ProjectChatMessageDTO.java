package com.skillsync.dto;

import com.skillsync.model.ProjectChatMessage;

import java.time.LocalDateTime;

/**
 * Response DTO representing a project group chat message.
 * Never exposes passwords or sensitive credentials.
 */
public class ProjectChatMessageDTO {

    private Long id;
    private Long projectId;
    private String projectTitle;
    private Long senderId;
    private String senderName;
    private String content;
    private LocalDateTime sentAt;

    public ProjectChatMessageDTO() {}

    public static ProjectChatMessageDTO from(ProjectChatMessage msg) {
        ProjectChatMessageDTO dto = new ProjectChatMessageDTO();
        dto.id = msg.getId();
        if (msg.getProject() != null) {
            dto.projectId    = msg.getProject().getId();
            dto.projectTitle = msg.getProject().getTitle();
        }
        if (msg.getSender() != null) {
            dto.senderId   = msg.getSender().getId();
            dto.senderName = msg.getSender().getName();
        }
        dto.content = msg.getContent();
        dto.sentAt  = msg.getSentAt();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }
}
