package com.condominio.api.service;

import com.condominio.api.dto.StaffRequest;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.StaffRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StaffAdminServiceTest {
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final LecturaRepository lecturaRepository = mock(LecturaRepository.class);
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Test
    void createsStaffAccountWithBcryptPasswordHash() {
        when(staffRepository.existsByUsernameIgnoreCase("operator")).thenReturn(false);
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));
        StaffAdminService service = new StaffAdminService(
            staffRepository, lecturaRepository, passwordEncoder
        );

        service.crear(new StaffRequest(
            "operator", "Staff Member", "operador", "activo", "StrongPassword123"
        ));

        var captor = org.mockito.ArgumentCaptor.forClass(Staff.class);
        verify(staffRepository).save(captor.capture());
        String passwordHash = captor.getValue().getPasswordHash();
        assertFalse(passwordHash.equals("StrongPassword123"));
        assertTrue(passwordEncoder.matches("StrongPassword123", passwordHash));
    }
}
