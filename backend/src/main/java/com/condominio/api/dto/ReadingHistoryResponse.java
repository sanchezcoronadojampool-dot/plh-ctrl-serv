package com.condominio.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReadingHistoryResponse(
    UUID id,
    String casa,
    String servicio,
    String numeroSerie,
    BigDecimal valor,
    LocalDateTime fecha,
    String staff,
    String evidenciaUrl,
    String coordenadas,
    String observaciones
) {}
