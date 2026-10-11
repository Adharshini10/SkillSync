package com.skillsync.dto;

import com.skillsync.model.Profile;
import com.skillsync.model.Skill;
import com.skillsync.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Safe DTO for user discovery and search.
 * Never exposes passwords or internal security hashes.
 */
public class UserResponseDTO {

    private Long userId;
    private String name;
    private String email;
    private String bio;
    private String location;
    private String education;
    private List<String> skills = new ArrayList<>();

    public UserResponseDTO() {}

    public static UserResponseDTO from(User user, Profile profile) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.userId = user.getId();
        dto.name   = user.getName();
        dto.email  = user.getEmail();

        if (profile != null) {
            dto.bio       = profile.getBio();
            dto.location  = profile.getLocation();
            dto.education = profile.getEducation();
        }

        if (user.getSkills() != null) {
            dto.skills = user.getSkills().stream()
                    .map(Skill::getName)
                    .collect(Collectors.toList());
        }

        return dto;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getBio() {
        return bio;
    }

    public String getLocation() {
        return location;
    }

    public String getEducation() {
        return education;
    }

    public List<String> getSkills() {
        return skills;
    }
}
