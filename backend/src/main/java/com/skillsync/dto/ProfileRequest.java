package com.skillsync.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body for PUT /api/profile.
 * All fields are optional — only provided fields will update the profile.
 */
public class ProfileRequest {

    @Size(max = 1000, message = "Bio must be less than 1000 characters")
    private String bio;

    @Size(max = 500, message = "Profile picture URL must be less than 500 characters")
    private String profilePicture;

    @Size(max = 200, message = "Location must be less than 200 characters")
    private String location;

    @Size(max = 300, message = "Education must be less than 300 characters")
    private String education;

    // ── Getters & Setters ─────────────────────────────────────

    public String getBio()                      { return bio; }
    public void   setBio(String bio)            { this.bio = bio; }

    public String getProfilePicture()           { return profilePicture; }
    public void   setProfilePicture(String url) { this.profilePicture = url; }

    public String getLocation()                 { return location; }
    public void   setLocation(String location)  { this.location = location; }

    public String getEducation()                { return education; }
    public void   setEducation(String edu)      { this.education = edu; }
}
