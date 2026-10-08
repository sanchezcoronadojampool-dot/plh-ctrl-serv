package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "facturas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Factura {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idFactura;

    @OneToOne
    @JoinColumn(name = "id_lectura", unique = true)
    private Lectura lectura;

    @ManyToOne
    @JoinColumn(name = "id_propiedad")
    private Propiedad propiedad;

    @ManyToOne
    @JoinColumn(name = "id_persona_cobro")
    private Persona personaCobro;

    private BigDecimal consumoPeriodo;
    private BigDecimal montoSubtotal;
    private BigDecimal montoCargoFijo;
    private BigDecimal montoTotal;
    
    @Builder.Default
    private LocalDateTime fechaEmision = LocalDateTime.now();

    private LocalDate fechaVencimiento;
    
    private String estatusPago = "pendiente";
    private String metodoPago;
    private LocalDateTime fechaPago;
}
