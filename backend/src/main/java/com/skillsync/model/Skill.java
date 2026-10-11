package com.skillsync.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashSet;
import java.util.Set;

/**
 * JPA entity representing a skill (e.g. "Java", "React", "Machine Learning").
 *
 * Relationship:
 *   Skill ←→ User  :  ManyToMany
 *   The join table "user_skills" is defined on the User side.
 *   Skills are shared across users — the same "Java" skill row is reused
 *   rather than duplicated for every user who has it.
 */
@Entity
@Table(
    name = "skills",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "name", name = "uk_skills_name")
    }
)
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Skill name is required")
    @Size(max = 100, message = "Skill name must be less than 100 characters")
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    /** Back-reference to users who have this skill (not serialised in responses). */
    @ManyToMany(mappedBy = "skills", fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    // ── Constructors ──────────────────────────────────────────

    public Skill() {}

    public Skill(String name) {
        this.name = name;
    }

    // ── Getters & Setters ─────────────────────────────────────

    public Long     getId()              { return id; }

    public String   getName()            { return name; }
    public void     setName(String name) { this.name = name; }

    public Set<User> getUsers()          { return users; }
    public void      setUsers(Set<User> users) { this.users = users; }
}
