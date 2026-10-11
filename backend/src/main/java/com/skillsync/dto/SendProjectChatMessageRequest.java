package com.skillsync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for sending a group chat message in a project.
 * Sender identity is NEVER passed from the client; it is determined strictly from JWT / Principal.
 */
public class SendProjectChatMessageRequest {

    private Long projectId;

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 1000, message = "Message content cannot exceed 1000 characters")
    private String content;

    public SendProjectChatMessageRequest() {}

    public SendProjectChatMessageRequest(Long projectId, String content) {
        this.projectId = projectId;
        this.content   = content;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
