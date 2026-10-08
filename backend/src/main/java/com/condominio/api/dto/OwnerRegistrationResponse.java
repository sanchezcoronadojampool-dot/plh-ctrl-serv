package com.condominio.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record OwnerRegistrationResponse(
    UUID id,
    String nombre,
    String documentoIdentidad,
    String telefono,
    String correoElectronico,
    String username,
    String inmueble,
    LocalDateTime fechaSolicitud
) {}
