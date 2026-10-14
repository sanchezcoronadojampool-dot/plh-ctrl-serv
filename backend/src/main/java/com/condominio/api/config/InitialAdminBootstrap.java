package com.condominio.api.config;

import com.condominio.api.model.Staff;
import com.condominio.api.repository.StaffRepository;
import com.condominio.api.util.PasswordPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class InitialAdminBootstrap implements ApplicationRunner {
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public InitialAdminBootstrap(
        StaffRepository staffRepository,
        PasswordEncoder passwordEncoder,
        @Value("${app.bootstrap.admin.username:}") String username,
        @Value("${app.bootstrap.admin.password:}") String password
    ) {
        this.staffRepository = staffRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean usernameConfigured = username != null && !username.isBlank();
        boolean passwordConfigured = password != null && !password.isBlank();
        if (usernameConfigured != passwordConfigured) {
            throw new IllegalStateException(
                "Configura tanto BOOTSTRAP_ADMIN_USERNAME como BOOTSTRAP_ADMIN_PASSWORD."
            );
        }

        if (staffRepository.countActiveAdministrators() > 0) {
            return;
        }
        if (!usernameConfigured) {
            throw new IllegalStateException(
                "No hay un administrador activo. Define BOOTSTRAP_ADMIN_USERNAME y "
                    + "BOOTSTRAP_ADMIN_PASSWORD para crear el primero."
            );
        }

        String normalizedUsername = username.trim();
        if (normalizedUsername.length() > 50) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_USERNAME no puede superar 50 caracteres.");
        }
        try {
            PasswordPolicy.validate(password);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("La contraseña inicial debe tener entre 12 y 72 bytes UTF-8.");
        }
        if (staffRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new IllegalStateException(
                "BOOTSTRAP_ADMIN_USERNAME ya está en uso por una cuenta que no es un administrador activo. "
                    + "Elige otro usuario o habilita una cuenta de administrador existente."
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
