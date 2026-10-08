package com.condominio.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MedidorInfoResponse(
    UUID idMedidor,
    String numeroCasa,
    String tipoServicio,
    BigDecimal ultimaLectura,
    String propietario
) {}
