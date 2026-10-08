package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "personas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Persona {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idPersona;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellidoPaterno;

    private String apellidoMaterno;

    @Column(unique = true, nullable = false)
    private String documentoIdentidad;

    private String telefonoPrincipal;
    private String correoElectronico;

    @Builder.Default
    private String estatusCuenta = "activo";
}
