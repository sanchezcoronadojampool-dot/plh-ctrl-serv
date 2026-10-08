package com.condominio.api.controller;

import com.condominio.api.dto.OwnerApprovalRequest;
import com.condominio.api.dto.OwnerRegistrationResponse;
import com.condominio.api.service.OwnerRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/owner-registrations")
@RequiredArgsConstructor
public class OwnerRegistrationController {
    private final OwnerRegistrationService registrationService;

    @GetMapping
    public List<OwnerRegistrationResponse> listPending() {
        return registrationService.listPending();
    }

    @PostMapping("/{id}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable UUID id, @Valid @RequestBody OwnerApprovalRequest request) {
        registrationService.approve(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable UUID id) {
        registrationService.reject(id);
    }
}
