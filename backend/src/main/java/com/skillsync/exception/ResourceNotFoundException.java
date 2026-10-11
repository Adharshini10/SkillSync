package com.skillsync.exception;

/**
 * Thrown when a requested resource (Profile, Skill, User) does not exist.
 * Maps to HTTP 404 Not Found via GlobalExceptionHandler.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
