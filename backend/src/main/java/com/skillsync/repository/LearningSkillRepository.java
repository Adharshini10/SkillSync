package com.skillsync.repository;

import com.skillsync.model.LearningSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the LearningSkill entity.
 */
@Repository
public interface LearningSkillRepository extends JpaRepository<LearningSkill, Long> {

    /** Find a learning skill by name, ignoring case. */
    Optional<LearningSkill> findByNameIgnoreCase(String name);

    /** Check if a learning skill exists by name, ignoring case. */
    boolean existsByNameIgnoreCase(String name);

    /** Find a learning skill by exact name. */
    Optional<LearningSkill> findByName(String name);
}
