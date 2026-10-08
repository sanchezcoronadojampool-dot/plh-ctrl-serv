package com.condominio.api.controller;

import com.condominio.api.config.JwtAuthenticationFilter;
import com.condominio.api.config.SecurityConfig;
import com.condominio.api.service.LecturaService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import com.condominio.api.dto.MedidorInfoResponse;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LecturaController.class)
@AutoConfigureMockMvc
@Import(SecurityConfig.class)
class LecturaSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtAuthenticationFilter jwtFilter;

    @MockBean
    private LecturaService lecturaService;

    @BeforeEach
    void configureJwtFilterMock() throws Exception {
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(
                (ServletRequest) invocation.getArgument(0),
                (ServletResponse) invocation.getArgument(1)
            );
            return null;
        }).when(jwtFilter).doFilter(any(ServletRequest.class), any(ServletResponse.class), any(FilterChain.class));
        when(lecturaService.historial(any(), isNull(), isNull(), isNull(), isNull(), isNull()))
            .thenReturn(Page.empty());
    }

    @Test
    void administratorCanReadHistory() throws Exception {
        mockMvc.perform(get("/api/lecturas")
                .param("page", "0")
                .param("size", "20")
                .param("propiedad", "4bde1c64-75f7-433a-b81c-d0d10ec9a919")
                .with(user("admin").roles("ADMIN"))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void staffCannotReadFullHistory() throws Exception {
        mockMvc.perform(get("/api/lecturas")
                .with(user("operator").roles("STAFF"))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden());
    }

    @Test
    void anonymousUserCannotReadHistory() throws Exception {
        mockMvc.perform(get("/api/lecturas")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden());
    }

    @Test
    void staffCanLoadPropertyMetersFromQrFlow() throws Exception {
        mockMvc.perform(get("/api/lecturas/info-propiedad/9b90af3d-8e56-4cec-9fa6-0cfb260809e2")
                .with(user("operator").roles("STAFF"))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void staffCanLoadMeterDetailsAfterScanningMeterQr() throws Exception {
        when(lecturaService.obtenerInformacionMedidor(any()))
            .thenReturn(new MedidorInfoResponse(
                java.util.UUID.fromString("9b90af3d-8e56-4cec-9fa6-0cfb260809e2"),
                "12",
                "agua",
                java.math.BigDecimal.ZERO,
                "Sin asignar"
            ));

        mockMvc.perform(get("/api/lecturas/info-medidor/9b90af3d-8e56-4cec-9fa6-0cfb260809e2")
                .with(user("operator").roles("STAFF"))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void administratorCanLoadMeterDetailsAfterScanningMeterQr() throws Exception {
        mockMvc.perform(get("/api/lecturas/info-medidor/9b90af3d-8e56-4cec-9fa6-0cfb260809e2")
                .with(user("admin").roles("ADMIN"))
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }
}
