package com.condominio.api.service;

import com.condominio.api.dto.FacturaResponse;
import com.condominio.api.model.Factura;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Única fuente de verdad para convertir una Factura en su respuesta de API.
 * Antes esta lógica estaba duplicada en FacturaAdminService y OwnerPortalService,
 * y el portal del propietario ocultaba el estado "Vencido".
 */
@Component
public class FacturaMapper {

    public FacturaResponse toResponse(Factura factura) {
        LocalDate fecha = factura.getFechaEmision() == null
            ? LocalDate.now()
            : factura.getFechaEmision().toLocalDate();
        return new FacturaResponse(
            factura.getIdFactura(),
            invoiceNumber(factura, fecha),
            factura.getPropiedad() == null ? "" : factura.getPropiedad().getNumeroCasa(),
            factura.getMontoTotal(),
            fecha,
            statusLabel(factura.getEstatusPago())
        );
    }

    static String invoiceNumber(Factura factura, LocalDate fecha) {
        return "FAC-" + fecha.getYear() + "-"
            + factura.getIdFactura().toString().substring(0, 8).toUpperCase();
    }

    static String statusLabel(String estatusPago) {
        if (estatusPago == null) {
            return "Pendiente";
        }
        return switch (estatusPago.toLowerCase()) {
            case "pagado" -> "Pagado";
            case "vencido" -> "Vencido";
            default -> "Pendiente";
        };
    }
}
