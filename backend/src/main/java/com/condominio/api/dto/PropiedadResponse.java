package com.condominio.api.dto;

import java.util.UUID;

public record PropiedadResponse(
    UUID id,
    String codigoInterno,
    String numeroCasa,
    UUID idPersonaResponsable,
    String propietario,
    String estatus
) {}
