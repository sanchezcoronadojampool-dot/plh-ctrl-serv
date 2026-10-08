package com.condominio.api.service;

import com.condominio.api.model.*;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {
    private final FacturaRepository facturaRepository;
    private final TarifaRepository tarifaRepository;
    private final LecturaRepository lecturaRepository;
    private final PropiedadPersonasRepository propiedadPersonasRepository;
    private final NotificationService notificationService;

    @Value("${app.time-zone:America/Lima}")
    private String timeZone = "America/Lima";

    @Transactional
    public Factura generarFactura(Lectura lectura) {
        if (facturaRepository.findByLectura_IdLectura(lectura.getIdLectura()).isPresent()) {
            throw new ConflictException("Ya existe una factura para esta lectura.");
        }
        Medidor medidor = lectura.getMedidor();
        Tarifa tarifa = tarifaRepository.findByTipoServicioAndVigente(
            medidor.getTipoServicio(), today()
        ).orElseThrow(() -> new ConflictException("No hay una tarifa vigente para el servicio."));

        BigDecimal lecturaActual = lectura.getValorLectura();
        BigDecimal lecturaAnterior = obtenerLecturaAnterior(medidor, lectura.getFechaLectura());
        
        BigDecimal consumo = lecturaActual.subtract(lecturaAnterior);
        BigDecimal montoConsumo = consumo.multiply(tarifa.getPrecioUnidad());
        BigDecimal cargoFijo = tarifa.getCargoFijo() == null ? BigDecimal.ZERO : tarifa.getCargoFijo();
        BigDecimal montoTotal = montoConsumo.add(cargoFijo);
        Persona personaCobro = propiedadPersonasRepository
            .findFirstByPropiedad_IdPropiedadAndEsResponsablePagoTrue(medidor.getPropiedad().getIdPropiedad())
            .map(PropiedadPersona::getPersona)
            .orElse(null);

        Factura factura = Factura.builder()
            .lectura(lectura)
            .propiedad(medidor.getPropiedad())
            .personaCobro(personaCobro)
            .consumoPeriodo(consumo)
            .montoSubtotal(montoConsumo.setScale(2, RoundingMode.HALF_UP))
            .montoCargoFijo(cargoFijo)
            .montoTotal(montoTotal.setScale(2, RoundingMode.HALF_UP))
            .fechaVencimiento(today().plusDays(15))
            .estatusPago("pendiente")
            .build();

        return facturaRepository.save(factura);
    }

    @Transactional
    public int generarFacturasDelMes() {
        LocalDateTime inicioMes = today().withDayOfMonth(1).atStartOfDay();
        LocalDateTime inicioMesSiguiente = inicioMes.plusMonths(1);
        List<Lectura> lecturas = lecturaRepository
            .findAllByFechaLecturaGreaterThanEqualAndFechaLecturaLessThanOrderByFechaLecturaAsc(
                inicioMes,
                inicioMesSiguiente
            );
        int creadas = 0;
        for (Lectura lectura : lecturas) {
            if (facturaRepository.findByLectura_IdLectura(lectura.getIdLectura()).isEmpty()) {
                generarFactura(lectura);
                creadas++;
            }
        }
        return creadas;
    }

    @Scheduled(cron = "${app.billing.overdue-cron:0 0 8 * * *}", zone = "${app.time-zone:America/Lima}")
    @Transactional
    public void markOverdueInvoices() {
        List<Factura> overdue = facturaRepository.findAllByEstatusPagoIgnoreCaseAndFechaVencimientoBefore(
            "pendiente", today()
        );
        if (overdue.isEmpty()) {
            return;
        }
        overdue.forEach(factura -> factura.setEstatusPago("vencido"));
        facturaRepository.saveAll(overdue);
        notificationService.create(
            "INVOICES_OVERDUE",
            "Facturas vencidas",
            "Hay " + overdue.size() + (overdue.size() == 1
                ? " factura vencida sin pagar."
                : " facturas vencidas sin pagar."),
            "/admin/billing"
        );
    }

    private LocalDate today() {
        return LocalDate.now(ZoneId.of(timeZone));
    }

    private BigDecimal obtenerLecturaAnterior(Medidor medidor, LocalDateTime fechaActual) {
        return lecturaRepository
            .findFirstByMedidor_IdMedidorAndFechaLecturaBeforeOrderByFechaLecturaDesc(
                medidor.getIdMedidor(),
                fechaActual
            )
            .map(Lectura::getValorLectura)
            .orElse(medidor.getLecturaInicial() == null ? BigDecimal.ZERO : medidor.getLecturaInicial());
    }
}
