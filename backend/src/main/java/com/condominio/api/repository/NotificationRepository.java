package com.condominio.api.repository;

import com.condominio.api.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop50ByRecipient_UsernameIgnoreCaseOrderByCreatedAtDesc(String username);
    long countByRecipient_UsernameIgnoreCaseAndReadAtIsNull(String username);
    Optional<Notification> findByIdAndRecipient_UsernameIgnoreCase(UUID id, String username);

    @Modifying
    @Query("update Notification n set n.readAt = :readAt where n.readAt is null and LOWER(n.recipient.username) = LOWER(:username)")
    int markAllRead(@Param("username") String username, @Param("readAt") LocalDateTime readAt);
}
