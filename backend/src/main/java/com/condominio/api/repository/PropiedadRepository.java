package com.condominio.api.repository;
import com.condominio.api.model.Propiedad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PropiedadRepository extends JpaRepository<Propiedad, UUID> {
    long countByEstatusOcupacionIgnoreCase(String estatusOcupacion);
}
