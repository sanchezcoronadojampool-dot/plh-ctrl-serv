package com.condominio.api.util;

import java.nio.charset.StandardCharsets;

/**
 * Regla única para toda contraseña nueva del sistema: entre 12 y 72 bytes UTF-8,
 * tal como exige BCrypt y documenta el README.
 */
public final class PasswordPolicy {
    public static final int MIN_LENGTH = 12;
    public static final int MAX_BYTES = 72;

    private PasswordPolicy() {
    }

    public static void validate(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 12 caracteres.");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            throw new IllegalArgumentException("La contraseña no puede superar 72 bytes UTF-8.");
        }
    }
}
