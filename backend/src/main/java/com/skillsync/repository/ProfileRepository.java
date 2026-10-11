package com.skillsync.repository;

import com.skillsync.model.Profile;
import com.skillsync.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the Profile entity.
 */
@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {

    /** Find a user's profile by their User object. */
    Optional<Profile> findByUser(User user);

    /** Check if a profile exists for the given user. */
    boolean existsByUser(User user);
}
