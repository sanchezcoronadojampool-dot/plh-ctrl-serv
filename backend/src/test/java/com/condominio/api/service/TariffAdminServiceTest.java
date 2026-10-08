package com.condominio.api.service;

import com.condominio.api.dto.TarifaRequest;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.model.Tarifa;
import com.condominio.api.repository.MedidorRepository;
import com.condominio.api.repository.TarifaRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TariffAdminServiceTest {
    private final TarifaRepository tariffRepository = mock(TarifaRepository.class);
    private final MedidorRepository meterRepository = mock(MedidorRepository.class);
    private final TariffAdminService service = new TariffAdminService(tariffRepository, meterRepository);

    @Test
    void rejectsOverlappingTariffValidityForSameService() {
        Tarifa existing = Tarifa.builder()
            .idTarifa(UUID.randomUUID())
            .tipoServicio("agua")
            .vigenciaDesde(LocalDate.of(2026, 1, 1))
            .vigenciaHasta(LocalDate.of(2026, 12, 31))
            .build();
        when(tariffRepository.findAllByTipoServicioIgnoreCase("agua")).thenReturn(List.of(existing));

        assertThrows(ConflictException.class, () -> service.create(new TarifaRequest(
            "agua", new BigDecimal("1.25"), BigDecimal.ZERO,
            LocalDate.of(2026, 6, 1), null, "Tarifa duplicada"
        )));
    }

    @Test
    void rejectsDeletionWhenTariffIsAssignedToMeter() {
        UUID tariffId = UUID.randomUUID();
        Tarifa tariff = Tarifa.builder().idTarifa(tariffId).build();
        when(tariffRepository.findById(tariffId)).thenReturn(java.util.Optional.of(tariff));
        when(meterRepository.existsByTarifa_IdTarifa(tariffId)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.delete(tariffId));
    }
}
