package com.condominio.api.repository;
import com.condominio.api.model.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface PersonaRepository extends JpaRepository<Persona, UUID> {
    Optional<Persona> findByDocumentoIdentidadIgnoreCase(String documentoIdentidad);
    Optional<Persona> findByCorreoElectronicoIgnoreCase(String correoElectronico);
}
