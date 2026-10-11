package com.skillsync.dto;

import com.skillsync.model.Notification;
import com.skillsync.model.NotificationType;

import java.time.LocalDateTime;

public class NotificationDTO {
    private Long id;
    private Long recipientId;
    private Long actorId;
    private String actorName;
    private NotificationType type;
    private String title;
    private String message;
    private Long referenceId;
    private boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationDTO from(Notification n) {
        if (n == null) return null;
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setRecipientId(n.getRecipient() != null ? n.getRecipient().getId() : null);
        dto.setActorId(n.getActor() != null ? n.getActor().getId() : null);
        dto.setActorName(n.getActor() != null ? n.getActor().getName() : null);
        dto.setType(n.getType());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setReferenceId(n.getReferenceId());
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public Long getActorId() {
        return actorId;
    }

    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
