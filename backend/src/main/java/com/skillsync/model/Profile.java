package com.skillsync.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * JPA entity representing a user's extended profile information.
 * Has a 1-to-1 relationship with User — each User has at most one Profile.
 * The profile is created automatically the first time it is accessed or updated.
 */
@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 1000, message = "Bio must be less than 1000 characters")
    @Column(columnDefinition = "TEXT")
    private String bio;

    /** URL to an external or uploaded profile picture. */
    @Column(name = "profile_picture", length = 500)
    private String profilePicture;

    @Size(max = 200, message = "Location must be less than 200 characters")
    @Column(length = 200)
    private String location;

    @Size(max = 300, message = "Education must be less than 300 characters")
    @Column(length = 300)
    private String education;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── User relationship (OneToOne, owning side) ─────────────
    // This side holds the FK column "user_id" in the profiles table.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

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

    public Profile() {}

    public Profile(User user) {
        this.user = user;
    }

    // ── Getters & Setters ─────────────────────────────────────

    public Long   getId()             { return id; }

    public String getBio()            { return bio; }
    public void   setBio(String bio)  { this.bio = bio; }

    public String getProfilePicture()               { return profilePicture; }
    public void   setProfilePicture(String url)     { this.profilePicture = url; }

    public String getLocation()                     { return location; }
    public void   setLocation(String location)      { this.location = location; }

    public String getEducation()                    { return education; }
    public void   setEducation(String education)    { this.education = education; }

    public LocalDateTime getCreatedAt()  { return createdAt; }
    public LocalDateTime getUpdatedAt()  { return updatedAt; }

    public User   getUser()              { return user; }
    public void   setUser(User user)     { this.user = user; }
}
