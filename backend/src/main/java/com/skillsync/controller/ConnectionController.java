package com.skillsync.controller;

import com.skillsync.dto.ConnectionResponseDTO;
import com.skillsync.service.ConnectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Student-to-Student Connections.
 *
 * Endpoints:
 *  - POST   /api/connections/{userId}               -> Send connection request (201)
 *  - GET    /api/connections/requests/received      -> View received pending requests (200)
 *  - GET    /api/connections/requests/sent          -> View sent pending requests (200)
 *  - PUT    /api/connections/{connectionId}/accept  -> Accept connection request (200)
 *  - PUT    /api/connections/{connectionId}/reject  -> Reject connection request (200)
 *  - GET    /api/connections                        -> View accepted connections (200)
 *  - DELETE /api/connections/{connectionId}         -> Remove connection (200)
 */
@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    /**
     * Send connection request to another student.
     * POST /api/connections/{userId}
     */
    @PostMapping("/{userId}")
    public ResponseEntity<ConnectionResponseDTO> sendConnectionRequest(@PathVariable Long userId) {
        ConnectionResponseDTO response = connectionService.sendConnectionRequest(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * View received pending connection requests.
     * GET /api/connections/requests/received
     */
    @GetMapping("/requests/received")
    public ResponseEntity<List<ConnectionResponseDTO>> getReceivedRequests() {
        return ResponseEntity.ok(connectionService.getReceivedRequests());
    }

    /**
     * View sent pending connection requests.
     * GET /api/connections/requests/sent
     */
    @GetMapping("/requests/sent")
    public ResponseEntity<List<ConnectionResponseDTO>> getSentRequests() {
        return ResponseEntity.ok(connectionService.getSentRequests());
    }

    /**
     * Accept a pending connection request (Receiver only).
     * PUT /api/connections/{connectionId}/accept
     */
    @PutMapping("/{connectionId}/accept")
    public ResponseEntity<ConnectionResponseDTO> acceptRequest(@PathVariable Long connectionId) {
        return ResponseEntity.ok(connectionService.acceptRequest(connectionId));
    }

    /**
     * Reject a pending connection request (Receiver only).
     * PUT /api/connections/{connectionId}/reject
     */
    @PutMapping("/{connectionId}/reject")
    public ResponseEntity<ConnectionResponseDTO> rejectRequest(@PathVariable Long connectionId) {
        return ResponseEntity.ok(connectionService.rejectRequest(connectionId));
    }

    /**
     * View all accepted connections of the current user.
     * GET /api/connections
     */
    @GetMapping
    public ResponseEntity<List<ConnectionResponseDTO>> getMyConnections() {
        return ResponseEntity.ok(connectionService.getMyConnections());
    }

    /**
     * Remove an existing connection.
     * DELETE /api/connections/{connectionId}
     */
    @DeleteMapping("/{connectionId}")
    public ResponseEntity<Map<String, String>> removeConnection(@PathVariable Long connectionId) {
        connectionService.removeConnection(connectionId);
        return ResponseEntity.ok(Map.of("message", "Connection removed successfully"));
    }
}
