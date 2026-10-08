package com.condominio.api.controller;

import com.condominio.api.dto.MedidorRequest;
import com.condominio.api.dto.MedidorResponse;
import com.condominio.api.service.MeterAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/medidores")
@RequiredArgsConstructor
public class MeterAdminController {
    private final MeterAdminService meterService;

    @GetMapping
    public List<MedidorResponse> list() {
        return meterService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedidorResponse create(@Valid @RequestBody MedidorRequest request) {
        return meterService.create(request);
    }

    @PutMapping("/{id}")
    public MedidorResponse update(@PathVariable UUID id, @Valid @RequestBody MedidorRequest request) {
        return meterService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        meterService.delete(id);
    }
}
