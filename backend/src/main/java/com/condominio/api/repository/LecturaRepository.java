package com.condominio.api.repository;

import com.condominio.api.model.Lectura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LecturaRepository extends JpaRepository<Lectura, UUID> {
    Optional<Lectura> findFirstByMedidor_IdMedidorOrderByFechaLecturaDesc(UUID idMedidor);
    Optional<Lectura> findFirstByMedidor_IdMedidorAndFechaLecturaBeforeOrderByFechaLecturaDesc(
        UUID idMedidor,
        LocalDateTime fecha
    );
    long countByStaff_IdStaffAndFechaLecturaGreaterThanEqual(UUID idStaff, LocalDateTime fecha);
    long countByFechaLecturaGreaterThanEqual(LocalDateTime fecha);
    boolean existsByStaff_IdStaff(UUID idStaff);
    boolean existsByMedidor_IdMedidor(UUID idMedidor);
    List<Lectura> findAllByFechaLecturaGreaterThanEqualAndFechaLecturaLessThanOrderByFechaLecturaAsc(
        LocalDateTime inicio,
        LocalDateTime fin
    );
    List<Lectura> findAllByMedidor_IdMedidorInOrderByFechaLecturaDesc(List<UUID> medidorIds);
    @Query("""
        SELECT l FROM Lectura l
        WHERE (:service = '' OR LOWER(l.medidor.tipoServicio) = :service)
          AND (:filterProperty = false OR l.medidor.propiedad.idPropiedad = :propertyId)
          AND (:filterFromDate = false OR l.fechaLectura >= :fromDate)
          AND (:filterToDate = false OR l.fechaLectura < :toDate)
          AND (:query = '' OR LOWER(l.medidor.propiedad.numeroCasa) LIKE :query
              OR LOWER(l.medidor.numeroSerie) LIKE :query
              OR LOWER(l.staff.username) LIKE :query
              OR LOWER(COALESCE(l.staff.nombre, '')) LIKE :query)
        """)
    Page<Lectura> findHistory(
        @Param("service") String service,
        @Param("filterProperty") boolean filterProperty,
        @Param("propertyId") UUID propertyId,
        @Param("filterFromDate") boolean filterFromDate,
        @Param("fromDate") LocalDateTime fromDate,
        @Param("filterToDate") boolean filterToDate,
        @Param("toDate") LocalDateTime toDate,
        @Param("query") String query,
        Pageable pageable
    );
}
