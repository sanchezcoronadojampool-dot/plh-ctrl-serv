package com.condominio.api.util;

import java.util.Locale;

/**
 * Única fuente de verdad para interpretar el campo Staff.rolSistema.
 * Acepta valores legados ("administrador", "ROLE_ADMIN") y expone roles canónicos.
 */
public final class Roles {
    public static final String ADMIN = "ADMIN";
    public static final String STAFF = "STAFF";
    public static final String OWNER = "OWNER";

    private Roles() {
    }

    public static String normalize(String role) {
        String normalized = role == null ? "" : role.trim().toLowerCase(Locale.ROOT);
        if (normalized.startsWith("role_")) {
            normalized = normalized.substring("role_".length());
        }
        if (normalized.equals("admin") || normalized.equals("administrador")) {
            return ADMIN;
        }
        return normalized.equals("propietario") || normalized.equals("owner")
            ? OWNER
            : STAFF;
    }

    public static boolean isAdmin(String role) {
        return ADMIN.equals(normalize(role));
    }

    public static boolean isOwner(String role) {
        return OWNER.equals(normalize(role));
    }
}
