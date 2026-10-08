package com.condominio.api.service;

import com.condominio.api.dto.MedidorRequest;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.model.Propiedad;
import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.MedidorRepository;
import com.condominio.api.repository.PropiedadRepository;
import com.condominio.api.repository.TarifaRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MeterAdminServiceTest {
    private final MedidorRepository meterRepository = mock(MedidorRepository.class);
    private final PropiedadRepository propertyRepository = mock(PropiedadRepository.class);
    private final TarifaRepository tariffRepository = mock(TarifaRepository.class);
    private final LecturaRepository readingRepository = mock(LecturaRepository.class);
    private final MeterAdminService service = new MeterAdminService(
        meterRepository, propertyRepository, tariffRepository, readingRepository
    );

    @Test
    void createsMeterAssociatedWithTheRequestedProperty() {
        UUID propertyId = UUID.randomUUID();
        Propiedad property = Propiedad.builder()
            .idPropiedad(propertyId)
            .numeroCasa("12")
            .build();
        when(meterRepository.existsByNumeroSerieIgnoreCase("W-120"))
            .thenReturn(false);
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
        when(meterRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(new MedidorRequest(
            propertyId, null, "agua", " W-120 ", "Modelo", BigDecimal.ZERO
        ));

        assertEquals(propertyId, response.idPropiedad());
        assertEquals("12", response.casa());
        assertEquals("W-120", response.numeroSerie());
        verify(meterRepository).save(any());
    }

    @Test
    void rejectsDuplicateSerialNumbersWithoutSaving() {
        UUID propertyId = UUID.randomUUID();
        when(meterRepository.existsByNumeroSerieIgnoreCase("W-120")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.create(new MedidorRequest(
            propertyId, null, "agua", "W-120", null, BigDecimal.ZERO
        )));

        verify(propertyRepository, never()).findById(any());
        verify(meterRepository, never()).save(any());
    }
}
