package com.condominio.api.service;

import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.MedidorRepository;
import com.condominio.api.repository.PropiedadPersonasRepository;
import com.condominio.api.repository.PropiedadRepository;
import com.condominio.api.repository.StaffRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LecturaServiceTest {
    private final LecturaRepository lecturaRepository = mock(LecturaRepository.class);
    private final LecturaService service = new LecturaService(
        lecturaRepository,
        mock(MedidorRepository.class),
        mock(PropiedadRepository.class),
        mock(PropiedadPersonasRepository.class),
        mock(StaffRepository.class),
        mock(NotificationService.class)
    );

    @Test
    void historialPassesTypedEmptyStringsForOptionalTextFilters() {
        var pageable = PageRequest.of(0, 20);
        when(lecturaRepository.findHistory(
            eq(""), eq(false), eq(new java.util.UUID(0, 0)),
            eq(false), eq(java.time.LocalDate.of(2000, 1, 1).atStartOfDay()),
            eq(false), eq(java.time.LocalDate.of(2000, 1, 1).atStartOfDay()),
            eq(""), eq(pageable)
        )).thenReturn(Page.empty(pageable));

        assertDoesNotThrow(() -> service.historial(pageable, null, null, null, null, null));

        verify(lecturaRepository).findHistory(
            eq(""), eq(false), eq(new java.util.UUID(0, 0)),
            eq(false), eq(java.time.LocalDate.of(2000, 1, 1).atStartOfDay()),
            eq(false), eq(java.time.LocalDate.of(2000, 1, 1).atStartOfDay()),
            eq(""), eq(pageable)
        );
    }

    @Test
    void historialNormalizesServiceAndSearchBeforeQuerying() {
        var pageable = PageRequest.of(0, 20);
        when(lecturaRepository.findHistory(
            eq("agua"), eq(false), eq(new java.util.UUID(0, 0)),
            eq(false), eq(java.time.LocalDate.of(2000, 1, 1).atStartOfDay()),
            eq(false), eq(java.time.LocalDate.of(2000, 1, 1).atStartOfDay()),
            eq("%casa 2%"), any()
        )).thenReturn(Page.empty(pageable));

        service.historial(pageable, " Agua ", null, null, null, " Casa 2 ");

        verify(lecturaRepository).findHistory(
            eq("agua"), eq(false), eq(new java.util.UUID(0, 0)),
            eq(false), eq(java.time.LocalDate.of(2000, 1, 1).atStartOfDay()),
            eq(false), eq(java.time.LocalDate.of(2000, 1, 1).atStartOfDay()),
            eq("%casa 2%"), eq(pageable)
        );
    }
}
