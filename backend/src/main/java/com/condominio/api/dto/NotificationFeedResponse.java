package com.condominio.api.dto;

import java.util.List;

public record NotificationFeedResponse(
    List<NotificationResponse> notifications,
    long unreadCount
) {}
