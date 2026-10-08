package com.condominio.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TarifaResponse(
    UUID id,
    String tipoServicio,
    BigDecimal precioUnidad,
    BigDecimal cargoFijo,
    LocalDate vigenciaDesde,
    LocalDate vigenciaHasta,
    String descripcion
) {}
