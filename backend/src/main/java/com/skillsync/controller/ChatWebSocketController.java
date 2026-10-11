package com.skillsync.controller;

import com.skillsync.dto.ChatMessageDTO;
import com.skillsync.dto.SendMessageRequest;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.User;
import com.skillsync.repository.UserRepository;
import com.skillsync.service.ChatMessageService;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket STOMP controller for real-time private one-to-one chat.
 *
 * Destination: /app/chat
 */
@Controller
public class ChatWebSocketController {

    private final ChatMessageService chatMessageService;
    private final UserRepository    userRepository;

    public ChatWebSocketController(ChatMessageService chatMessageService, UserRepository userRepository) {
        this.chatMessageService = chatMessageService;
        this.userRepository    = userRepository;
    }

    /**
     * Handle incoming STOMP message sent to /app/chat.
     * Sender is ALWAYS resolved from the authenticated WebSocket Principal, never trusted from client.
     */
    @MessageMapping("/chat")
    public ChatMessageDTO handlePrivateMessage(Principal principal, @Valid @Payload SendMessageRequest request) {
        if (principal == null || principal.getName() == null) {
            throw new AccessDeniedException("Authentication required to send chat messages");
        }

        User sender = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));

        return chatMessageService.sendMessage(sender, request);
    }
}
