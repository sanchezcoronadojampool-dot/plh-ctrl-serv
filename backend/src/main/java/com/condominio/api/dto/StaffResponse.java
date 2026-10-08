package com.condominio.api.dto;

import java.util.UUID;

public record StaffResponse(
    UUID id,
    String username,
    String nombre,
    String rol,
    long lecturas,
    String estado
) {}
