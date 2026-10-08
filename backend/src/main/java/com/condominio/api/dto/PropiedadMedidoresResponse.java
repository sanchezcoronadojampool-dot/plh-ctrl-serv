package com.condominio.api.dto;

import java.util.List;
import java.util.UUID;

public record PropiedadMedidoresResponse(
    UUID idPropiedad,
    String codigoInterno,
    String numeroCasa,
    List<MedidorOpcion> medidores
) {
    public record MedidorOpcion(
        UUID idMedidor,
        String tipoServicio,
        String numeroSerie
    ) {}
}
