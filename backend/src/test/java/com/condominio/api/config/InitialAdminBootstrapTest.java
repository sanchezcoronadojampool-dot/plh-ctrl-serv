package com.condominio.api.config;

import com.condominio.api.model.Staff;
import com.condominio.api.repository.StaffRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InitialAdminBootstrapTest {
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Test
    void createsFirstAdministratorWithBcryptPasswordHash() {
        when(staffRepository.countActiveAdministrators()).thenReturn(0L);
        when(staffRepository.existsByUsernameIgnoreCase("site-admin")).thenReturn(false);

        InitialAdminBootstrap bootstrap = new InitialAdminBootstrap(
            staffRepository, passwordEncoder, " site-admin ", "StrongPassword123"
        );
        bootstrap.run(null);

        var captor = org.mockito.ArgumentCaptor.forClass(Staff.class);
        verify(staffRepository).save(captor.capture());
        Staff saved = captor.getValue();
        assertEquals("site-admin", saved.getUsername());
        assertEquals("admin", saved.getRolSistema());
        assertTrue(saved.isActivo());
        assertFalse(saved.getPasswordHash().equals("StrongPassword123"));
        assertTrue(passwordEncoder.matches("StrongPassword123", saved.getPasswordHash()));
    }

    @Test
    void failsClearlyWhenNoAdministratorExistsAndBootstrapIsNotConfigured() {
        when(staffRepository.countActiveAdministrators()).thenReturn(0L);
        InitialAdminBootstrap bootstrap = new InitialAdminBootstrap(
            staffRepository, passwordEncoder, "", ""
        );

        IllegalStateException exception = assertThrows(
            IllegalStateException.class, () -> bootstrap.run(null)
        );

        assertTrue(exception.getMessage().contains("BOOTSTRAP_ADMIN_USERNAME"));
        verify(staffRepository, never()).save(any());
    }

    @Test
    void doesNotChangeAnExistingActiveAdministrator() {
        when(staffRepository.countActiveAdministrators()).thenReturn(1L);
        InitialAdminBootstrap bootstrap = new InitialAdminBootstrap(
            staffRepository, passwordEncoder, "replacement-admin", "StrongPassword123"
        );

        bootstrap.run(null);

        verify(staffRepository, never()).existsByUsernameIgnoreCase("replacement-admin");
        verify(staffRepository, never()).save(any());
    }

    @Test
    void rejectsPartialBootstrapConfiguration() {
        InitialAdminBootstrap bootstrap = new InitialAdminBootstrap(
            staffRepository, passwordEncoder, "site-admin", ""
        );

        IllegalStateException exception = assertThrows(
            IllegalStateException.class, () -> bootstrap.run(null)
        );

        assertTrue(exception.getMessage().contains("Configura tanto"));
        verify(staffRepository, never()).save(any());
    }

    @Test
    void refusesToSilentlyPromoteAnExistingNonAdminAccount() {
        when(staffRepository.countActiveAdministrators()).thenReturn(0L);
        when(staffRepository.existsByUsernameIgnoreCase("operator")).thenReturn(true);
        InitialAdminBootstrap bootstrap = new InitialAdminBootstrap(
            staffRepository, passwordEncoder, "operator", "StrongPassword123"
        );

        IllegalStateException exception = assertThrows(
            IllegalStateException.class, () -> bootstrap.run(null)
        );

        assertTrue(exception.getMessage().contains("ya está en uso"));
        verify(staffRepository, never()).save(any());
    }
}
