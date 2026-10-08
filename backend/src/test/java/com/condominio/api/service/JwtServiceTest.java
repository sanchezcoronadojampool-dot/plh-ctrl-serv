package com.condominio.api.service;

import com.condominio.api.model.Staff;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {
    @Test
    void issuesTokenForStaffUsername() {
        JwtService jwtService = new JwtService("a-test-secret-with-at-least-32-bytes", 60_000);
        Staff staff = new Staff();
        staff.setUsername("operator");

        String token = jwtService.issueToken(staff);

        assertEquals("operator", jwtService.parseToken(token).getSubject());
        assertEquals(0, jwtService.parseToken(token).get("pv", Integer.class));
    }

    @Test
    void rejectsWeakSigningSecret() {
        IllegalStateException exception = assertThrows(
            IllegalStateException.class, () -> new JwtService("too-short", 60_000)
        );
        assertTrue(exception.getMessage().contains("Define JWT_SECRET"));
    }

    @Test
    void rejectsBlankSigningSecret() {
        IllegalStateException exception = assertThrows(
            IllegalStateException.class, () -> new JwtService("   ", 60_000)
        );
        assertTrue(exception.getMessage().contains("Define JWT_SECRET"));
    }

    @Test
    void rejectsNullSigningSecret() {
        IllegalStateException exception = assertThrows(
            IllegalStateException.class, () -> new JwtService(null, 60_000)
        );
        assertTrue(exception.getMessage().contains("Define JWT_SECRET"));
    }
}
