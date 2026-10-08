package com.condominio.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FacturaResponse(
    UUID id,
    String numeroFactura,
    String casa,
    BigDecimal total,
    LocalDate fecha,
    String estado
) {}
