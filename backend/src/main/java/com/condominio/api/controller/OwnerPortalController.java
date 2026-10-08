package com.condominio.api.controller;

import com.condominio.api.dto.OwnerPortalResponse;
import com.condominio.api.service.OwnerPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerPortalController {
    private final OwnerPortalService ownerPortalService;

    @GetMapping("/overview")
    public OwnerPortalResponse overview(@AuthenticationPrincipal String username) {
        return ownerPortalService.overview(username);
    }
}
