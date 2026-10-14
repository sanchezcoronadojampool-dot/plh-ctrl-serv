package com.condominio.api.service;

import com.condominio.api.dto.FacturaResponse;
import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Factura;
import com.condominio.api.repository.FacturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FacturaAdminService {
    private final FacturaRepository facturaRepository;
    private final BillingService billingService;
    private final NotificationService notificationService;
    private final FacturaMapper facturaMapper;

    @Transactional(readOnly = true)
    public List<FacturaResponse> listar() {
        return facturaRepository.findAllByOrderByFechaEmisionDesc().stream()
            .map(facturaMapper::toResponse)
            .toList();
    }

    @Transactional
    public int generarFacturasDelMes() {
        int created = billingService.generarFacturasDelMes();
        if (created > 0) {
            notificationService.create(
                "INVOICES_GENERATED",
                "Facturas generadas",
                "Se generaron " + created + (created == 1 ? " factura nueva." : " facturas nuevas."),
                "/admin/billing"
            );
        }
        return created;
    }

    @Transactional
    public FacturaResponse actualizarEstado(UUID id, String estado) {
        Factura factura = facturaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("La factura no existe."));
        boolean pagada = estado.equalsIgnoreCase("pagado");
        factura.setEstatusPago(pagada ? "pagado" : "pendiente");
        factura.setFechaPago(pagada ? java.time.LocalDateTime.now() : null);
        factura.setMetodoPago(pagada ? "manual" : null);
        return facturaMapper.toResponse(facturaRepository.save(factura));
    }
}
