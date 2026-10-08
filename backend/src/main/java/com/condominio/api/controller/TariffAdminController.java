package com.condominio.api.controller;

import com.condominio.api.dto.TarifaRequest;
import com.condominio.api.dto.TarifaResponse;
import com.condominio.api.service.TariffAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tarifas")
@RequiredArgsConstructor
public class TariffAdminController {
    private final TariffAdminService tariffService;

    @GetMapping
    public List<TarifaResponse> list() {
        return tariffService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TarifaResponse create(@Valid @RequestBody TarifaRequest request) {
        return tariffService.create(request);
    }

    @PutMapping("/{id}")
    public TarifaResponse update(@PathVariable UUID id, @Valid @RequestBody TarifaRequest request) {
        return tariffService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        tariffService.delete(id);
    }
}
