package com.condominio.api.service;

import com.condominio.api.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PasswordResetTokenMaintenanceService {
    private final PasswordResetTokenRepository tokenRepository;

    @Scheduled(cron = "${app.password-reset.cleanup-cron:0 10 2 * * *}", zone = "${app.time-zone:America/Lima}")
    @Transactional
    public void deleteExpiredTokens() {
        LocalDateTime retentionCutoff = LocalDateTime.now().minusDays(1);
        tokenRepository.deleteByExpiresAtBefore(retentionCutoff);
        tokenRepository.deleteByUsedAtBefore(retentionCutoff);
    }
}
