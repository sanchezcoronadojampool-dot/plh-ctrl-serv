package com.condominio.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Respuesta de POST /api/lecturas/registrar.
 * Nunca se devuelve la entidad Lectura directamente porque serializaría Staff.passwordHash.
 */
public record LecturaResponse(
    UUID idLectura,
    UUID idMedidor,
    BigDecimal valorLectura,
    LocalDateTime fechaLectura
) {}
