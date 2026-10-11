package com.skillsync.repository;

import com.skillsync.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the Skill entity.
 */
@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    /** Find a skill by its name (case-sensitive). */
    Optional<Skill> findByName(String name);

    /** Check if a skill with the given name already exists. */
    boolean existsByName(String name);
}
