package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "medidores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Medidor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idMedidor;

    @ManyToOne
    @JoinColumn(name = "id_propiedad")
    private Propiedad propiedad;

    @ManyToOne
    @JoinColumn(name = "id_tarifa")
    private Tarifa tarifa;

    @Column(nullable = false)
    private String tipoServicio;

    @Column(unique = true, nullable = false)
    private String numeroSerie;

    private BigDecimal lecturaInicial;
    private String marcaModelo;
}
