package com.skillsync.controller;

import com.skillsync.dto.ProjectChatMessageDTO;
import com.skillsync.dto.SendProjectChatMessageRequest;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.User;
import com.skillsync.repository.UserRepository;
import com.skillsync.service.ProjectChatService;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket STOMP controller for project group chat.
 *
 * Inbound destination: /app/project-chat
 * Outbound broadcast:  /topic/project/{projectId}
 */
@Controller
public class ProjectChatWebSocketController {

    private final ProjectChatService projectChatService;
    private final UserRepository     userRepository;

    public ProjectChatWebSocketController(ProjectChatService projectChatService, UserRepository userRepository) {
        this.projectChatService = projectChatService;
        this.userRepository     = userRepository;
    }

    /**
     * Handle group chat messages sent to /app/project-chat.
     * Sender is ALWAYS resolved from the authenticated WebSocket Principal, never trusted from client.
     */
    @MessageMapping("/project-chat")
    public ProjectChatMessageDTO handleProjectChatMessage(Principal principal,
                                                          @Valid @Payload SendProjectChatMessageRequest request) {
        if (principal == null || principal.getName() == null) {
            throw new AccessDeniedException("Authentication required to send project group messages");
        }

        User sender = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));

        return projectChatService.sendMessage(sender, request);
    }
}
