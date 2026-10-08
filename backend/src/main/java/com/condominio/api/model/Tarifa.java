package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tarifas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tarifa {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idTarifa;

    @Column(nullable = false)
    private String tipoServicio; // "agua", "luz"

    @Column(nullable = false)
    private BigDecimal precioUnidad;

    private BigDecimal cargoFijo = java.math.BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDate vigenciaDesde;

    private LocalDate vigenciaHasta;
    private String descripcion;
}
