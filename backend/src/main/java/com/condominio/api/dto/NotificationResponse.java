package com.condominio.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String type,
    String title,
    String message,
    String targetPath,
    LocalDateTime createdAt,
    boolean read
) {}
