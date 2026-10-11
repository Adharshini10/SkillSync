package com.skillsync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for sending a private message.
 * Sender is ALWAYS determined securely from authentication, never accepted in the body.
 */
public class SendMessageRequest {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    @NotBlank(message = "Message content is required")
    @Size(max = 1000, message = "Message content cannot exceed 1000 characters")
    private String content;

    public SendMessageRequest() {}

    public SendMessageRequest(Long receiverId, String content) {
        this.receiverId = receiverId;
        this.content    = content;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
