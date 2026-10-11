package com.skillsync.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA entity representing a registered SkillSync user.
 * The table "users" is auto-created / updated by Hibernate (ddl-auto=update).
 */
@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "email", name = "uk_users_email")
    }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid address")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * Stored as a BCrypt hash – NEVER the plain-text password.
     */
    @NotBlank
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── Profile relationship (OneToOne, inverse side) ─────────
    // Profile owns the FK; we just reference it here for convenience.
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Profile profile;

    // ── Skills relationship (ManyToMany) ──────────────────────
    // Join table: user_skills (user_id, skill_id)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_skills",
        joinColumns        = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills = new HashSet<>();

    // ── Learning Skills relationship (ManyToMany) ─────────────
    // Join table: user_learning_skills (user_id, learning_skill_id)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_learning_skills",
        joinColumns        = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "learning_skill_id")
    )
    private Set<LearningSkill> learningSkills = new HashSet<>();

    // ── Projects created by this user (OneToMany) ─────────────
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<Project> projects = new java.util.ArrayList<>();

    // ── Lifecycle callbacks ───────────────────────────────────

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Constructors ──────────────────────────────────────────

    public User() {}

    public User(String name, String email, String password) {
        this.name     = name;
        this.email    = email;
        this.password = password;
    }

    // ── Getters & Setters ─────────────────────────────────────

    public Long   getId()       { return id; }
    public void   setId(Long id) { this.id = id; }

    public String getName()     { return name; }
    public void   setName(String name) { this.name = name; }

    public String getEmail()    { return email; }
    public void   setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void   setPassword(String password) { this.password = password; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public Profile   getProfile()  { return profile; }
    public void      setProfile(Profile profile) { this.profile = profile; }

    public Set<Skill> getSkills()  { return skills; }
    public void       setSkills(Set<Skill> skills) { this.skills = skills; }

    public Set<LearningSkill> getLearningSkills() { return learningSkills; }
    public void setLearningSkills(Set<LearningSkill> learningSkills) { this.learningSkills = learningSkills; }

    public java.util.List<Project> getProjects() { return projects; }
    public void setProjects(java.util.List<Project> projects) { this.projects = projects; }
}

