package com.skillsync.service;

import com.skillsync.dto.JoinRequestResponseDTO;
import com.skillsync.dto.ProjectMemberResponseDTO;
import com.skillsync.dto.ProjectResponse;
import com.skillsync.exception.ResourceNotFoundException;
import com.skillsync.model.MembershipStatus;
import com.skillsync.model.NotificationType;
import com.skillsync.model.Project;
import com.skillsync.model.ProjectMember;
import com.skillsync.model.User;
import com.skillsync.repository.ProjectMemberRepository;
import com.skillsync.repository.ProjectRepository;
import com.skillsync.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service handling business logic and authorization for Project Memberships and Member Management.
 */
@Service
@Transactional
public class ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository       projectRepository;
    private final UserRepository          userRepository;
    private final NotificationService     notificationService;

    public ProjectMemberService(ProjectMemberRepository projectMemberRepository,
                                ProjectRepository projectRepository,
                                UserRepository userRepository,
                                NotificationService notificationService) {
        this.projectMemberRepository = projectMemberRepository;
        this.projectRepository       = projectRepository;
        this.userRepository          = userRepository;
        this.notificationService     = notificationService;
    }

    // ── Helper: resolve currently authenticated user from JWT ─
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    // ── 1. Send Join Request ──────────────────────────────────
    public JoinRequestResponseDTO sendJoinRequest(Long projectId) {
        User student = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Rule 2: Project owner cannot request to join their own project
        if (project.getOwner().getId().equals(student.getId())) {
            throw new IllegalArgumentException("You cannot request to join your own project");
        }

        // Rule 3: Check project status (Closed projects cannot be joined)
        if (project.getStatus() == com.skillsync.model.ProjectStatus.COMPLETED) {
            throw new IllegalArgumentException("This project is closed and is not accepting new members");
        }

        // Rule 4: Check project capacity
        int max = project.getMaxMembers() != null && project.getMaxMembers() > 0 ? project.getMaxMembers() : 5;
        long acceptedCount = projectMemberRepository.countByProjectIdAndStatus(projectId, MembershipStatus.ACCEPTED);
        int currentCount = 1 + (int) acceptedCount; // Owner is 1
        if (currentCount >= max) {
            throw new IllegalArgumentException("This project has reached its maximum member capacity (" + max + ")");
        }

        // Check for existing membership record
        Optional<ProjectMember> existingOpt = projectMemberRepository.findByProjectIdAndUserId(projectId, student.getId());

        if (existingOpt.isPresent()) {
            ProjectMember existing = existingOpt.get();

            // Rule 5: Cannot request if already ACCEPTED
            if (existing.getStatus() == MembershipStatus.ACCEPTED) {
                throw new IllegalArgumentException("You are already an accepted member of this project");
            }

            // Rule 6: Cannot request if already PENDING
            if (existing.getStatus() == MembershipStatus.PENDING) {
                throw new IllegalArgumentException("You already have a pending join request for this project");
            }

            // If previously REJECTED, allow re-requesting by updating status back to PENDING
            if (existing.getStatus() == MembershipStatus.REJECTED) {
                existing.setStatus(MembershipStatus.PENDING);
                existing.setRequestedAt(LocalDateTime.now());
                existing.setJoinedAt(null);
                ProjectMember updated = projectMemberRepository.save(existing);
                try {
                    notificationService.createNotification(
                            project.getOwner(),
                            student,
                            NotificationType.PROJECT_JOIN_REQUEST,
                            "Project Join Request",
                            student.getName() + " requested to join your project: " + project.getTitle(),
                            project.getId()
                    );
                } catch (Exception ignored) {}
                return JoinRequestResponseDTO.from(updated);
            }
        }

        // Create new membership record with PENDING status
        ProjectMember newMember = new ProjectMember(project, student);
        ProjectMember saved = projectMemberRepository.save(newMember);
        try {
            notificationService.createNotification(
                    project.getOwner(),
                    student,
                    NotificationType.PROJECT_JOIN_REQUEST,
                    "Project Join Request",
                    student.getName() + " requested to join your project: " + project.getTitle(),
                    project.getId()
            );
        } catch (Exception ignored) {}
        return JoinRequestResponseDTO.from(saved);
    }

    // ── 2. Get Project Members (Owner + Accepted members) ─────
    @Transactional(readOnly = true)
    public List<ProjectMemberResponseDTO> getProjectMembers(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        List<ProjectMember> acceptedMembers = projectMemberRepository.findByProjectIdAndStatus(projectId, MembershipStatus.ACCEPTED);
        List<ProjectMemberResponseDTO> result = new ArrayList<>();

        // Add the owner as the primary member of the project
        boolean ownerInList = acceptedMembers.stream()
                .anyMatch(m -> m.getUser().getId().equals(project.getOwner().getId()));

        if (!ownerInList && project.getOwner() != null) {
            result.add(ProjectMemberResponseDTO.forOwner(project));
        }

        for (ProjectMember m : acceptedMembers) {
            result.add(ProjectMemberResponseDTO.from(m));
        }

        return result;
    }

    // ── 3. Get Pending Join Requests (Owner only) ─────────────
    @Transactional(readOnly = true)
    public List<JoinRequestResponseDTO> getPendingJoinRequests(Long projectId) {
        User currentUser = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Rule 3: Only project owner can view pending requests
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the project owner can view pending join requests");
        }

        return projectMemberRepository.findByProjectIdAndStatus(projectId, MembershipStatus.PENDING)
                .stream()
                .map(JoinRequestResponseDTO::from)
                .collect(Collectors.toList());
    }

    // ── 4. Accept Join Request (Owner only) ───────────────────
    public ProjectMemberResponseDTO acceptJoinRequest(Long projectId, Long membershipId) {
        User currentUser = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Rule 3 & 4: Only project owner can accept
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the project owner can accept join requests");
        }

        ProjectMember member = projectMemberRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership request not found with id: " + membershipId));

        // Validate cross-project reference
        if (!member.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Membership request " + membershipId + " does not belong to project id: " + projectId);
        }

        // Validate current status is PENDING
        if (member.getStatus() != MembershipStatus.PENDING) {
            throw new IllegalArgumentException("Only pending requests can be accepted. Current status: " + member.getStatus());
        }

        // Validate project capacity
        int max = project.getMaxMembers() != null && project.getMaxMembers() > 0 ? project.getMaxMembers() : 5;
        long acceptedCount = projectMemberRepository.countByProjectIdAndStatus(projectId, MembershipStatus.ACCEPTED);
        int currentCount = 1 + (int) acceptedCount; // Owner is 1
        if (currentCount >= max) {
            throw new IllegalArgumentException("Cannot accept request: project has already reached its maximum member capacity (" + max + ")");
        }

        member.setStatus(MembershipStatus.ACCEPTED);
        member.setJoinedAt(LocalDateTime.now());
        ProjectMember saved = projectMemberRepository.save(member);
        try {
            notificationService.createNotification(
                    member.getUser(),
                    currentUser,
                    NotificationType.PROJECT_JOIN_ACCEPTED,
                    "Project Join Request Accepted",
                    "You were accepted into project: " + project.getTitle() + "! Open Group Chat to collaborate.",
                    project.getId()
            );
        } catch (Exception ignored) {}
        return ProjectMemberResponseDTO.from(saved);
    }

    // ── 5. Reject Join Request (Owner only) ───────────────────
    public ProjectMemberResponseDTO rejectJoinRequest(Long projectId, Long membershipId) {
        User currentUser = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Rule 3 & 4: Only project owner can reject
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the project owner can reject join requests");
        }

        ProjectMember member = projectMemberRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership request not found with id: " + membershipId));

        // Validate cross-project reference
        if (!member.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Membership request " + membershipId + " does not belong to project id: " + projectId);
        }

        // Validate current status is PENDING
        if (member.getStatus() != MembershipStatus.PENDING) {
            throw new IllegalArgumentException("Only pending requests can be rejected. Current status: " + member.getStatus());
        }

        member.setStatus(MembershipStatus.REJECTED);
        ProjectMember saved = projectMemberRepository.save(member);
        try {
            notificationService.createNotification(
                    member.getUser(),
                    currentUser,
                    NotificationType.PROJECT_JOIN_REJECTED,
                    "Project Join Request Rejected",
                    "Your request to join " + project.getTitle() + " was declined.",
                    project.getId()
            );
        } catch (Exception ignored) {}
        return ProjectMemberResponseDTO.from(saved);
    }

    // ── 6. Remove Member (Owner only) ─────────────────────────
    public void removeMember(Long projectId, Long membershipId) {
        User currentUser = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Rule 1: Only the project owner can remove members
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the project owner can remove members from the project");
        }

        // Rule 2: Project owner cannot remove themselves
        if (membershipId != null && (membershipId.equals(0L) || membershipId.equals(project.getOwner().getId()))) {
            throw new IllegalArgumentException("The project owner cannot be removed from their own project");
        }

        ProjectMember member = projectMemberRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership record not found with id: " + membershipId));

        // Rule 3: Cross-project check
        if (!member.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Membership record " + membershipId + " does not belong to project id: " + projectId);
        }

        // Rule 4: Must be an ACCEPTED member to remove
        if (member.getStatus() != MembershipStatus.ACCEPTED) {
            throw new IllegalArgumentException("Only accepted members can be removed. Current status: " + member.getStatus());
        }

        // Rule 5: Cannot remove project owner
        if (member.getUser().getId().equals(project.getOwner().getId())) {
            throw new IllegalArgumentException("The project owner cannot be removed from their own project");
        }

        // Remove membership record from database
        projectMemberRepository.delete(member);
    }

    // ── 7. Get My Joined Projects (Accepted only) ─────────────
    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyJoinedProjects() {
        User currentUser = getAuthenticatedUser();
        List<ProjectMember> acceptedMemberships = projectMemberRepository.findByUserIdAndStatus(currentUser.getId(), MembershipStatus.ACCEPTED);

        return acceptedMemberships.stream()
                .map(m -> ProjectResponse.from(m.getProject()))
                .collect(Collectors.toList());
    }

    // ── 8. Get My Sent Join Requests ──────────────────────────
    @Transactional(readOnly = true)
    public List<JoinRequestResponseDTO> getMyJoinRequests() {
        User currentUser = getAuthenticatedUser();
        return projectMemberRepository.findByUserIdOrderByRequestedAtDesc(currentUser.getId())
                .stream()
                .map(JoinRequestResponseDTO::from)
                .collect(Collectors.toList());
    }

    // ── 9. Get All Incoming Join Requests for Projects Owned by Current User ──
    @Transactional(readOnly = true)
    public List<JoinRequestResponseDTO> getAllOwnerPendingRequests() {
        User currentUser = getAuthenticatedUser();
        return projectMemberRepository.findAllByProjectOwnerIdAndStatus(currentUser.getId(), MembershipStatus.PENDING)
                .stream()
                .map(JoinRequestResponseDTO::from)
                .collect(Collectors.toList());
    }
}
