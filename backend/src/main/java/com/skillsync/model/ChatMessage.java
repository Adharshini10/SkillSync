package com.skillsync.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * JPA entity representing a private one-to-one chat message between two connected students.
 */
@Entity
@Table(
    name = "chat_messages",
    indexes = {
        @Index(name = "idx_chat_participants", columnList = "sender_id, receiver_id"),
        @Index(name = "idx_chat_receiver_status", columnList = "receiver_id, read_status")
    }
)
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 1000, message = "Message content cannot exceed 1000 characters")
    @Column(nullable = false, length = 1000)
    private String content;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "read_status", nullable = false, length = 20)
    private MessageReadStatus readStatus = MessageReadStatus.SENT;

    // ── Lifecycle callbacks ───────────────────────────────────

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
        if (readStatus == null) {
            readStatus = MessageReadStatus.SENT;
        }
    }

    // ── Constructors ──────────────────────────────────────────

    public ChatMessage() {}

    public ChatMessage(User sender, User receiver, String content) {
        this.sender     = sender;
        this.receiver   = receiver;
        this.content    = content;
        this.sentAt     = LocalDateTime.now();
        this.readStatus = MessageReadStatus.SENT;
    }

    // ── Getters & Setters ─────────────────────────────────────

    public Long getId() {
        return id;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public User getReceiver() {
        return receiver;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public MessageReadStatus getReadStatus() {
        return readStatus;
    }

    public void setReadStatus(MessageReadStatus readStatus) {
        this.readStatus = readStatus;
    }
}
