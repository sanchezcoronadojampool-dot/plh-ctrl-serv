package com.condominio.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record OwnerReadingResponse(
    UUID id,
    String casa,
    String servicio,
    BigDecimal valor,
    LocalDateTime fecha
) {}
