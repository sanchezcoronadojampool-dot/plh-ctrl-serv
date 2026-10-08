package com.condominio.api.repository;

import com.condominio.api.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    @Modifying
    @Query("update PasswordResetToken t set t.usedAt = :usedAt where t.staff.idStaff = :staffId and t.usedAt is null")
    int invalidateUnusedForStaff(@Param("staffId") UUID staffId, @Param("usedAt") LocalDateTime usedAt);

    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
        String tokenHash,
        LocalDateTime now
    );

    int deleteByExpiresAtBefore(LocalDateTime cutoff);

    int deleteByUsedAtBefore(LocalDateTime cutoff);
}
