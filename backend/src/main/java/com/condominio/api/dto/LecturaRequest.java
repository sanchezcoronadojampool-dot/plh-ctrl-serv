package com.condominio.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LecturaRequest(
    @NotNull
    UUID idMedidor,
    @NotNull @DecimalMin("0.0")
    BigDecimal valorLectura,
    @Size(max = 2_048) String fotoUrl,
    @Size(max = 100) String gps,
    @Size(max = 2_000) String observaciones
) {}
