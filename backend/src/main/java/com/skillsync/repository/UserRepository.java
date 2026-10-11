package com.skillsync.repository;

import com.skillsync.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the User entity.
 * Provides CRUD operations and custom finders out of the box.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by their email address (used during login and registration uniqueness check).
     */
    Optional<User> findByEmail(String email);

    /**
     * Check whether an email address is already registered.
     */
    boolean existsByEmail(String email);

    /**
     * Search users by name containing the search query (case-insensitive).
     */
    java.util.List<User> findByNameContainingIgnoreCase(String name);
}
