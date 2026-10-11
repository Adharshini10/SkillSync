package com.skillsync.service;

import com.skillsync.dto.ProjectChatMessageDTO;
import com.skillsync.dto.SendProjectChatMessageRequest;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.*;
import com.skillsync.repository.ProjectChatMessageRepository;
import com.skillsync.repository.ProjectMemberRepository;
import com.skillsync.repository.ProjectRepository;
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
 * Service managing project group chat messages, membership-based authorization,
 * and real-time STOMP broadcasting.
 */
@Service
@Transactional
public class ProjectChatService {

    private final ProjectChatMessageRepository projectChatMessageRepository;
    private final ProjectRepository            projectRepository;
    private final ProjectMemberRepository      projectMemberRepository;
    private final UserRepository               userRepository;
    private final SimpMessagingTemplate        messagingTemplate;

    public ProjectChatService(ProjectChatMessageRepository projectChatMessageRepository,
                              ProjectRepository projectRepository,
                              ProjectMemberRepository projectMemberRepository,
                              UserRepository userRepository,
                              SimpMessagingTemplate messagingTemplate) {
        this.projectChatMessageRepository = projectChatMessageRepository;
        this.projectRepository            = projectRepository;
        this.projectMemberRepository      = projectMemberRepository;
        this.userRepository               = userRepository;
        this.messagingTemplate            = messagingTemplate;
    }

    // ── Helper: resolve currently authenticated user from SecurityContext ─
    public User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    /**
     * Verifies if a user is authorized to participate in a project's group chat.
     * Rules:
     *  1. Project owner is ALWAYS an authorized member.
     *  2. Other students must have a ProjectMember record with status == ACCEPTED.
     *  3. PENDING, REJECTED, or non-members are DENIED access.
     */
    public void verifyProjectMembership(Project project, User user) {
        // Project owner is automatically authorized
        if (project.getOwner() != null && project.getOwner().getId().equals(user.getId())) {
            return;
        }

        Optional<ProjectMember> memberOpt = projectMemberRepository.findByProjectAndUser(project, user);
        if (memberOpt.isEmpty() || memberOpt.get().getStatus() != MembershipStatus.ACCEPTED) {
            throw new AccessDeniedException("You must be an accepted member of this project to access its group chat");
        }
    }

    /**
     * Check authorization by user email and project ID (used for WebSocket STOMP subscription validation).
     */
    @Transactional(readOnly = true)
    public boolean isUserAuthorizedForProject(String userEmail, Long projectId) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        Optional<Project> projOpt = projectRepository.findById(projectId);

        if (userOpt.isEmpty() || projOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        Project project = projOpt.get();

        if (project.getOwner() != null && project.getOwner().getId().equals(user.getId())) {
            return true;
        }

        Optional<ProjectMember> memberOpt = projectMemberRepository.findByProjectAndUser(project, user);
        return memberOpt.isPresent() && memberOpt.get().getStatus() == MembershipStatus.ACCEPTED;
    }

    // ── 1. Send Project Group Message ─────────────────────────
    public ProjectChatMessageDTO sendMessage(User sender, SendProjectChatMessageRequest request) {
        if (request.getProjectId() == null) {
            throw new IllegalArgumentException("Project ID is required");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        String content = request.getContent() != null ? request.getContent().trim() : "";
        if (content.isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }
        if (content.length() > 1000) {
            throw new IllegalArgumentException("Message content cannot exceed 1000 characters");
        }

        // Authorization check: must be owner or accepted member
        verifyProjectMembership(project, sender);

        // Save message to MySQL
        ProjectChatMessage message = new ProjectChatMessage(project, sender, content);
        ProjectChatMessage saved = projectChatMessageRepository.save(message);

        ProjectChatMessageDTO dto = ProjectChatMessageDTO.from(saved);

        // Broadcast to project-specific STOMP destination: /topic/project/{projectId}
        messagingTemplate.convertAndSend("/topic/project/" + project.getId(), dto);

        return dto;
    }

    // Overload for REST API dispatch where sender comes from SecurityContext
    public ProjectChatMessageDTO sendMessageFromRest(SendProjectChatMessageRequest request) {
        User sender = getAuthenticatedUser();
        return sendMessage(sender, request);
    }

    // ── 2. Get Project Chat History ───────────────────────────
    @Transactional(readOnly = true)
    public List<ProjectChatMessageDTO> getProjectChatHistory(Long projectId) {
        User current = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Authorization check
        verifyProjectMembership(project, current);

        List<ProjectChatMessage> messages = projectChatMessageRepository.findByProjectOrderBySentAtAsc(project);
        return messages.stream()
                .map(ProjectChatMessageDTO::from)
                .collect(Collectors.toList());
    }
}
