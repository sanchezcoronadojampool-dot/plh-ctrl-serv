package com.condominio.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StaffRequest(
    @NotBlank @Size(max = 50) String username,
    @NotBlank @Size(max = 200) String nombre,
    @NotBlank @Pattern(regexp = "(?i)admin|administrador|operador|staff") String rol,
    @NotBlank @Pattern(regexp = "(?i)activo|inactivo") String estado,
    String password
) {}
