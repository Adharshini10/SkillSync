package com.skillsync.controller;

import com.skillsync.dto.ProjectChatMessageDTO;
import com.skillsync.dto.SendProjectChatMessageRequest;
import com.skillsync.service.ProjectChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Project Group Chat history and message dispatch.
 *
 * Endpoints:
 *  - GET  /api/projects/{projectId}/chat      -> Retrieve chat history (Accepted members/owner only) (200)
 *  - POST /api/projects/{projectId}/chat/send -> Send message in project chat (Accepted members/owner only) (201)
 */
@RestController
@RequestMapping("/api/projects/{projectId}/chat")
public class ProjectChatController {

    private final ProjectChatService projectChatService;

    public ProjectChatController(ProjectChatService projectChatService) {
        this.projectChatService = projectChatService;
    }

    /**
     * Get group chat history for a project.
     * Only ACCEPTED project members and the project owner can access.
     * GET /api/projects/{projectId}/chat
     */
    @GetMapping
    public ResponseEntity<List<ProjectChatMessageDTO>> getProjectChatHistory(@PathVariable Long projectId) {
        List<ProjectChatMessageDTO> history = projectChatService.getProjectChatHistory(projectId);
        return ResponseEntity.ok(history);
    }

    /**
     * Send a message to project group chat via REST (alternative/testing endpoint).
     * POST /api/projects/{projectId}/chat/send
     */
    @PostMapping("/send")
    public ResponseEntity<ProjectChatMessageDTO> sendMessage(
            @PathVariable Long projectId,
            @Valid @RequestBody SendProjectChatMessageRequest request) {
        request.setProjectId(projectId);
        ProjectChatMessageDTO response = projectChatService.sendMessageFromRest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
