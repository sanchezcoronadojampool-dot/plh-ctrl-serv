package com.condominio.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OwnerApprovalRequest(@NotNull UUID idPropiedad) {}
