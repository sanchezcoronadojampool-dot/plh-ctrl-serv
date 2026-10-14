package com.condominio.api.service;

import com.condominio.api.dto.DashboardSummaryResponse;
import com.condominio.api.repository.FacturaRepository;
import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.PropiedadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final PropiedadRepository propiedadRepository;
    private final LecturaRepository lecturaRepository;
    private final FacturaRepository facturaRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse obtenerResumen() {
        // Las facturas vencidas siguen debiéndose, por eso se suman a las pendientes en el saldo.
        var facturasImpagas = facturaRepository.findAllByEstatusPagoIgnoreCaseIn(List.of("pendiente", "vencido"));
        BigDecimal saldoPendiente = facturasImpagas.stream()
            .map(factura -> factura.getMontoTotal() == null ? BigDecimal.ZERO : factura.getMontoTotal())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DashboardSummaryResponse(
            propiedadRepository.count(),
            propiedadRepository.countByEstatusOcupacionIgnoreCase("ocupada"),
            lecturaRepository.countByFechaLecturaGreaterThanEqual(LocalDate.now().withDayOfMonth(1).atStartOfDay()),
            facturasImpagas.size(),
            saldoPendiente
        );
    }
}
