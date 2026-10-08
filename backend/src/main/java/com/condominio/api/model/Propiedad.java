package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "propiedades")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Propiedad {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idPropiedad;

    @Column(unique = true, nullable = false, length = 50)
    private String codigoInterno;

    @Column(nullable = false, length = 20)
    private String numeroCasa;

    @Column(length = 20)
    private String manzana;

    @Column(length = 50)
    private String sector;

    @Column(length = 20)
    private String estatusOcupacion;
}
