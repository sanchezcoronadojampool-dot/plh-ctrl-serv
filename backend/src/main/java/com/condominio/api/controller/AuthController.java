package com.condominio.api.controller;

import com.condominio.api.dto.LoginRequest;
import com.condominio.api.dto.LoginResponse;
import com.condominio.api.dto.OwnerRegistrationRequest;
import com.condominio.api.dto.OwnerRegistrationResponse;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.StaffRepository;
import com.condominio.api.service.JwtService;
import com.condominio.api.service.OwnerRegistrationService;
import com.condominio.api.util.Roles;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OwnerRegistrationService ownerRegistrationService;

    @PostMapping("/register-owner")
    @ResponseStatus(HttpStatus.CREATED)
    public OwnerRegistrationResponse registerOwner(@Valid @RequestBody OwnerRegistrationRequest request) {
        return ownerRegistrationService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        Staff staff = staffRepository.findByUsernameIgnoreCase(request.username().trim())
            .filter(Staff::isActivo)
            .filter(account -> account.getPasswordHash() != null
                && account.getPasswordHash().startsWith("$2")
                && passwordEncoder.matches(request.password(), account.getPasswordHash()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos."));

        String name = staff.getNombre();
        if (name == null || name.isBlank()) {
            name = staff.getPersona() == null
                ? staff.getUsername()
                : staff.getPersona().getNombre() + " " + staff.getPersona().getApellidoPaterno();
        }
        return new LoginResponse(jwtService.issueToken(staff), staff.getUsername(), Roles.normalize(staff.getRolSistema()), name);
    }
}
