package com.condominio.api.dto;

import java.util.UUID;

public record OwnerMeterResponse(
    UUID id,
    String servicio,
    String numeroSerie,
    String casa
) {}
