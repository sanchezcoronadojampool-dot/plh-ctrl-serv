package com.condominio.api.service;

import com.condominio.api.repository.FacturaRepository;
import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.PropiedadPersonasRepository;
import com.condominio.api.repository.TarifaRepository;
import com.condominio.api.model.Factura;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BillingServiceTest {
    private final FacturaRepository facturaRepository = mock(FacturaRepository.class);
    private final TarifaRepository tarifaRepository = mock(TarifaRepository.class);
    private final LecturaRepository lecturaRepository = mock(LecturaRepository.class);
    private final PropiedadPersonasRepository propertyOwnersRepository = mock(PropiedadPersonasRepository.class);
    private final NotificationService notificationService = mock(NotificationService.class);
    private final BillingService service = new BillingService(
        facturaRepository, tarifaRepository, lecturaRepository, propertyOwnersRepository, notificationService
    );

    @Test
    void loadsOnlyReadingsInsideCurrentMonthAndDoesNotProcessFutureDates() {
        when(lecturaRepository
            .findAllByFechaLecturaGreaterThanEqualAndFechaLecturaLessThanOrderByFechaLecturaAsc(
                any(LocalDateTime.class), any(LocalDateTime.class)
            )).thenReturn(List.of());

        service.generarFacturasDelMes();

        LocalDate firstDay = LocalDate.now(ZoneId.of("America/Lima")).withDayOfMonth(1);
        org.mockito.ArgumentCaptor<LocalDateTime> start = org.mockito.ArgumentCaptor.forClass(LocalDateTime.class);
        org.mockito.ArgumentCaptor<LocalDateTime> end = org.mockito.ArgumentCaptor.forClass(LocalDateTime.class);
        verify(lecturaRepository)
            .findAllByFechaLecturaGreaterThanEqualAndFechaLecturaLessThanOrderByFechaLecturaAsc(
                start.capture(), end.capture()
            );
        org.junit.jupiter.api.Assertions.assertEquals(firstDay.atStartOfDay(), start.getValue());
        org.junit.jupiter.api.Assertions.assertEquals(firstDay.plusMonths(1).atStartOfDay(), end.getValue());
        verify(facturaRepository, never()).save(any());
    }

    @Test
    void marksOverdueInvoicesAndCreatesOneAdministratorNotification() {
        Factura overdueInvoice = Factura.builder()
            .estatusPago("pendiente")
            .fechaVencimiento(LocalDate.now().minusDays(1))
            .build();
        when(facturaRepository.findAllByEstatusPagoIgnoreCaseAndFechaVencimientoBefore(
            "pendiente", LocalDate.now(ZoneId.of("America/Lima"))
        )).thenReturn(List.of(overdueInvoice));

        service.markOverdueInvoices();

        org.junit.jupiter.api.Assertions.assertEquals("vencido", overdueInvoice.getEstatusPago());
        verify(facturaRepository).saveAll(List.of(overdueInvoice));
        verify(notificationService).create(
            "INVOICES_OVERDUE", "Facturas vencidas", "Hay 1 factura vencida sin pagar.", "/admin/billing"
        );
    }
}
