package com.skillsync.controller;

import com.skillsync.dto.JoinRequestResponseDTO;
import com.skillsync.dto.ProjectMemberResponseDTO;
import com.skillsync.dto.ProjectResponse;
import com.skillsync.service.ProjectMemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Project Membership management.
 *
 * Endpoints:
 *  - POST /api/projects/{projectId}/join                              -> Send join request (201)
 *  - GET  /api/projects/{projectId}/members                           -> View accepted project members (200)
 *  - GET  /api/projects/{projectId}/join-requests                     -> View pending join requests (owner only) (200)
 *  - PUT  /api/projects/{projectId}/join-requests/{membershipId}/accept -> Accept request (owner only) (200)
 *  - PUT  /api/projects/{projectId}/join-requests/{membershipId}/reject -> Reject request (owner only) (200)
 *  - GET  /api/projects/my-memberships                                -> View projects where current user is accepted member (200)
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    public ProjectMemberController(ProjectMemberService projectMemberService) {
        this.projectMemberService = projectMemberService;
    }

    /**
     * Send a request to join a project.
     * POST /api/projects/{projectId}/join
     */
    @PostMapping("/{projectId}/join")
    public ResponseEntity<JoinRequestResponseDTO> sendJoinRequest(@PathVariable Long projectId) {
        JoinRequestResponseDTO response = projectMemberService.sendJoinRequest(projectId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get accepted members of a project.
     * GET /api/projects/{projectId}/members
     */
    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<ProjectMemberResponseDTO>> getProjectMembers(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectMemberService.getProjectMembers(projectId));
    }

    /**
     * Get pending join requests for a project (Owner only).
     * GET /api/projects/{projectId}/join-requests
     */
    @GetMapping("/{projectId}/join-requests")
    public ResponseEntity<List<JoinRequestResponseDTO>> getPendingJoinRequests(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectMemberService.getPendingJoinRequests(projectId));
    }

    /**
     * Accept a pending join request (Owner only).
     * PUT /api/projects/{projectId}/join-requests/{membershipId}/accept
     */
    @PutMapping("/{projectId}/join-requests/{membershipId}/accept")
    public ResponseEntity<ProjectMemberResponseDTO> acceptJoinRequest(
            @PathVariable Long projectId,
            @PathVariable Long membershipId) {
        return ResponseEntity.ok(projectMemberService.acceptJoinRequest(projectId, membershipId));
    }

    /**
     * Reject a pending join request (Owner only).
     * PUT /api/projects/{projectId}/join-requests/{membershipId}/reject
     */
    @PutMapping("/{projectId}/join-requests/{membershipId}/reject")
    public ResponseEntity<ProjectMemberResponseDTO> rejectJoinRequest(
            @PathVariable Long projectId,
            @PathVariable Long membershipId) {
        return ResponseEntity.ok(projectMemberService.rejectJoinRequest(projectId, membershipId));
    }

    /**
     * Remove an accepted member from the project (Owner only).
     * DELETE /api/projects/{projectId}/members/{membershipId}
     */
    @DeleteMapping("/{projectId}/members/{membershipId}")
    public ResponseEntity<java.util.Map<String, String>> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long membershipId) {
        projectMemberService.removeMember(projectId, membershipId);
        return ResponseEntity.ok(java.util.Map.of("message", "Member removed successfully from project"));
    }

    /**
     * Get projects where the authenticated user is an accepted member.
     * GET /api/projects/my-memberships
     */
    @GetMapping("/my-memberships")
    public ResponseEntity<List<ProjectResponse>> getMyJoinedProjects() {
        return ResponseEntity.ok(projectMemberService.getMyJoinedProjects());
    }

    /**
     * Get all join requests sent by the authenticated user across all projects.
     * GET /api/projects/my-requests
     */
    @GetMapping("/my-requests")
    public ResponseEntity<List<JoinRequestResponseDTO>> getMyJoinRequests() {
        return ResponseEntity.ok(projectMemberService.getMyJoinRequests());
    }

    /**
     * Get all pending join requests across all projects owned by the authenticated user.
     * GET /api/projects/owner/pending-requests
     */
    @GetMapping("/owner/pending-requests")
    public ResponseEntity<List<JoinRequestResponseDTO>> getAllOwnerPendingRequests() {
        return ResponseEntity.ok(projectMemberService.getAllOwnerPendingRequests());
    }
}
