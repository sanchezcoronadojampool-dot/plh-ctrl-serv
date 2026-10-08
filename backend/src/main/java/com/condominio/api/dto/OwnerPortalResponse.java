package com.condominio.api.dto;

import java.util.List;

public record OwnerPortalResponse(
    List<OwnerPropertyResponse> propiedades,
    List<OwnerReadingResponse> lecturas,
    List<FacturaResponse> facturas
) {}
