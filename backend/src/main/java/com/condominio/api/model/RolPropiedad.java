package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "roles_propiedad")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolPropiedad {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idRol;

    @Column(nullable = false, length = 50)
    private String descripcion;
}
