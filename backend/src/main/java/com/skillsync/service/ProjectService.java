package com.skillsync.service;

import com.skillsync.dto.ProjectRequest;
import com.skillsync.dto.ProjectResponse;
import com.skillsync.dto.ProjectUpdateRequest;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.MembershipStatus;
import com.skillsync.model.Project;
import com.skillsync.model.ProjectStatus;
import com.skillsync.model.Skill;
import com.skillsync.model.User;
import com.skillsync.repository.ProjectMemberRepository;
import com.skillsync.repository.ProjectRepository;
import com.skillsync.repository.SkillRepository;
import com.skillsync.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service handling business logic and authorization for Project Management.
 */
@Service
@Transactional
public class ProjectService {

    private final ProjectRepository       projectRepository;
    private final SkillRepository         skillRepository;
    private final UserRepository          userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public ProjectService(ProjectRepository projectRepository,
                          SkillRepository skillRepository,
                          UserRepository userRepository,
                          ProjectMemberRepository projectMemberRepository) {
        this.projectRepository       = projectRepository;
        this.skillRepository         = skillRepository;
        this.userRepository          = userRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    // ── Helper: calculate current project members count ───────
    private int getMemberCount(Long projectId) {
        // Owner (1) + accepted members
        return 1 + (int) projectMemberRepository.countByProjectIdAndStatus(projectId, MembershipStatus.ACCEPTED);
    }

    // ── Helper: get authenticated user from JWT context ───────
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    // ── Helper: find or create skills ─────────────────────────
    private Set<Skill> resolveSkills(List<String> skillNames) {
        Set<Skill> skills = new HashSet<>();
        if (skillNames != null) {
            for (String name : skillNames) {
                if (name != null && !name.trim().isEmpty()) {
                    String trimmed = name.trim();
                    Skill skill = skillRepository.findByName(trimmed)
                            .orElseGet(() -> skillRepository.save(new Skill(trimmed)));
                    skills.add(skill);
                }
            }
        }
        return skills;
    }

    // ── Helper: format lookingFor string ──────────────────────
    private String resolveLookingFor(ProjectRequest request) {
        if (request.getLookingForRoles() != null && !request.getLookingForRoles().isEmpty()) {
            return request.getLookingForRoles().stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.joining(", "));
        }
        if (request.getLookingFor() != null && !request.getLookingFor().isBlank()) {
            return request.getLookingFor().trim();
        }
        return null;
    }

    // ── 1. Create Project ─────────────────────────────────────
    public ProjectResponse createProject(ProjectRequest request) {
        User owner = getAuthenticatedUser();
        Set<Skill> skills = resolveSkills(request.getRequiredSkills());

        Project project = new Project(
                request.getTitle().trim(),
                request.getDescription().trim(),
                owner,
                skills
        );
        project.setStatus(ProjectStatus.OPEN);

        if (request.getMaxMembers() != null && request.getMaxMembers() > 0) {
            project.setMaxMembers(request.getMaxMembers());
        } else {
            project.setMaxMembers(5);
        }

        project.setLookingFor(resolveLookingFor(request));

        Project saved = projectRepository.save(project);
        return ProjectResponse.from(saved, 1);
    }

    // ── 2. View All Projects ──────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(p -> ProjectResponse.from(p, getMemberCount(p.getId())))
                .collect(Collectors.toList());
    }

    // ── 3. View My Projects ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects() {
        User owner = getAuthenticatedUser();
        return projectRepository.findByOwnerOrderByCreatedAtDesc(owner)
                .stream()
                .map(p -> ProjectResponse.from(p, getMemberCount(p.getId())))
                .collect(Collectors.toList());
    }

    // ── 4. View Project Details ───────────────────────────────
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        return ProjectResponse.from(project, getMemberCount(project.getId()));
    }

    // ── 5. Update Project (Owner only) ────────────────────────
    public ProjectResponse updateProject(Long projectId, ProjectUpdateRequest request) {
        User user = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Enforce ownership: only the owner may update their project
        if (!project.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to update this project");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            project.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            project.setDescription(request.getDescription().trim());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getRequiredSkills() != null) {
            project.setRequiredSkills(resolveSkills(request.getRequiredSkills()));
        }
        if (request.getMaxMembers() != null && request.getMaxMembers() > 0) {
            project.setMaxMembers(request.getMaxMembers());
        }
        if (request.getLookingForRoles() != null && !request.getLookingForRoles().isEmpty()) {
            project.setLookingFor(request.getLookingForRoles().stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.joining(", ")));
        } else if (request.getLookingFor() != null) {
            project.setLookingFor(request.getLookingFor().trim());
        }

        Project saved = projectRepository.save(project);
        return ProjectResponse.from(saved, getMemberCount(saved.getId()));
    }

    // ── 6. Delete Project (Owner only) ────────────────────────
    public void deleteProject(Long projectId) {
        User user = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Enforce ownership: only the owner may delete their project
        if (!project.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to delete this project");
        }

        projectRepository.delete(project);
    }
}
