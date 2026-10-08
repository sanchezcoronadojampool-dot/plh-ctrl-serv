package com.condominio.api.service;

import com.condominio.api.model.Staff;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtService(
        @Value("${security.jwt.secret}") String secret,
        @Value("${security.jwt.expiration-ms:43200000}") long expirationMillis
    ) {
        String normalizedSecret = secret == null ? "" : secret.trim();
        byte[] secretBytes = normalizedSecret.getBytes(StandardCharsets.UTF_8);
        if (normalizedSecret.isBlank() || secretBytes.length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET no está configurado o tiene menos de 32 bytes. "
                    + "Define JWT_SECRET en el entorno del proceso que inicia el backend."
            );
        }
        if (expirationMillis <= 0) {
            throw new IllegalStateException("La duración del JWT debe ser mayor que cero.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMillis = expirationMillis;
    }

    public String issueToken(Staff staff) {
        Instant now = Instant.now();
        return Jwts.builder()
            .setSubject(staff.getUsername())
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plusMillis(expirationMillis)))
            .claim("pv", staff.getPasswordVersion())
            .signWith(signingKey)
            .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(signingKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
