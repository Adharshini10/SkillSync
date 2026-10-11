package com.skillsync.controller;

import com.skillsync.dto.ChatMessageDTO;
import com.skillsync.dto.SendMessageRequest;
import com.skillsync.service.ChatMessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Chat conversation history, read status, and message sending.
 *
 * Endpoints:
 *  - GET  /api/chat/{userId}      -> Get conversation history with connected student (200)
 *  - PUT  /api/chat/{userId}/read -> Mark messages received from userId as READ (200)
 *  - GET  /api/chat/unread        -> Get unread messages for current user (200)
 *  - POST /api/chat/send          -> Send private message (REST alternative/fallback) (201)
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatMessageService chatMessageService;

    public ChatController(ChatMessageService chatMessageService) {
        this.chatMessageService = chatMessageService;
    }

    /**
     * Retrieve conversation history with a connected student.
     * GET /api/chat/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<ChatMessageDTO>> getConversation(@PathVariable Long userId) {
        return ResponseEntity.ok(chatMessageService.getConversation(userId));
    }

    /**
     * Send a private message (saves to DB and broadcasts over WebSocket in real time).
     * POST /api/chat/send
     */
    @PostMapping("/send")
    public ResponseEntity<ChatMessageDTO> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        ChatMessageDTO sent = chatMessageService.sendMessageFromRest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sent);
    }

    /**
     * Mark all unread messages received from a specific sender as READ.
     * PUT /api/chat/{userId}/read
     */
    @PutMapping("/{userId}/read")
    public ResponseEntity<Map<String, Object>> markMessagesAsRead(@PathVariable Long userId) {
        int markedCount = chatMessageService.markMessagesAsRead(userId);
        return ResponseEntity.ok(Map.of(
                "message", "Messages marked as read",
                "markedCount", markedCount
        ));
    }

    /**
     * Retrieve all unread messages received by the current user.
     * GET /api/chat/unread
     */
    @GetMapping("/unread")
    public ResponseEntity<List<ChatMessageDTO>> getUnreadMessages() {
        return ResponseEntity.ok(chatMessageService.getUnreadMessages());
    }

    /**
     * Delete a sent message (Sender only).
     * DELETE /api/chat/messages/{messageId}
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Map<String, String>> deleteMessage(@PathVariable Long messageId) {
        chatMessageService.deleteMessage(messageId);
        return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
    }
}
