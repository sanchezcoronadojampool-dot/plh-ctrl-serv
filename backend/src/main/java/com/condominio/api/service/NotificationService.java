package com.condominio.api.service;

import com.condominio.api.dto.NotificationResponse;
import com.condominio.api.dto.NotificationFeedResponse;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Notification;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.NotificationRepository;
import com.condominio.api.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final StaffRepository staffRepository;

    @Transactional
    public void create(String type, String title, String message, String targetPath) {
        for (Staff administrator : staffRepository.findActiveAdministrators()) {
            Notification notification = new Notification();
            notification.setRecipient(administrator);
            notification.setType(type);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setTargetPath(targetPath);
            notificationRepository.save(notification);
        }
    }

    @Transactional(readOnly = true)
    public NotificationFeedResponse listRecent(String username) {
        List<NotificationResponse> recent = notificationRepository
            .findTop50ByRecipient_UsernameIgnoreCaseOrderByCreatedAtDesc(username).stream()
            .map(this::toResponse)
            .toList();
        return new NotificationFeedResponse(recent, notificationRepository.countByRecipient_UsernameIgnoreCaseAndReadAtIsNull(username));
    }

    @Transactional
    public void markRead(UUID id, String username) {
        Notification notification = notificationRepository.findByIdAndRecipient_UsernameIgnoreCase(id, username)
            .orElseThrow(() -> new ResourceNotFoundException("La notificación no existe."));
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllRead(String username) {
        notificationRepository.markAllRead(username, LocalDateTime.now());
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getType(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getTargetPath(),
            notification.getCreatedAt(),
            notification.getReadAt() != null
        );
    }
}
