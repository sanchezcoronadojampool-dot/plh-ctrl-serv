package com.condominio.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetCompletionRequest(
    @NotBlank String token,
    @NotBlank @Size(min = 12, max = 72) String password
) {}
