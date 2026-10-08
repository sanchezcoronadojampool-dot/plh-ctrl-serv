package com.condominio.api.repository;

import com.condominio.api.model.Tarifa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface TarifaRepository extends JpaRepository<Tarifa, UUID> {
    @Query("SELECT t FROM Tarifa t WHERE t.tipoServicio = :tipo AND t.vigenciaDesde <= :fecha AND (t.vigenciaHasta IS NULL OR t.vigenciaHasta >= :fecha)")
    Optional<Tarifa> findByTipoServicioAndVigente(String tipo, LocalDate fecha);
    List<Tarifa> findAllByOrderByTipoServicioAscVigenciaDesdeDesc();
    List<Tarifa> findAllByTipoServicioIgnoreCase(String tipoServicio);
}
