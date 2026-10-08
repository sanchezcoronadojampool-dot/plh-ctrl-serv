package com.condominio.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MedidorResponse(
    UUID id,
    UUID idPropiedad,
    String casa,
    UUID idTarifa,
    String tarifa,
    String tipoServicio,
    String numeroSerie,
    String marcaModelo,
    BigDecimal lecturaInicial
) {}
