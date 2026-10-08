package com.condominio.api.controller;

import com.condominio.api.dto.LoginRequest;
import com.condominio.api.dto.LoginResponse;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.StaffRepository;
import com.condominio.api.service.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @InjectMocks
    private AuthController controller;

    @Test
    void loginReturnsTokenAndAdminRoleForActiveAccount() {
        Staff staff = Staff.builder()
            .username("admin")
            .nombre("Admin User")
            .rolSistema("admin")
            .passwordHash("$2a$test")
            .activo(true)
            .build();
        when(staffRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(staff));
        when(passwordEncoder.matches("StrongPassword123", "$2a$test")).thenReturn(true);
        when(jwtService.issueToken(staff)).thenReturn("signed-token");

        LoginResponse response = controller.login(new LoginRequest("admin", "StrongPassword123"));

        assertEquals("signed-token", response.token());
        assertEquals("ADMIN", response.role());
        assertEquals("Admin User", response.name());
        verify(passwordEncoder).matches("StrongPassword123", "$2a$test");
    }

    @Test
    void loginRejectsInvalidPassword() {
        Staff staff = Staff.builder().username("admin").passwordHash("$2a$test").activo(true).build();
        when(staffRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(staff));
        when(passwordEncoder.matches("wrong", "$2a$test")).thenReturn(false);

        assertThrows(ResponseStatusException.class,
            () -> controller.login(new LoginRequest("admin", "wrong")));
    }

    @Test
    void loginReturnsOwnerRoleForApprovedOwnerAccount() {
        Staff staff = Staff.builder()
            .username("owner")
            .nombre("Owner User")
            .rolSistema("propietario")
            .passwordHash("$2a$test")
            .activo(true)
            .build();
        when(staffRepository.findByUsernameIgnoreCase("owner")).thenReturn(Optional.of(staff));
        when(passwordEncoder.matches("StrongPassword123", "$2a$test")).thenReturn(true);
        when(jwtService.issueToken(staff)).thenReturn("owner-token");

        LoginResponse response = controller.login(new LoginRequest("owner", "StrongPassword123"));

        assertEquals("OWNER", response.role());
    }

    @Test
    void normalizeRoleRecognizesLegacyAdminRoleFormatting() {
        assertEquals("ADMIN", AuthController.normalizeRole("  ADMINISTRADOR  "));
        assertEquals("ADMIN", AuthController.normalizeRole("ROLE_ADMIN"));
    }
}
