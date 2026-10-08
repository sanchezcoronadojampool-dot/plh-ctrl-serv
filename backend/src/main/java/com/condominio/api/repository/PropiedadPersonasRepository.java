package com.condominio.api.repository;

import com.condominio.api.model.PropiedadPersona;
import com.condominio.api.model.PropiedadPersonaId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropiedadPersonasRepository extends JpaRepository<PropiedadPersona, PropiedadPersonaId> {
    List<PropiedadPersona> findAllByPropiedad_IdPropiedad(UUID idPropiedad);
    List<PropiedadPersona> findAllByPersona_IdPersona(UUID idPersona);
    Optional<PropiedadPersona> findFirstByPropiedad_IdPropiedadAndEsResponsablePagoTrue(UUID idPropiedad);
    boolean existsByPersona_IdPersona(UUID idPersona);
}
