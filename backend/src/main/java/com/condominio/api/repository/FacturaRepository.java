package com.condominio.api.repository;

import com.condominio.api.model.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;

public interface FacturaRepository extends JpaRepository<Factura, UUID> {
    List<Factura> findAllByOrderByFechaEmisionDesc();
    List<Factura> findAllByEstatusPagoIgnoreCase(String estatusPago);
    List<Factura> findAllByEstatusPagoIgnoreCaseIn(java.util.Collection<String> estatusPagos);
    List<Factura> findAllByEstatusPagoIgnoreCaseAndFechaVencimientoBefore(String estatusPago, LocalDate fecha);
    Optional<Factura> findByLectura_IdLectura(UUID idLectura);
    List<Factura> findAllByPropiedad_IdPropiedadInOrderByFechaEmisionDesc(List<UUID> propertyIds);
}
