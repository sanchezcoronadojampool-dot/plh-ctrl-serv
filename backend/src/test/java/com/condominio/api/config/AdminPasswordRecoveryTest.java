package com.condominio.api.config;

import com.condominio.api.model.Staff;
import com.condominio.api.repository.StaffRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminPasswordRecoveryTest {
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);

    @Test
    void doesNothingWhenRecoveryVariablesAreNotConfigured() {
        AdminPasswordRecovery recovery = recovery("", "");

        recovery.run(null);

        verify(staffRepository, never()).findByUsernameIgnoreCase(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void requiresBothRecoveryVariables() {
        AdminPasswordRecovery recovery = recovery("admin", "");

        assertThrows(IllegalStateException.class, () -> recovery.run(null));
        verify(staffRepository, never()).findByUsernameIgnoreCase(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void updatesOnlyTheNamedActiveAdministratorWithBcryptHash() {
        Staff admin = Staff.builder()
            .username("admin")
            .rolSistema("admin")
            .activo(true)
            .passwordHash("old-hash")
            .build();
        when(staffRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(admin));
        when(passwordEncoder.encode("ReplacementPass123")).thenReturn("$2a$new-hash");
        AdminPasswordRecovery recovery = recovery(" admin ", "ReplacementPass123");

        recovery.run(null);

        assertEquals("$2a$new-hash", admin.getPasswordHash());
        verify(staffRepository).save(admin);
        verify(passwordEncoder).encode("ReplacementPass123");
    }

    @Test
    void rejectsNonAdminAccount() {
        Staff operator = Staff.builder()
            .username("operator")
            .rolSistema("operador")
            .activo(true)
            .build();
        when(staffRepository.findByUsernameIgnoreCase("operator")).thenReturn(Optional.of(operator));
        AdminPasswordRecovery recovery = recovery("operator", "ReplacementPass123");

        assertThrows(IllegalStateException.class, () -> recovery.run(null));
        verify(staffRepository, never()).save(operator);
    }

    @Test
    void createsFirstAdministratorWhenDatabaseHasNoActiveAdmin() {
        when(staffRepository.findByUsernameIgnoreCase("new-admin")).thenReturn(Optional.empty());
        when(staffRepository.countActiveAdministrators()).thenReturn(0L);
        when(staffRepository.existsByUsernameIgnoreCase("new-admin")).thenReturn(false);
        when(passwordEncoder.encode("ReplacementPass123")).thenReturn("$2a$new-hash");
        AdminPasswordRecovery recovery = recovery("new-admin", "ReplacementPass123");

        recovery.run(null);

        var captor = org.mockito.ArgumentCaptor.forClass(Staff.class);
        verify(staffRepository).save(captor.capture());
        Staff created = captor.getValue();
        assertEquals("new-admin", created.getUsername());
        assertEquals("admin", created.getRolSistema());
        assertEquals("$2a$new-hash", created.getPasswordHash());
        assertTrue(created.isActivo());
    }

    @Test
    void doesNotCreateDifferentAdminIfAnActiveAdminAlreadyExists() {
        when(staffRepository.findByUsernameIgnoreCase("typo")).thenReturn(Optional.empty());
        when(staffRepository.countActiveAdministrators()).thenReturn(1L);
        AdminPasswordRecovery recovery = recovery("typo", "ReplacementPass123");

        assertThrows(IllegalStateException.class, () -> recovery.run(null));

        verify(staffRepository, never()).save(org.mockito.ArgumentMatchers.any(Staff.class));
    }

    private AdminPasswordRecovery recovery(String username, String password) {
        AdminPasswordRecovery recovery = new AdminPasswordRecovery(staffRepository, passwordEncoder);
        org.springframework.test.util.ReflectionTestUtils.setField(recovery, "username", username);
        org.springframework.test.util.ReflectionTestUtils.setField(recovery, "password", password);
        return recovery;
    }
}
