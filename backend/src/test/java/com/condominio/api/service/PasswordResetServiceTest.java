package com.condominio.api.service;

import com.condominio.api.dto.PasswordResetCompletionRequest;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.model.PasswordResetToken;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.PasswordResetTokenRepository;
import com.condominio.api.repository.StaffRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PasswordResetServiceTest {
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final PasswordResetTokenRepository tokenRepository = mock(PasswordResetTokenRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final PasswordResetService service = new PasswordResetService(
        staffRepository,
        tokenRepository,
        passwordEncoder,
        mock(org.springframework.mail.javamail.JavaMailSender.class),
        new BrandedEmailTemplate()
    );

    @Test
    void completesResetAndMarksTokenAsConsumed() throws Exception {
        String rawToken = "single-use-random-token";
        Staff staff = Staff.builder().idStaff(UUID.randomUUID()).username("owner").passwordHash("old-hash").build();
        PasswordResetToken token = new PasswordResetToken();
        token.setStaff(staff);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        when(tokenRepository.findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
            eq(sha256(rawToken)), any(LocalDateTime.class)
        )).thenReturn(Optional.of(token), Optional.empty());
        when(passwordEncoder.encode("new long password")).thenReturn("new-hash");

        service.complete(new PasswordResetCompletionRequest(rawToken, "new long password"));

        verify(tokenRepository).save(token);
        verify(staffRepository).save(staff);
        assertEquals("new-hash", staff.getPasswordHash());
        assertEquals(1, staff.getPasswordVersion());
        assertNotNull(token.getUsedAt());
        assertThrows(ConflictException.class, () -> service.complete(
            new PasswordResetCompletionRequest(rawToken, "another long password")
        ));
        verify(passwordEncoder).encode("new long password");
    }

    @Test
    void rejectsUnknownOrExpiredTokensWithoutChangingAccount() {
        when(tokenRepository.findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
            any(String.class), any(LocalDateTime.class)
        )).thenReturn(Optional.empty());

        assertThrows(ConflictException.class, () -> service.complete(
            new PasswordResetCompletionRequest("expired-token", "new long password")
        ));

        verify(staffRepository, never()).save(any(Staff.class));
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void enforcesBcryptByteLimitForUnicodePasswords() throws Exception {
        String tokenValue = "token";
        Staff staff = Staff.builder().username("owner").build();
        PasswordResetToken token = new PasswordResetToken();
        token.setStaff(staff);
        when(tokenRepository.findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
            eq(sha256(tokenValue)), any(LocalDateTime.class)
        )).thenReturn(Optional.of(token));
        String tooLongUtf8Password = "é".repeat(37);

        assertThrows(IllegalArgumentException.class, () -> service.complete(
            new PasswordResetCompletionRequest(tokenValue, tooLongUtf8Password)
        ));
        verify(staffRepository, never()).save(any(Staff.class));
    }

    @Test
    void reportsWhenMailRecoveryIsNotConfiguredWithoutLookingUpAccounts() {
        ReflectionTestUtils.setField(service, "mailHost", "");

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
            service.request(new com.condominio.api.dto.PasswordResetRequest("owner@example.com"))
        );

        org.junit.jupiter.api.Assertions.assertEquals(
            org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
            error.getStatusCode()
        );
        verify(staffRepository, never()).findFirstByPersona_CorreoElectronicoIgnoreCaseAndActivoTrue(any());
    }

    @Test
    void reportsIncompleteSmtpCredentialsBeforeLookingUpAccounts() {
        ReflectionTestUtils.setField(service, "mailHost", "smtp.gmail.com");
        ReflectionTestUtils.setField(service, "mailUsername", "admin@example.com");
        ReflectionTestUtils.setField(service, "mailPassword", "");
        ReflectionTestUtils.setField(service, "from", "admin@example.com");

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
            service.request(new com.condominio.api.dto.PasswordResetRequest("owner@example.com"))
        );

        assertEquals(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        verify(staffRepository, never()).findFirstByPersona_CorreoElectronicoIgnoreCaseAndActivoTrue(any());
    }

    private static String sha256(String value) throws Exception {
        return HexFormat.of().formatHex(
            MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
        );
    }
}
