package com.condominio.api.service;

import jakarta.mail.MessagingException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;

@Component
public class BrandedEmailTemplate {
    private static final String LOGO_CONTENT_ID = "plh-logo";
    private static final String LOGO_PATH = "email/logo-plh.png";

    public EmailContent passwordReset(String recipientName, String link, long expirationMinutes) {
        String safeLink = escape(link);
        String subject = "Solicitud de restablecimiento de contraseña";
        String greeting = greeting(recipientName);
        String htmlContent = "<p>Hemos recibido una solicitud para restablecer la contraseña de acceso "
            + "al Portal de Propietarios del Condominio Playa La Honda.</p>"
            + "<p>Para continuar de forma segura, selecciona el siguiente botón. El enlace es personal "
            + "y solo puede utilizarse una vez.</p>";
        String textContent = greeting + "\n\n"
            + "Hemos recibido una solicitud para restablecer la contraseña de acceso al Portal de Propietarios "
            + "del Condominio Playa La Honda.\n\n"
            + "Para continuar de forma segura, abre este enlace. Es personal y solo puede utilizarse una vez:\n"
            + link + "\n\n"
            + "El enlace vence en " + expirationMinutes + " minutos. Si no solicitaste este cambio, "
            + "ignora este mensaje; tu contraseña actual seguirá vigente.";
        String html = render(
            subject,
            "Instrucciones seguras para restablecer el acceso al portal.",
            greeting,
            htmlContent,
            "Restablecer contraseña",
            safeLink,
            "El enlace vence en " + expirationMinutes + " minutos. Si no solicitaste este cambio, "
                + "ignora este mensaje; tu contraseña actual seguirá vigente."
        );
        return new EmailContent(subject, textContent, html);
    }

    public EmailContent ownerApproved(
        String recipientName,
        String propertyNumber,
        String username,
        String loginUrl
    ) {
        String subject = "Confirmación de aprobación de acceso al portal";
        String greeting = greeting(recipientName);
        String htmlContent = "<p>Nos complace informarte que tu solicitud de acceso al Portal de Propietarios "
            + "del Condominio Playa La Honda ha sido aprobada.</p>"
            + "<div style=\"margin:22px 0;padding:16px 18px;border:1px solid #dbe5ef;border-radius:8px;"
            + "background:#f7f9fc\"><div style=\"font-size:12px;color:#526174\">INMUEBLE ASOCIADO</div>"
            + "<div style=\"margin-top:5px;font-size:18px;font-weight:700;color:#003b73\">Casa "
            + escape(propertyNumber) + "</div></div>"
            + "<p>Tu nombre de usuario es <strong style=\"color:#003b73\">"
            + escape(username) + "</strong>. Ingresa con la contraseña que definiste al registrarte.</p>";
        String textContent = greeting + "\n\n"
            + "Nos complace informarte que tu solicitud de acceso al Portal de Propietarios "
            + "del Condominio Playa La Honda ha sido aprobada.\n"
            + "Inmueble asociado: Casa " + propertyNumber + "\n"
            + "Nombre de usuario: " + username + "\n"
            + "Ingresa con la contraseña que definiste al registrarte:\n" + loginUrl;
        return new EmailContent(
            subject,
            textContent,
            render(
                subject,
                "Tu acceso al Portal de Propietarios ha sido aprobado.",
                greeting,
                htmlContent,
                "Ingresar al portal",
                escape(loginUrl),
                "Por seguridad, nunca compartas tu contraseña. Si no reconoces esta solicitud, "
                    + "comunícate con la administración del condominio."
            )
        );
    }

    public EmailContent ownerRejected(String recipientName) {
        String subject = "Actualización de tu solicitud de acceso";
        String greeting = greeting(recipientName);
        String htmlContent = "<p>La administración ha revisado tu solicitud de acceso al Portal de Propietarios "
            + "del Condominio Playa La Honda.</p>"
            + "<p>En esta oportunidad, la solicitud no ha sido aprobada. Si consideras que se trata de un error "
            + "o deseas conocer más información, comunícate con la administración del condominio.</p>";
        String textContent = greeting + "\n\n"
            + "La administración ha revisado tu solicitud de acceso al Portal de Propietarios "
            + "del Condominio Playa La Honda.\n"
            + "En esta oportunidad, la solicitud no ha sido aprobada. Si consideras que se trata de un error "
            + "o deseas conocer más información, comunícate con la administración del condominio.";
        return new EmailContent(
            subject,
            textContent,
            render(
                subject,
                "Información sobre el resultado de tu solicitud de acceso.",
                greeting,
                htmlContent,
                null,
                null,
                "Este mensaje fue enviado por la administración del Condominio Playa La Honda."
            )
        );
    }

    public void addLogo(MimeMessageHelper helper) throws MessagingException {
        helper.addInline(LOGO_CONTENT_ID, new ClassPathResource(LOGO_PATH), "image/png");
    }

