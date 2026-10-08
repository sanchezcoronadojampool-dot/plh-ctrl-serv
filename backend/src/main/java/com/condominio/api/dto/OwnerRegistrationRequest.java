package com.condominio.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OwnerRegistrationRequest(
    @NotBlank @Size(max = 100) String nombre,
    @NotBlank @Size(max = 100) String apellidoPaterno,
    @Size(max = 100) String apellidoMaterno,
    @NotBlank @Size(max = 50) String documentoIdentidad,
    @NotBlank @Size(max = 20) String telefono,
    @Email @Size(max = 255) String correoElectronico,
    @NotBlank     @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Size(min = 12, max = 72) String password,
    @NotBlank @Size(max = 50) String inmueble
) {}
