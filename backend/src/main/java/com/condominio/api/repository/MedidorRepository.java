package com.condominio.api.repository;
import com.condominio.api.model.Medidor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface MedidorRepository extends JpaRepository<Medidor, UUID> {
    boolean existsByPropiedad_IdPropiedad(UUID idPropiedad);
    boolean existsByTarifa_IdTarifa(UUID idTarifa);
    boolean existsByNumeroSerieIgnoreCase(String numeroSerie);
    boolean existsByNumeroSerieIgnoreCaseAndIdMedidorNot(String numeroSerie, UUID idMedidor);
    java.util.Optional<Medidor> findByNumeroSerieIgnoreCase(String numeroSerie);
    List<Medidor> findAllByPropiedad_IdPropiedadIn(List<UUID> propertyIds);
    List<Medidor> findAllByPropiedad_IdPropiedadOrderByTipoServicioAscNumeroSerieAsc(UUID propertyId);
    List<Medidor> findAllByOrderByNumeroSerieAsc();
}
