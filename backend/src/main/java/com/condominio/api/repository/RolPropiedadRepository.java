package com.condominio.api.repository;

import com.condominio.api.model.RolPropiedad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RolPropiedadRepository extends JpaRepository<RolPropiedad, UUID> {
    Optional<RolPropiedad> findByDescripcionIgnoreCase(String descripcion);
}
