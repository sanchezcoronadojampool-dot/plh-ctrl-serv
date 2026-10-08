package com.condominio.api.dto;

public record LoginResponse(
    String token,
    String username,
    String role,
    String name
) {}