    private static String render(
        String title,
        String preheader,
        String greeting,
        String content,
        String buttonLabel,
        String buttonUrl,
        String note
    ) {
        String safeTitle = escape(title);
        String safePreheader = escape(preheader);
        String safeGreeting = escape(greeting);
        String safeNote = escape(note);
        String action = buttonLabel == null ? ""
            : "<table role=\"presentation\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" "
                + "style=\"margin:26px 0 22px\"><tr><td align=\"center\" bgcolor=\"#003b73\" "
                + "style=\"border-radius:7px\"><a href=\"" + buttonUrl + "\" "
                + "style=\"display:inline-block;padding:13px 22px;border:1px solid #003b73;border-radius:7px;"
                + "color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;"
                + "text-decoration:none\">" + escape(buttonLabel) + "</a></td></tr></table>"
                + "<p style=\"margin:0 0 22px;color:#526174;font-size:13px;line-height:1.65\">"
                + "Si el botón no funciona, copia y pega este enlace en tu navegador:<br>"
                + "<a href=\"" + buttonUrl + "\" style=\"color:#005d83;word-break:break-all\">"
                + buttonUrl + "</a></p>";

        return "<!doctype html><html lang=\"es\"><head><meta charset=\"UTF-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<meta name=\"x-apple-disable-message-reformatting\"><title>" + safeTitle + "</title></head>"
            + "<body style=\"margin:0;padding:0;background-color:#f3f6f9;color:#263445;"
            + "font-family:Arial,Helvetica,sans-serif\">"
            + "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent\">"
            + safePreheader + "</div>"
            + "<table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" "
            + "style=\"background-color:#f3f6f9\"><tr><td align=\"center\" style=\"padding:32px 14px\">"
            + "<table role=\"presentation\" width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" "
            + "style=\"width:100%;max-width:600px;border:1px solid #dfe6ee;border-radius:12px;"
            + "overflow:hidden;background-color:#ffffff\">"
            + "<tr><td style=\"height:5px;background-color:#007f8d;font-size:0;line-height:0\">&nbsp;</td></tr>"
            + "<tr><td align=\"center\" style=\"padding:25px 28px 21px;background:#ffffff\">"
            + "<img src=\"cid:" + LOGO_CONTENT_ID + "\" width=\"260\" alt=\"Condominio Playa La Honda\" "
            + "style=\"display:block;width:100%;max-width:260px;height:auto;border:0;outline:none;"
            + "text-decoration:none\">"
            + "<div style=\"margin-top:13px;color:#526174;font-size:10px;font-weight:bold;"
            + "letter-spacing:2px;text-transform:uppercase\">Comunicado oficial</div></td></tr>"
            + "<tr><td style=\"padding:0 34px\"><div style=\"height:1px;background:#e8edf2\"></div></td></tr>"
            + "<tr><td style=\"padding:27px 34px 30px\">"
            + "<h1 style=\"margin:0 0 18px;color:#003b73;font-size:22px;line-height:1.35\">"
            + safeTitle + "</h1>"
            + "<p style=\"margin:0 0 16px;color:#263445;font-size:15px;line-height:1.6\">"
            + safeGreeting + "</p>"
            + "<div style=\"color:#374151;font-size:14px;line-height:1.75\">" + content + "</div>"
            + action
            + "<div style=\"margin-top:21px;padding:13px 15px;border-left:3px solid #ff5b35;"
            + "background:#fff8f5;color:#526174;font-size:12px;line-height:1.65\">"
            + safeNote + "</div>"
            + "<p style=\"margin:24px 0 0;color:#374151;font-size:14px;line-height:1.6\">"
            + "Atentamente,<br><strong style=\"color:#003b73\">Administración</strong><br>"
            + "Condominio Playa La Honda</p>"
            + "</td></tr><tr><td style=\"padding:17px 28px;background:#f7f9fb;text-align:center\">"
            + "<p style=\"margin:0;color:#526174;font-size:11px;line-height:1.6\">"
            + "Este mensaje se generó automáticamente. Por favor, no respondas a este correo."
            + "</p><p style=\"margin:6px 0 0;color:#7b8794;font-size:10px\">"
            + "MAR · NATURALEZA · BIENESTAR</p></td></tr></table>"
            + "<p style=\"margin:15px 0 0;color:#7b8794;font-size:10px;text-align:center\">"
            + "© Condominio Playa La Honda</p>"
            + "</td></tr></table></body></html>";
    }

    private static String greeting(String name) {
        String safeName = name == null || name.isBlank() ? "estimado(a) usuario(a)" : name.trim();
        return "Estimado(a) " + safeName + ",";
    }

    private static String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value, StandardCharsets.UTF_8.name());
    }

    public record EmailContent(String subject, String text, String html) {}
}
