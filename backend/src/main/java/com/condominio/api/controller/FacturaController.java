package com.condominio.api.controller;

import com.condominio.api.dto.FacturaResponse;
import com.condominio.api.dto.FacturaStatusRequest;
import com.condominio.api.service.FacturaAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
public class FacturaController {
    private final FacturaAdminService facturaService;

    @GetMapping
    public List<FacturaResponse> listar() {
        return facturaService.listar();
    }

    @PostMapping("/generar-mes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void generarFacturasDelMes() {
        facturaService.generarFacturasDelMes();
    }

    @PatchMapping("/{id}")
    public FacturaResponse actualizarEstado(
        @PathVariable UUID id,
        @Valid @RequestBody FacturaStatusRequest request
    ) {
        return facturaService.actualizarEstado(id, request.estado());
    }
}
