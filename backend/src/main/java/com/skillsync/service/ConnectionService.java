package com.skillsync.service;

import com.skillsync.dto.ConnectionResponseDTO;
import com.skillsync.dto.UserResponseDTO;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.Connection;
import com.skillsync.model.ConnectionStatus;
import com.skillsync.model.NotificationType;
import com.skillsync.model.Profile;
import com.skillsync.model.User;
import com.skillsync.repository.ConnectionRepository;
import com.skillsync.repository.ProfileRepository;
import com.skillsync.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service managing student-to-student connections and user discovery.
 */
@Service
@Transactional
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository       userRepository;
    private final ProfileRepository    profileRepository;
    private final NotificationService  notificationService;

    public ConnectionService(ConnectionRepository connectionRepository,
                             UserRepository userRepository,
                             ProfileRepository profileRepository,
                             NotificationService notificationService) {
        this.connectionRepository = connectionRepository;
        this.userRepository       = userRepository;
        this.profileRepository    = profileRepository;
        this.notificationService  = notificationService;
    }

    // ── Helper: resolve currently authenticated user from JWT ─
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    // ── 1. Send Connection Request ────────────────────────────
    public ConnectionResponseDTO sendConnectionRequest(Long receiverId) {
        User sender = getAuthenticatedUser();

        // Rule 2: Cannot connect with self
        if (sender.getId().equals(receiverId)) {
            throw new IllegalArgumentException("You cannot send a connection request to yourself");
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + receiverId));

        // Check for existing connection in EITHER direction
        Optional<Connection> existingOpt = connectionRepository.findConnectionBetween(sender, receiver);

        if (existingOpt.isPresent()) {
            Connection existing = existingOpt.get();

            // Already connected
            if (existing.getStatus() == ConnectionStatus.ACCEPTED) {
                throw new IllegalArgumentException("You are already connected with this user");
            }

            // Already pending
            if (existing.getStatus() == ConnectionStatus.PENDING) {
                if (existing.getSender().getId().equals(sender.getId())) {
                    throw new IllegalArgumentException("You already have a pending connection request to this user");
                } else {
                    throw new IllegalArgumentException("This user has already sent you a connection request. Please accept it instead.");
                }
            }

            // If REJECTED, cleanly reactivate
            if (existing.getStatus() == ConnectionStatus.REJECTED) {
                existing.setSender(sender);
                existing.setReceiver(receiver);
                existing.setStatus(ConnectionStatus.PENDING);
                existing.setCreatedAt(LocalDateTime.now());
                existing.setUpdatedAt(LocalDateTime.now());
                Connection saved = connectionRepository.save(existing);
                try {
                    notificationService.createNotification(
                            receiver,
                            sender,
                            NotificationType.CONNECTION_REQUEST,
                            "New Connection Request",
                            sender.getName() + " sent you a connection request to swap skills.",
                            saved.getId()
                    );
                } catch (Exception ignored) {}
                return ConnectionResponseDTO.from(saved, receiver);
            }
        }

        // Create fresh connection request
        Connection connection = new Connection(sender, receiver, ConnectionStatus.PENDING);
        Connection saved = connectionRepository.save(connection);
        try {
            notificationService.createNotification(
                    receiver,
                    sender,
                    NotificationType.CONNECTION_REQUEST,
                    "New Connection Request",
                    sender.getName() + " sent you a connection request to swap skills.",
                    saved.getId()
            );
        } catch (Exception ignored) {}
        return ConnectionResponseDTO.from(saved, receiver);
    }

    // ── 2. Get Received Requests (PENDING) ────────────────────
    @Transactional(readOnly = true)
    public List<ConnectionResponseDTO> getReceivedRequests() {
        User current = getAuthenticatedUser();
        return connectionRepository.findByReceiverAndStatusOrderByCreatedAtDesc(current, ConnectionStatus.PENDING)
                .stream()
                .map(c -> ConnectionResponseDTO.from(c, c.getSender()))
                .collect(Collectors.toList());
    }

    // ── 3. Get Sent Requests (PENDING) ────────────────────────
    @Transactional(readOnly = true)
    public List<ConnectionResponseDTO> getSentRequests() {
        User current = getAuthenticatedUser();
        return connectionRepository.findBySenderAndStatusOrderByCreatedAtDesc(current, ConnectionStatus.PENDING)
                .stream()
                .map(c -> ConnectionResponseDTO.from(c, c.getReceiver()))
                .collect(Collectors.toList());
    }

    // ── 4. Accept Request (Receiver only) ─────────────────────
    public ConnectionResponseDTO acceptRequest(Long connectionId) {
        User current = getAuthenticatedUser();
        Connection conn = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection request not found with id: " + connectionId));

        // Rule 3 & 5: Only receiver can accept
        if (!conn.getReceiver().getId().equals(current.getId())) {
            throw new AccessDeniedException("Only the recipient of the request can accept it");
        }

        if (conn.getStatus() != ConnectionStatus.PENDING) {
            throw new IllegalArgumentException("Only pending connection requests can be accepted. Current status: " + conn.getStatus());
        }

        conn.setStatus(ConnectionStatus.ACCEPTED);
        Connection saved = connectionRepository.save(conn);
        try {
            notificationService.createNotification(
                    conn.getSender(),
                    current,
                    NotificationType.CONNECTION_ACCEPTED,
                    "Connection Accepted",
                    current.getName() + " accepted your connection request! You can now chat together.",
                    saved.getId()
            );
        } catch (Exception ignored) {}
        return ConnectionResponseDTO.from(saved, conn.getSender());
    }

    // ── 5. Reject Request (Receiver only) ─────────────────────
    public ConnectionResponseDTO rejectRequest(Long connectionId) {
        User current = getAuthenticatedUser();
        Connection conn = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection request not found with id: " + connectionId));

        // Rule 4 & 6: Only receiver can reject
        if (!conn.getReceiver().getId().equals(current.getId())) {
            throw new AccessDeniedException("Only the recipient of the request can reject it");
        }

        if (conn.getStatus() != ConnectionStatus.PENDING) {
            throw new IllegalArgumentException("Only pending connection requests can be rejected. Current status: " + conn.getStatus());
        }

        conn.setStatus(ConnectionStatus.REJECTED);
        Connection saved = connectionRepository.save(conn);
        try {
            notificationService.createNotification(
                    conn.getSender(),
                    current,
                    NotificationType.CONNECTION_REJECTED,
                    "Connection Declined",
                    current.getName() + " declined your connection request.",
                    saved.getId()
            );
        } catch (Exception ignored) {}
        return ConnectionResponseDTO.from(saved, conn.getSender());
    }

    // ── 6. Get My Connections (ACCEPTED) ──────────────────────
    @Transactional(readOnly = true)
    public List<ConnectionResponseDTO> getMyConnections() {
        User current = getAuthenticatedUser();
        return connectionRepository.findAcceptedConnectionsForUser(current)
                .stream()
                .map(c -> {
                    User other = c.getSender().getId().equals(current.getId()) ? c.getReceiver() : c.getSender();
                    return ConnectionResponseDTO.from(c, other);
                })
                .collect(Collectors.toList());
    }

    // ── 7. Remove Connection ──────────────────────────────────
    public void removeConnection(Long connectionId) {
        User current = getAuthenticatedUser();
        Connection conn = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found with id: " + connectionId));

        // Rule 7 & 8: Only participants can remove
        boolean isParticipant = conn.getSender().getId().equals(current.getId())
                || conn.getReceiver().getId().equals(current.getId());

        if (!isParticipant) {
            throw new AccessDeniedException("You do not have permission to delete this connection");
        }

        connectionRepository.delete(conn);
    }

    // ── 8. User Search / Discovery ────────────────────────────
    @Transactional(readOnly = true)
    public List<UserResponseDTO> searchUsers(String nameQuery) {
        List<User> users;
        if (nameQuery != null && !nameQuery.trim().isEmpty()) {
            users = userRepository.findByNameContainingIgnoreCase(nameQuery.trim());
        } else {
            users = userRepository.findAll();
        }

        return users.stream()
                .map(u -> {
                    Profile p = profileRepository.findByUser(u).orElse(null);
                    return UserResponseDTO.from(u, p);
                })
                .collect(Collectors.toList());
    }
}
