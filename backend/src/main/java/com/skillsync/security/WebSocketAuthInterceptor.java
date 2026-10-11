package com.skillsync.security;

import com.skillsync.service.JwtService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Intercepts STOMP WebSocket CONNECT frames and authenticates the user via JWT Bearer Token.
 * Attaches the authenticated Principal to the WebSocket session.
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService         jwtService;
    private final UserDetailsService userDetailsService;
    private final com.skillsync.service.ProjectChatService projectChatService;

    public WebSocketAuthInterceptor(JwtService jwtService,
                                  UserDetailsService userDetailsService,
                                  @org.springframework.context.annotation.Lazy com.skillsync.service.ProjectChatService projectChatService) {
        this.jwtService         = jwtService;
        this.userDetailsService = userDetailsService;
        this.projectChatService = projectChatService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            // ── 1. Authenticate on CONNECT frame ──────────────────
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                // Read Authorization header or token header from STOMP connect headers
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                String token = null;
                if (authHeader != null && !authHeader.isBlank()) {
                    token = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader.trim();
                } else {
                    token = accessor.getFirstNativeHeader("token");
                }

                if (token != null && !token.isBlank()) {
                    try {
                        String userEmail = jwtService.extractUsername(token);
                        if (userEmail != null) {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                            if (jwtService.isTokenValid(token, userDetails)) {
                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(auth);
                            }
                        }
                    } catch (Exception e) {
                        // Invalid token -> connection will remain unauthenticated
                    }
                }
            }

            // ── 2. Authorize on SUBSCRIBE frame ───────────────────
            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null && destination.startsWith("/topic/project/")) {
                    java.security.Principal principal = accessor.getUser();
                    if (principal == null || principal.getName() == null) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                "Authentication required to subscribe to project group chat");
                    }
                    try {
                        String projectIdStr = destination.substring("/topic/project/".length());
                        Long projectId = Long.parseLong(projectIdStr);
                        if (!projectChatService.isUserAuthorizedForProject(principal.getName(), projectId)) {
                            throw new org.springframework.security.access.AccessDeniedException(
                                    "You are not an authorized member of project " + projectId);
                        }
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException("Invalid project destination: " + destination);
                    }
                }
            }
        }

        return message;
    }
}
