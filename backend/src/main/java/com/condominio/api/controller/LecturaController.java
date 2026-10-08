package com.condominio.api.controller;

import com.condominio.api.dto.*;
import com.condominio.api.model.*;
import com.condominio.api.service.LecturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/lecturas")
@RequiredArgsConstructor
public class LecturaController {

    private final LecturaService lecturaService;

    @GetMapping
    public Page<ReadingHistoryResponse> historial(
        @PageableDefault(size = 20, sort = "fechaLectura", direction = Sort.Direction.DESC) Pageable pageable,
        @RequestParam(required = false) String servicio,
        @RequestParam(required = false) UUID propiedad,
        @RequestParam(required = false) LocalDate desde,
        @RequestParam(required = false) LocalDate hasta,
        @RequestParam(required = false) String q
    ) {
        Pageable bounded = PageRequest.of(
            pageable.getPageNumber(),
            Math.max(1, Math.min(pageable.getPageSize(), 100)),
            pageable.getSort()
        );
        return lecturaService.historial(bounded, servicio, propiedad, desde, hasta, q);
    }

    @GetMapping("/info-medidor/{idMedidor}")
    public ResponseEntity<MedidorInfoResponse> getInfoMedidor(@PathVariable UUID idMedidor) {
        // Lógica para retornar info al escanear QR
        return ResponseEntity.ok(lecturaService.obtenerInformacionMedidor(idMedidor));
    }

    @GetMapping("/info-propiedad/{idPropiedad}")
    public ResponseEntity<PropiedadMedidoresResponse> getInfoPropiedad(@PathVariable UUID idPropiedad) {
        return ResponseEntity.ok(lecturaService.obtenerMedidoresDePropiedad(idPropiedad));
    }

    @PostMapping("/registrar")
    public ResponseEntity<Lectura> registrarLectura(
        @Valid @RequestBody LecturaRequest request,
        @AuthenticationPrincipal String username
    ) {
        Lectura lectura = lecturaService.registrarLectura(request, username);
        return ResponseEntity.ok(lectura);
    }
}
