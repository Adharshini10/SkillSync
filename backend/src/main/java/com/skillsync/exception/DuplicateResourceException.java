package com.skillsync.exception;

/**
 * Thrown when a resource already exists (e.g. skill already added, email already registered).
 * Maps to HTTP 409 Conflict via GlobalExceptionHandler.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
