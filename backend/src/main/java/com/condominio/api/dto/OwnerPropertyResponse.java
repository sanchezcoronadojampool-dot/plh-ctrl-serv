package com.condominio.api.dto;

import java.util.List;
import java.util.UUID;

public record OwnerPropertyResponse(
    UUID id,
    String codigo,
    String casa,
    String manzana,
    String sector,
    List<OwnerMeterResponse> medidores
) {}
