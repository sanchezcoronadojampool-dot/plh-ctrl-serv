package com.condominio.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record PropiedadRequest(
    @NotBlank @Size(max = 50) String codigoInterno,
    @NotBlank @Size(max = 20) String numeroCasa,
    @Size(max = 20) String manzana,
    @Size(max = 50) String sector,
    @NotBlank @Pattern(regexp = "(?i)ocupada|vac[ií]a|en[ _]mantenimiento") String estatus,
    UUID idPersonaResponsable
) {}
