package com.skillsync.repository;

import com.skillsync.model.Connection;
import com.skillsync.model.ConnectionStatus;
import com.skillsync.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Connection entity.
 */
@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    /**
     * Find a connection between two users in EITHER direction:
     * (sender = user1 AND receiver = user2) OR (sender = user2 AND receiver = user1).
     */
    @Query("SELECT c FROM Connection c WHERE (c.sender = :user1 AND c.receiver = :user2) OR (c.sender = :user2 AND c.receiver = :user1)")
    Optional<Connection> findConnectionBetween(@Param("user1") User user1, @Param("user2") User user2);

    /**
     * Find connection requests received by a user with a given status (e.g. PENDING).
     */
    @Query("SELECT c FROM Connection c WHERE c.receiver = :receiver AND c.status = :status ORDER BY c.createdAt DESC")
    List<Connection> findByReceiverAndStatusOrderByCreatedAtDesc(@Param("receiver") User receiver, @Param("status") ConnectionStatus status);

    /**
     * Find connection requests sent by a user with a given status (e.g. PENDING).
     */
    @Query("SELECT c FROM Connection c WHERE c.sender = :sender AND c.status = :status ORDER BY c.createdAt DESC")
    List<Connection> findBySenderAndStatusOrderByCreatedAtDesc(@Param("sender") User sender, @Param("status") ConnectionStatus status);

    /**
     * Find all accepted connections where the user is either the sender OR the receiver.
     */
    @Query("SELECT c FROM Connection c WHERE (c.sender = :user OR c.receiver = :user) AND c.status = 'ACCEPTED' ORDER BY c.updatedAt DESC")
    List<Connection> findAcceptedConnectionsForUser(@Param("user") User user);

    /**
     * Find all connections involving the given user (as sender or receiver) in any status.
     */
    @Query("SELECT c FROM Connection c WHERE c.sender = :user OR c.receiver = :user ORDER BY c.updatedAt DESC")
    List<Connection> findAllConnectionsForUser(@Param("user") User user);
}
