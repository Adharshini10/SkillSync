package com.skillsync.repository;

import com.skillsync.model.Project;
import com.skillsync.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for Project entity.
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /** Find all projects ordered by newest first. */
    List<Project> findAllByOrderByCreatedAtDesc();

    /** Find all projects owned by a specific user ordered by newest first. */
    List<Project> findByOwnerOrderByCreatedAtDesc(User owner);
}
