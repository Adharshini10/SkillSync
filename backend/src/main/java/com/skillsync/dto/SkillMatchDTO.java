package com.skillsync.dto;

import java.util.List;

/**
 * DTO representing a student matched through the Skill Swapper.
 * Contains safe profile details, matched skills, match percentage, and connection status.
 * Never exposes passwords, password hashes, or sensitive credentials.
 */
public class SkillMatchDTO {

    private Long userId;
    private String name;
    private String bio;
    private String location;
    private String education;
    private String profilePictureUrl;
    private List<String> skills;
    private List<String> matchedSkills;
    private int matchCount;
    private double matchPercentage;
    private String connectionStatus; // NONE, PENDING_SENT, PENDING_RECEIVED, ACCEPTED, REJECTED

    public SkillMatchDTO() {}

    public SkillMatchDTO(Long userId, String name, String bio, String location,
                         String education, String profilePictureUrl,
                         List<String> skills, List<String> matchedSkills,
                         int matchCount, double matchPercentage,
                         String connectionStatus) {
        this.userId = userId;
        this.name = name;
        this.bio = bio;
        this.location = location;
        this.education = education;
        this.profilePictureUrl = profilePictureUrl;
        this.skills = skills;
        this.matchedSkills = matchedSkills;
        this.matchCount = matchCount;
        this.matchPercentage = matchPercentage;
        this.connectionStatus = connectionStatus;
    }

    // ── Getters & Setters ─────────────────────────────────────

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getEducation() {
        return education;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public int getMatchCount() {
        return matchCount;
    }

    public void setMatchCount(int matchCount) {
        this.matchCount = matchCount;
    }

    public double getMatchPercentage() {
        return matchPercentage;
    }

    public void setMatchPercentage(double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }

    public String getConnectionStatus() {
        return connectionStatus;
    }

    public void setConnectionStatus(String connectionStatus) {
        this.connectionStatus = connectionStatus;
    }
}
