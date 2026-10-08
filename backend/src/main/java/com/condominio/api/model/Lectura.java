package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lecturas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Lectura {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idLectura;

    @ManyToOne
    @JoinColumn(name = "id_medidor", nullable = false)
    private Medidor medidor;

    @ManyToOne
    @JoinColumn(name = "id_staff", nullable = false)
    private Staff staff;

    @Column(nullable = false)
    private BigDecimal valorLectura;

    @Builder.Default
    private LocalDateTime fechaLectura = LocalDateTime.now();
    @Column(columnDefinition = "text")
    private String fotoEvidenciaUrl;

    @Column(length = 100)
    private String coordenadasCaptura;

    @Column(columnDefinition = "text")
    private String observaciones;
}
