package com.skillsync.service;

import com.skillsync.dto.ChatMessageDTO;
import com.skillsync.dto.SendMessageRequest;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.*;
import com.skillsync.repository.ChatMessageRepository;
import com.skillsync.repository.ConnectionRepository;
import com.skillsync.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service managing private one-to-one chat, connection authorization, and message delivery.
 */
@Service
@Transactional
public class ChatMessageService {

    private final ChatMessageRepository  chatMessageRepository;
    private final ConnectionRepository   connectionRepository;
    private final UserRepository         userRepository;
    private final SimpMessagingTemplate  messagingTemplate;
    private final NotificationService    notificationService;

    public ChatMessageService(ChatMessageRepository chatMessageRepository,
                              ConnectionRepository connectionRepository,
                              UserRepository userRepository,
                              SimpMessagingTemplate messagingTemplate,
                              NotificationService notificationService) {
        this.chatMessageRepository = chatMessageRepository;
        this.connectionRepository  = connectionRepository;
        this.userRepository        = userRepository;
        this.messagingTemplate     = messagingTemplate;
        this.notificationService   = notificationService;
    }

    // ── Helper: resolve currently authenticated user from JWT ─
    public User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    // ── Helper: verify that two users have an ACCEPTED connection
    public void verifyConnection(User user1, User user2) {
        Optional<Connection> connOpt = connectionRepository.findConnectionBetween(user1, user2);

        if (connOpt.isEmpty() || connOpt.get().getStatus() != ConnectionStatus.ACCEPTED) {
            throw new AccessDeniedException("You can only privately chat with students who have an ACCEPTED connection with you");
        }
    }

    // ── 1. Send Message ───────────────────────────────────────
    public ChatMessageDTO sendMessage(User sender, SendMessageRequest request) {
        if (request.getReceiverId() == null) {
            throw new IllegalArgumentException("Receiver ID is required");
        }

        // Rule: Cannot message oneself
        if (sender.getId().equals(request.getReceiverId())) {
            throw new IllegalArgumentException("You cannot send a message to yourself");
        }

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found with id: " + request.getReceiverId()));

        String content = request.getContent() != null ? request.getContent().trim() : "";
        if (content.isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }
        if (content.length() > 1000) {
            throw new IllegalArgumentException("Message content cannot exceed 1000 characters");
        }

        // Authorization Rule: Must have an ACCEPTED connection
        verifyConnection(sender, receiver);

        // Save message to MySQL
        ChatMessage message = new ChatMessage(sender, receiver, content);
        ChatMessage saved = chatMessageRepository.save(message);

        ChatMessageDTO dto = ChatMessageDTO.from(saved);

        // Deliver message in real-time over WebSocket to receiver's private queue: /user/{email}/queue/messages
        messagingTemplate.convertAndSendToUser(receiver.getEmail(), "/queue/messages", dto);

        // Also deliver a copy to sender's private queue so multi-device clients update instantly
        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/messages", dto);

        // Notify receiver of new incoming message
        try {
            String preview = content.length() > 45 ? content.substring(0, 42) + "..." : content;
            notificationService.createNotification(
                    receiver,
                    sender,
                    NotificationType.PRIVATE_MESSAGE,
                    "New Message from " + sender.getName(),
                    preview,
                    sender.getId()
            );
        } catch (Exception ignored) {}

        return dto;
    }

    // Overload for REST API where sender is from SecurityContext
    public ChatMessageDTO sendMessageFromRest(SendMessageRequest request) {
        User sender = getAuthenticatedUser();
        return sendMessage(sender, request);
    }

    // ── 2. Get Conversation History ───────────────────────────
    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getConversation(Long targetUserId) {
        User current = getAuthenticatedUser();
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        // Authorization Rule: Only connected students can access the conversation
        verifyConnection(current, target);

        List<ChatMessage> messages = chatMessageRepository.findConversationBetween(current, target);
        return messages.stream()
                .map(ChatMessageDTO::from)
                .collect(Collectors.toList());
    }

    // ── 3. Mark Messages as Read ──────────────────────────────
    public int markMessagesAsRead(Long senderUserId) {
        User receiver = getAuthenticatedUser();
        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + senderUserId));

        verifyConnection(receiver, sender);

        List<ChatMessage> unread = chatMessageRepository.findByReceiverAndSenderAndReadStatus(receiver, sender, MessageReadStatus.SENT);
        for (ChatMessage msg : unread) {
            msg.setReadStatus(MessageReadStatus.READ);
        }
        chatMessageRepository.saveAll(unread);
        return unread.size();
    }

    // ── 4. Get Unread Messages ────────────────────────────────
    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getUnreadMessages() {
        User current = getAuthenticatedUser();
        List<ChatMessage> unread = chatMessageRepository.findByReceiverAndReadStatusOrderBySentAtDesc(current, MessageReadStatus.SENT);
        return unread.stream()
                .map(ChatMessageDTO::from)
                .collect(Collectors.toList());
    }

    // ── 5. Delete Message (Sender only) ───────────────────────
    public void deleteMessage(Long messageId) {
        User current = getAuthenticatedUser();
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));

        // Rule: Only the sender can delete their own message
        if (!message.getSender().getId().equals(current.getId())) {
            throw new AccessDeniedException("You can only delete messages that you sent");
        }

        chatMessageRepository.delete(message);
    }
}
