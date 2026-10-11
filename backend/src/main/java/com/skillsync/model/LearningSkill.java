package com.skillsync.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashSet;
import java.util.Set;

/**
 * JPA entity representing a skill a student wants to learn.
 *
 * Relationship:
 *   LearningSkill <-> User : ManyToMany
 *   The join table "user_learning_skills" is defined on the User side.
 *   Learning skills are shared across users — the same learning skill row is reused
 *   rather than duplicated for every user who wants to learn it.
 */
@Entity
@Table(
    name = "learning_skills",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "name", name = "uk_learning_skills_name")
    }
)
public class LearningSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Learning skill name is required")
    @Size(max = 100, message = "Learning skill name must be less than 100 characters")
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    /** Back-reference to users who want to learn this skill (not serialised in responses). */
    @ManyToMany(mappedBy = "learningSkills", fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    // ── Constructors ──────────────────────────────────────────

    public LearningSkill() {}

    public LearningSkill(String name) {
        this.name = name;
    }

    // ── Getters & Setters ─────────────────────────────────────

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<User> getUsers() {
        return users;
    }

    public void setUsers(Set<User> users) {
        this.users = users;
    }
}
