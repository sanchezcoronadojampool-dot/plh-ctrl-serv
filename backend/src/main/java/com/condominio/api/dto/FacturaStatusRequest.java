package com.condominio.api.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;

public record FacturaStatusRequest(
    @NotBlank
    @Pattern(regexp = "(?i)pagado|pendiente") String estado
) {}
