package com.condominio.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Única fuente de verdad para la configuración SMTP.
 * Antes la comprobación estaba duplicada en PasswordResetService y OwnerDecisionEmailService.
 */
@Component
public class MailSettings {
    @Value("${spring.mail.host:}")
    private String host;
    @Value("${spring.mail.username:}")
    private String username;
    @Value("${spring.mail.password:}")
    private String password;
    @Value("${app.mail.from:}")
    private String from;

    public boolean isConfigured() {
        return notBlank(host) && notBlank(username) && notBlank(password) && notBlank(from);
    }

    public String from() {
        return from;
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
