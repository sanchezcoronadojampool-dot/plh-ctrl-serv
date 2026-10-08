package com.condominio.api.controller;

import com.condominio.api.dto.PasswordResetCompletionRequest;
import com.condominio.api.dto.PasswordResetRequest;
import com.condominio.api.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {
    private final PasswordResetService passwordResetService;

    @PostMapping("/request")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void request(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.request(request);
    }

    @PostMapping("/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void complete(@Valid @RequestBody PasswordResetCompletionRequest request) {
        passwordResetService.complete(request);
    }
}
