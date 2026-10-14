package com.condominio.api.service;

import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.LecturaRepository;
import com.condominio.api.repository.StaffRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StaffPasswordChangeTest {
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final StaffAdminService service = new StaffAdminService(
        staffRepository, mock(LecturaRepository.class), passwordEncoder
    );

    private Staff activeAccount(String rawHashedPassword) {
        return Staff.builder()
            .username("operator")
            .passwordHash(passwordEncoder.encode(rawHashedPassword))
            .rolSistema("operador")
            .activo(true)
            .passwordVersion(1)
            .build();
    }

    @Test
    void changesOwnPasswordAndInvalidatesPreviousSessions() {
        Staff account = activeAccount("CurrentPassword1");
        when(staffRepository.findByUsernameIgnoreCase("operator")).thenReturn(Optional.of(account));
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cambiarPasswordPropia("operator", "CurrentPassword1", "BrandNewPass123");

        assertTrue(passwordEncoder.matches("BrandNewPass123", account.getPasswordHash()));
        assertFalse(passwordEncoder.matches("CurrentPassword1", account.getPasswordHash()));
        assertTrue(account.getPasswordVersion() > 1, "passwordVersion debe subir para invalidar tokens previos");
        verify(staffRepository).save(account);
    }

    @Test
    void rejectsWrongCurrentPasswordWithoutSaving() {
        Staff account = activeAccount("CurrentPassword1");
        when(staffRepository.findByUsernameIgnoreCase("operator")).thenReturn(Optional.of(account));

        assertThrows(IllegalArgumentException.class, () ->
            service.cambiarPasswordPropia("operator", "WrongPassword1", "BrandNewPass123"));

        verify(staffRepository, never()).save(any(Staff.class));
    }

    @Test
    void rejectsNewPasswordShorterThanTwelveCharacters() {
        Staff account = activeAccount("CurrentPassword1");
        when(staffRepository.findByUsernameIgnoreCase("operator")).thenReturn(Optional.of(account));

        assertThrows(IllegalArgumentException.class, () ->
            service.cambiarPasswordPropia("operator", "CurrentPassword1", "short"));

        verify(staffRepository, never()).save(any(Staff.class));
    }

    @Test
    void rejectsReusingTheSamePassword() {
        Staff account = activeAccount("CurrentPassword1");
        when(staffRepository.findByUsernameIgnoreCase("operator")).thenReturn(Optional.of(account));

        assertThrows(IllegalArgumentException.class, () ->
            service.cambiarPasswordPropia("operator", "CurrentPassword1", "CurrentPassword1"));

        verify(staffRepository, never()).save(any(Staff.class));
    }

    @Test
    void failsExplicitlyWhenAccountIsInactive() {
        Staff inactive = Staff.builder().username("operator").activo(false).build();
        when(staffRepository.findByUsernameIgnoreCase("operator")).thenReturn(Optional.of(inactive));

        assertThrows(ResourceNotFoundException.class, () ->
            service.cambiarPasswordPropia("operator", "CurrentPassword1", "BrandNewPass123"));

        verify(staffRepository, never()).save(any(Staff.class));
    }
}
