package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "staff")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idStaff;

    @ManyToOne
    @JoinColumn(name = "id_persona")
    private Persona persona;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false, columnDefinition = "text")
    private String passwordHash;

    @Column(length = 20)
    private String rolSistema;
    
    @Builder.Default
    private boolean activo = true;

    @Column(length = 200)
    private String nombre;

    @Column(nullable = false)
    private int passwordVersion;
}
