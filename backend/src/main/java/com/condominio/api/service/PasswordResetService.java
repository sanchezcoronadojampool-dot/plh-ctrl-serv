package com.condominio.api.service;

import com.condominio.api.dto.PasswordResetCompletionRequest;
import com.condominio.api.dto.PasswordResetRequest;
import com.condominio.api.exception.ConflictException;
import com.condominio.api.model.PasswordResetToken;
import com.condominio.api.model.Staff;
import com.condominio.api.repository.PasswordResetTokenRepository;
import com.condominio.api.repository.StaffRepository;
import com.condominio.api.util.PasswordPolicy;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final StaffRepository staffRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final BrandedEmailTemplate emailTemplate;
    private final MailSettings mailSettings;

    @Value("${app.password-reset.base-url}")
    private String resetBaseUrl;
    @Value("${app.password-reset.expiration-minutes:30}")
    private long expirationMinutes;

    @Transactional
    public void request(PasswordResetRequest request) {
        if (!mailSettings.isConfigured()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "El correo no está configurado. Define usuario, contraseña de aplicación y remitente SMTP."
            );
        }
        if (expirationMinutes <= 0 || resetBaseUrl == null || resetBaseUrl.isBlank()) {
            throw new IllegalStateException("La vigencia o URL de recuperación no está configurada correctamente.");
        }

        staffRepository.findFirstByPersona_CorreoElectronicoIgnoreCaseAndActivoTrue(request.email().trim())
            .ifPresent(staff -> createAndSendToken(staff, request.email().trim()));
    }

    @Transactional
    public void complete(PasswordResetCompletionRequest request) {
        PasswordResetToken token = tokenRepository
            .findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(sha256(request.token()), LocalDateTime.now())
            .orElseThrow(() -> new ConflictException("El enlace de recuperación no es válido o ya venció."));
        validatePassword(request.password());
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);
        token.getStaff().setPasswordHash(passwordEncoder.encode(request.password()));
        token.getStaff().setPasswordVersion(token.getStaff().getPasswordVersion() + 1);
        staffRepository.save(token.getStaff());
    }

    private void createAndSendToken(Staff staff, String email) {
        LocalDateTime now = LocalDateTime.now();
        tokenRepository.invalidateUnusedForStaff(staff.getIdStaff(), now);
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        PasswordResetToken token = new PasswordResetToken();
        token.setStaff(staff);
        token.setTokenHash(sha256(rawToken));
        token.setCreatedAt(now);
        token.setExpiresAt(now.plusMinutes(expirationMinutes));
        tokenRepository.save(token);

        String link = resetBaseUrl + (resetBaseUrl.contains("?") ? "&" : "?") + "token=" + rawToken;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mailSettings.from());
            helper.setTo(email);
            BrandedEmailTemplate.EmailContent content = emailTemplate.passwordReset(
                recipientName(staff), link, expirationMinutes
            );
            helper.setSubject(content.subject());
            helper.setText(content.text(), content.html());
            emailTemplate.addLogo(helper);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "No se pudo enviar el correo de recuperación.",
                exception
            );
        }
    }

    private static String recipientName(Staff staff) {
        if (staff.getNombre() != null && !staff.getNombre().isBlank()) {
            return staff.getNombre();
        }
        if (staff.getPersona() != null) {
            return (staff.getPersona().getNombre() + " " + staff.getPersona().getApellidoPaterno()).trim();
        }
        return staff.getUsername();
    }

    private static void validatePassword(String password) {
        PasswordPolicy.validate(password);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no está disponible.", exception);
        }
    }
}
