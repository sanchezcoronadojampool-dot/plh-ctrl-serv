package com.condominio.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record MedidorRequest(
    @NotNull UUID idPropiedad,
    UUID idTarifa,
    @NotBlank @Size(max = 20) String tipoServicio,
    @NotBlank @Size(max = 100) String numeroSerie,
    @Size(max = 100) String marcaModelo,
    @NotNull @DecimalMin("0.0") BigDecimal lecturaInicial
) {}
