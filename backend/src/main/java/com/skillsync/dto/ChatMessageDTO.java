package com.skillsync.dto;

import com.skillsync.model.ChatMessage;
import com.skillsync.model.MessageReadStatus;

import java.time.LocalDateTime;

/**
 * Safe DTO for delivering chat messages over WebSocket and REST history APIs.
 * Never exposes credentials or sensitive information.
 */
public class ChatMessageDTO {

    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private String content;
    private LocalDateTime sentAt;
    private MessageReadStatus readStatus;

    public ChatMessageDTO() {}

    public static ChatMessageDTO from(ChatMessage message) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.id         = message.getId();
        dto.content    = message.getContent();
        dto.sentAt     = message.getSentAt();
        dto.readStatus = message.getReadStatus();

        if (message.getSender() != null) {
            dto.senderId   = message.getSender().getId();
            dto.senderName = message.getSender().getName();
        }

        if (message.getReceiver() != null) {
            dto.receiverId   = message.getReceiver().getId();
            dto.receiverName = message.getReceiver().getName();
        }

        return dto;
    }

    public Long getId() {
        return id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public MessageReadStatus getReadStatus() {
        return readStatus;
    }
}
