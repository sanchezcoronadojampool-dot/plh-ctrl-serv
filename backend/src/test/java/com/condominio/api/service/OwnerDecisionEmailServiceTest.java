package com.condominio.api.service;

import com.condominio.api.model.OwnerRegistration;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class OwnerDecisionEmailServiceTest {
    private final MailSettings mailSettings = new MailSettings();
    private final OwnerDecisionEmailService service = new OwnerDecisionEmailService(
        mock(org.springframework.mail.javamail.JavaMailSender.class),
        new BrandedEmailTemplate(),
        mailSettings
    );

    @Test
    void doesNotAttemptToSendWhenRequestHasNoEmail() {
        OwnerRegistration registration = new OwnerRegistration();

        service.rejected(registration);
    }

    @Test
    void refusesToSendWhenGmailCredentialsAreIncomplete() {
        ReflectionTestUtils.setField(mailSettings, "host", "smtp.gmail.com");
        ReflectionTestUtils.setField(mailSettings, "username", "admin@example.com");
        ReflectionTestUtils.setField(mailSettings, "password", "");
        ReflectionTestUtils.setField(mailSettings, "from", "admin@example.com");
        ReflectionTestUtils.setField(service, "frontendOrigin", "http://localhost:4200");
        OwnerRegistration registration = new OwnerRegistration();
        registration.setCorreoElectronico("owner@example.com");

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> service.approved(registration, "12")
        );

        assertEquals(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
    }
}
