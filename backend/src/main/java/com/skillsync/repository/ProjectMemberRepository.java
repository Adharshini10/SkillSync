package com.skillsync.repository;

import com.skillsync.model.MembershipStatus;
import com.skillsync.model.Project;
import com.skillsync.model.ProjectMember;
import com.skillsync.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for ProjectMember entity.
 */
@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    /** Find a membership record by Project and User entities. */
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);

    /** Find a membership record by Project ID and User ID. */
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    /** Find all membership records for a specific project with a given status. */
    List<ProjectMember> findByProjectIdAndStatus(Long projectId, MembershipStatus status);

    /** Find all membership records for a specific user with a given status. */
    List<ProjectMember> findByUserIdAndStatus(Long userId, MembershipStatus status);

    /** Check if a membership record exists for a project and user. */
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    /** Find a membership by its ID and the project ID it belongs to. */
    Optional<ProjectMember> findByIdAndProjectId(Long id, Long projectId);

    /** Find all membership records for a specific user ordered by requestedAt descending. */
    List<ProjectMember> findByUserIdOrderByRequestedAtDesc(Long userId);

    /** Count accepted memberships for a project. */
    long countByProjectIdAndStatus(Long projectId, MembershipStatus status);

    /** Find all membership records across all projects owned by a specific owner with a given status. */
    @org.springframework.data.jpa.repository.Query("SELECT pm FROM ProjectMember pm WHERE pm.project.owner.id = :ownerId AND pm.status = :status ORDER BY pm.requestedAt DESC")
    List<ProjectMember> findAllByProjectOwnerIdAndStatus(@org.springframework.data.repository.query.Param("ownerId") Long ownerId, @org.springframework.data.repository.query.Param("status") MembershipStatus status);
}
