package com.condominio.api.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
    long totalPropiedades,
    long propiedadesOcupadas,
    long lecturasMes,
    long facturasPendientes,
    BigDecimal saldoPendiente
) {}
