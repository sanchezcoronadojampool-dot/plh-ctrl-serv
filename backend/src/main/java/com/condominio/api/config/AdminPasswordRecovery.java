package com.condominio.api.config;

import com.condominio.api.repository.StaffRepository;
import com.condominio.api.model.Staff;
import com.condominio.api.util.PasswordPolicy;
import com.condominio.api.util.Roles;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class AdminPasswordRecovery implements ApplicationRunner {
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.recovery.admin.username:}")
    private String username;

    @Value("${app.recovery.admin.password:}")
    private String password;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean usernameConfigured = username != null && !username.isBlank();
        boolean passwordConfigured = password != null && !password.isBlank();
        if (!usernameConfigured && !passwordConfigured) {
            return;
        }
        if (!usernameConfigured || !passwordConfigured) {
            throw new IllegalStateException(
                "Configura juntas ADMIN_RECOVERY_USERNAME y ADMIN_RECOVERY_PASSWORD."
            );
        }        try {
            PasswordPolicy.validate(password);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("La contraseña de recuperación debe tener entre 12 y 72 bytes UTF-8.");
        }

        String normalizedUsername = username.trim();
        var matchingAccount = staffRepository.findByUsernameIgnoreCase(normalizedUsername);
        if (matchingAccount.isPresent()) {
            Staff account = matchingAccount.get();
            if (!account.isActivo() || !Roles.isAdmin(account.getRolSistema())) {
                throw new IllegalStateException(
                    "ADMIN_RECOVERY_USERNAME pertenece a una cuenta inactiva o que no es administradora."
                );
            }
            account.setPasswordHash(passwordEncoder.encode(password));
            account.setPasswordVersion(account.getPasswordVersion() + 1);
            staffRepository.save(account);
            return;
        }

        if (staffRepository.countActiveAdministrators() > 0) {
            throw new IllegalStateException(
                "No se encontró un administrador activo con ADMIN_RECOVERY_USERNAME. "
                    + "Usa exactamente el usuario de una cuenta administradora activa existente."
            );
        }
        if (staffRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new IllegalStateException(
                "ADMIN_RECOVERY_USERNAME ya pertenece a una cuenta inactiva o no administradora."
            );
        }
        staffRepository.save(Staff.builder()
            .username(normalizedUsername)
            .passwordHash(passwordEncoder.encode(password))
            .rolSistema("admin")
            .nombre(normalizedUsername)
            .activo(true)
            .build());
    }
}
