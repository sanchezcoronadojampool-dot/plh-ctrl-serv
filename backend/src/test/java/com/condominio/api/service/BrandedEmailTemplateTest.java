package com.condominio.api.service;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import static org.junit.jupiter.api.Assertions.assertTrue;

class BrandedEmailTemplateTest {
    private final BrandedEmailTemplate template = new BrandedEmailTemplate();

    @Test
    void passwordResetContainsBrandedActionExpiryAndPlainTextFallback() {
        var content = template.passwordReset(
            "Ana & Luis",
            "https://portal.example/reset?token=secure-token&source=email",
            30
        );

        assertTrue(content.subject().contains("restablecimiento"));
        assertTrue(content.html().contains("cid:plh-logo"));
        assertTrue(content.html().contains("#003b73"));
        assertTrue(content.html().contains("Ana &amp; Luis"));
        assertTrue(content.html().contains("Restablecer contraseña"));
        assertTrue(content.html().contains("token=secure-token&amp;source=email"));
        assertTrue(content.html().contains("vence en 30 minutos"));
        assertTrue(content.text().contains("https://portal.example/reset?token=secure-token&source=email"));
    }

    @Test
    void approvalEmailEscapesOwnerSuppliedContentAndIncludesPropertyAndPortalLink() {
        var content = template.ownerApproved(
            "Ana <script>alert(1)</script>",
            "12 & B",
            "ana<admin>",
            "https://portal.example/login"
        );

        assertTrue(content.html().contains("Ana &lt;script&gt;alert(1)&lt;/script&gt;"));
        assertTrue(content.html().contains("Casa 12 &amp; B"));
        assertTrue(content.html().contains("ana&lt;admin&gt;"));
        assertTrue(content.html().contains("https://portal.example/login"));
        assertTrue(content.text().contains("Nombre de usuario: ana<admin>"));
    }

    @Test
    void rejectionEmailHasFormalToneAndNoUnnecessaryActionButton() {
        var content = template.ownerRejected("Carlos");

        assertTrue(content.subject().contains("Actualización"));
        assertTrue(content.html().contains("Estimado(a) Carlos,"));
        assertTrue(content.html().contains("comunícate con la administración"));
        assertTrue(!content.html().contains("<a href="));
    }

    @Test
    void suppliedCondominiumLogoIsAvailableAsAnEmbeddedClasspathAsset() {
        assertTrue(new ClassPathResource("email/logo-plh.png").exists());
    }
}
