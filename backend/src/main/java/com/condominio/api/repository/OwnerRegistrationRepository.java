package com.condominio.api.repository;

import com.condominio.api.model.OwnerRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OwnerRegistrationRepository extends JpaRepository<OwnerRegistration, UUID> {
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByDocumentoIdentidadIgnoreCase(String documentoIdentidad);
    List<OwnerRegistration> findAllByOrderByFechaSolicitudAsc();
}
