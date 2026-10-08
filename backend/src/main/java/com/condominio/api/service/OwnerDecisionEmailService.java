package com.condominio.api.service;

import com.condominio.api.model.OwnerRegistration;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class OwnerDecisionEmailService {
    private final JavaMailSender mailSender;
    private final BrandedEmailTemplate emailTemplate;

    @Value("${spring.mail.host:}")
    private String mailHost;
    @Value("${spring.mail.username:}")
    private String mailUsername;
    @Value("${spring.mail.password:}")
    private String mailPassword;
    @Value("${app.mail.from:}")
    private String from;
    @Value("${app.frontend-origin:http://localhost:4200}")
    private String frontendOrigin;

    public void approved(OwnerRegistration registration, String propertyNumber) {
        send(
            registration,
            emailTemplate.ownerApproved(
                registration.getNombre() + " " + registration.getApellidoPaterno(),
                propertyNumber,
                registration.getUsername(),
                loginUrl()
            )
        );
    }

    public void rejected(OwnerRegistration registration) {
        send(
            registration,
            emailTemplate.ownerRejected(registration.getNombre() + " " + registration.getApellidoPaterno())
        );
    }

    private void send(OwnerRegistration registration, BrandedEmailTemplate.EmailContent content) {
        if (registration.getCorreoElectronico() == null || registration.getCorreoElectronico().isBlank()) {
            return;
        }
        if (mailHost == null || mailHost.isBlank()
            || mailUsername == null || mailUsername.isBlank()
            || mailPassword == null || mailPassword.isBlank()
            || from == null || from.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "No se puede notificar al propietario: configura usuario, contraseña de aplicación y remitente SMTP."
            );
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(registration.getCorreoElectronico());
            helper.setSubject(content.subject());
            helper.setText(content.text(), content.html());
            emailTemplate.addLogo(helper);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "No se pudo notificar al propietario por correo.",
                exception
            );
        }
    }

    private String loginUrl() {
        return frontendOrigin.replaceAll("/+$", "") + "/login";
    }

}
