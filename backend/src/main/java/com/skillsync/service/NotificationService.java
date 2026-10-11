package com.skillsync.service;

import com.skillsync.dto.NotificationDTO;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.Notification;
import com.skillsync.model.NotificationType;
import com.skillsync.model.User;
import com.skillsync.repository.NotificationRepository;
import com.skillsync.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing user notifications and STOMP WebSocket broadcasting.
 */
@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;
    private final SimpMessagingTemplate  messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository         = userRepository;
        this.messagingTemplate      = messagingTemplate;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    /**
     * Create and persist a notification, and deliver it via WebSocket if active.
     */
    public NotificationDTO createNotification(User recipient, User actor, NotificationType type,
                                              String title, String message, Long referenceId) {
        if (recipient == null) return null;
        if (actor != null && recipient.getId().equals(actor.getId())) {
            return null; // Don't notify oneself
        }

        Notification notification = new Notification(recipient, actor, type, title, message, referenceId);
        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = NotificationDTO.from(saved);

        // Real-time delivery to user's private queue: /user/{email}/queue/notifications
        try {
            messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/notifications", dto);
        } catch (Exception ignored) {
            // STOMP session might not be active, message is already safely persisted in MySQL
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getMyNotifications() {
        User user = getAuthenticatedUser();
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User user = getAuthenticatedUser();
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    public NotificationDTO markAsRead(Long notificationId) {
        User user = getAuthenticatedUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new AccessDeniedException("You cannot mark another user's notification as read");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationDTO.from(saved);
    }

    public void markAllAsRead() {
        User user = getAuthenticatedUser();
        List<Notification> list = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
        for (Notification n : list) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(list);
    }

    public void deleteNotification(Long notificationId) {
        User user = getAuthenticatedUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new AccessDeniedException("You cannot delete another user's notification");
        }

        notificationRepository.delete(notification);
    }
}
