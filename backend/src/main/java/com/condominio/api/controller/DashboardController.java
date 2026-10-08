package com.condominio.api.controller;

import com.condominio.api.dto.DashboardSummaryResponse;
import com.condominio.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public DashboardSummaryResponse obtenerResumen() {
        return dashboardService.obtenerResumen();
    }
}
