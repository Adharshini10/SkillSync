package com.skillsync.controller;

import com.skillsync.dto.ProjectRequest;
import com.skillsync.dto.ProjectResponse;
import com.skillsync.dto.ProjectUpdateRequest;
import com.skillsync.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Project Management endpoints.
 *
 * All endpoints require authentication via JWT.
 * The owner/creator is determined automatically from the JWT context.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * Create a new project.
     * POST /api/projects
     */
    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request) {
        ProjectResponse created = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * View all available projects.
     * GET /api/projects
     */
    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    /**
     * View projects created by the currently authenticated user.
     * GET /api/projects/my
     */
    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects() {
        return ResponseEntity.ok(projectService.getMyProjects());
    }

    /**
     * View complete details for a specific project.
     * GET /api/projects/{projectId}
     */
    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProjectById(projectId));
    }

    /**
     * Update project information or status.
     * Only the project owner is allowed to perform this operation.
     * PUT /api/projects/{projectId}
     */
    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectUpdateRequest request) {
        return ResponseEntity.ok(projectService.updateProject(projectId, request));
    }

    /**
     * Delete a project.
     * Only the project owner is allowed to perform this operation.
     * DELETE /api/projects/{projectId}
     */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Map<String, String>> deleteProject(@PathVariable Long projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
    }
}
