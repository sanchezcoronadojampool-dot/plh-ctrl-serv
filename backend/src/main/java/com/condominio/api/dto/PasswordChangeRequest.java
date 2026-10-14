package com.condominio.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Solicitud de cambio de contraseña de la cuenta que está en sesión.
 * La política de longitud (12-72 bytes UTF-8) se aplica en el servicio con PasswordPolicy.
 */
public record PasswordChangeRequest(
    @NotBlank String currentPassword,
    @NotBlank String newPassword
) {}
