package com.condominio.api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "propiedad_personas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropiedadPersona {
    @EmbeddedId
    private PropiedadPersonaId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idPropiedad")
    @JoinColumn(name = "id_propiedad", nullable = false)
    private Propiedad propiedad;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idPersona")
    @JoinColumn(name = "id_persona", nullable = false)
    private Persona persona;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_rol")
    private RolPropiedad rol;

    @Builder.Default
    private LocalDate fechaVinculo = LocalDate.now();

    @Builder.Default
    private boolean esResponsablePago = true;
}
