package com.condominio.api.controller;

import com.condominio.api.dto.StaffRequest;
import com.condominio.api.dto.StaffResponse;
import com.condominio.api.service.StaffAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {
    private final StaffAdminService staffService;

    @GetMapping
    public List<StaffResponse> listar() {
        return staffService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse crear(@Valid @RequestBody StaffRequest request) {
        return staffService.crear(request);
    }

    @PutMapping("/{id}")
    public StaffResponse actualizar(
        @PathVariable UUID id,
        @Valid @RequestBody StaffRequest request,
        @AuthenticationPrincipal String username
    ) {
        return staffService.actualizar(id, request, username);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable UUID id, @AuthenticationPrincipal String username) {
        staffService.eliminar(id, username);
    }
}
