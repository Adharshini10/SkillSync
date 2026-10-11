package com.skillsync.repository;

import com.skillsync.model.ChatMessage;
import com.skillsync.model.MessageReadStatus;
import com.skillsync.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for ChatMessage entity.
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Retrieve the conversation history between two users, ordered chronologically.
     */
    @Query("SELECT m FROM ChatMessage m WHERE (m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1) ORDER BY m.sentAt ASC")
    List<ChatMessage> findConversationBetween(@Param("user1") User user1, @Param("user2") User user2);

    /**
     * Retrieve all unread messages received by a specific user.
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.receiver = :receiver AND m.readStatus = :status ORDER BY m.sentAt DESC")
    List<ChatMessage> findByReceiverAndReadStatusOrderBySentAtDesc(@Param("receiver") User receiver, @Param("status") MessageReadStatus status);

    /**
     * Retrieve unread messages received by a specific user from a specific sender.
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.receiver = :receiver AND m.sender = :sender AND m.readStatus = :status")
    List<ChatMessage> findByReceiverAndSenderAndReadStatus(
            @Param("receiver") User receiver,
            @Param("sender") User sender,
            @Param("status") MessageReadStatus status
    );
}
