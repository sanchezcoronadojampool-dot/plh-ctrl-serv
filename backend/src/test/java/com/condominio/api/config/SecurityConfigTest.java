package com.condominio.api.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;

class SecurityConfigTest {
    @Test
    void registersJwtFilterOnlyInsideSpringSecurityChain() {
        JwtAuthenticationFilter jwtFilter = mock(JwtAuthenticationFilter.class);
        SecurityConfig config = new SecurityConfig(jwtFilter, "http://localhost:4200");

        var registration = config.jwtFilterServletRegistration(jwtFilter);

        assertFalse(registration.isEnabled());
        assertSame(jwtFilter, registration.getFilter());
    }
}
