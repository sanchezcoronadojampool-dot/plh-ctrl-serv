package com.condominio.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TarifaRequest(
    @NotBlank @Size(max = 20) String tipoServicio,
    @NotNull @DecimalMin("0.0") BigDecimal precioUnidad,
    @NotNull @DecimalMin("0.0") BigDecimal cargoFijo,
    @NotNull LocalDate vigenciaDesde,
    LocalDate vigenciaHasta,
    @Size(max = 500) String descripcion
) {}
