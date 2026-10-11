package com.skillsync.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket and STOMP message broker configuration.
 *
 * Endpoints:
 *  - /ws (supports both SockJS and raw WebSocket)
 *
 * Prefixes:
 *  - /app   : inbound messages to @MessageMapping controllers
 *  - /queue : user-specific private destination broker
 *  - /user  : user destination prefix for targeted messaging
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;

    public WebSocketConfig(WebSocketAuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Raw WebSocket endpoint (for Postman / standard WS clients)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");

        // SockJS fallback endpoint (for frontend SockJS clients)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable in-memory broker for private queues and general topics
        registry.enableSimpleBroker("/queue", "/topic", "/user");

        // Application prefix for messages sent by clients
        registry.setApplicationDestinationPrefixes("/app");

        // Prefix for private user-targeted destinations (/user/{email}/queue/messages)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Attach JWT authentication interceptor to client inbound STOMP frames
        registration.interceptors(authInterceptor);
    }
}
