package com.skillsync.dto;

import com.skillsync.model.Profile;

/**
 * Response body for GET /api/profile and PUT /api/profile.
 * Maps from the Profile entity — never exposes the password.
 */
public class ProfileResponse {

    private Long   id;
    private String bio;
    private String profilePicture;
    private String location;
    private String education;

    // Embedded user info (no password)
    private Long   userId;
    private String userName;
    private String userEmail;

    /** Static factory — build from Profile and User entities. */
    public static ProfileResponse from(Profile profile, com.skillsync.model.User user) {
        ProfileResponse r = new ProfileResponse();
        if (profile != null) {
            r.id             = profile.getId();
            r.bio            = profile.getBio();
            r.profilePicture = profile.getProfilePicture();
            r.location       = profile.getLocation();
            r.education      = profile.getEducation();
        }
        if (user != null) {
            r.userId    = user.getId();
            r.userName  = user.getName();
            r.userEmail = user.getEmail();
        } else if (profile != null && profile.getUser() != null) {
            r.userId    = profile.getUser().getId();
            r.userName  = profile.getUser().getName();
            r.userEmail = profile.getUser().getEmail();
        }
        return r;
    }

    /** Static factory — build from a Profile entity. */
    public static ProfileResponse from(Profile profile) {
        return from(profile, profile != null ? profile.getUser() : null);
    }

    // ── Getters ───────────────────────────────────────────────

    public Long   getId()             { return id; }
    public String getBio()            { return bio; }
    public String getProfilePicture() { return profilePicture; }
    public String getLocation()       { return location; }
    public String getEducation()      { return education; }
    public Long   getUserId()         { return userId; }
    public String getUserName()       { return userName; }
    public String getUserEmail()      { return userEmail; }
}
