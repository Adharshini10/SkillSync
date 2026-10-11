package com.skillsync.repository;

import com.skillsync.model.Project;
import com.skillsync.model.ProjectChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for ProjectChatMessage entity.
 */
@Repository
public interface ProjectChatMessageRepository extends JpaRepository<ProjectChatMessage, Long> {

    /**
     * Retrieve all messages for a specific project, ordered chronologically ascending.
     * Uses JOIN FETCH to eagerly load sender and project details without N+1 query overhead.
     */
    @Query("SELECT m FROM ProjectChatMessage m " +
           "JOIN FETCH m.sender s " +
           "JOIN FETCH m.project p " +
           "WHERE m.project = :project " +
           "ORDER BY m.sentAt ASC")
    List<ProjectChatMessage> findByProjectOrderBySentAtAsc(@Param("project") Project project);

    /**
     * Retrieve all messages for a project ID, ordered chronologically ascending.
     */
    @Query("SELECT m FROM ProjectChatMessage m " +
           "JOIN FETCH m.sender s " +
           "JOIN FETCH m.project p " +
           "WHERE m.project.id = :projectId " +
           "ORDER BY m.sentAt ASC")
    List<ProjectChatMessage> findByProjectIdOrderBySentAtAsc(@Param("projectId") Long projectId);
}
