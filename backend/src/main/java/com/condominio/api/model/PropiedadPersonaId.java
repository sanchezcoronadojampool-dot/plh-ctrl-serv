package com.condominio.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PropiedadPersonaId implements Serializable {
    @Column(name = "id_propiedad")
    private UUID idPropiedad;

    @Column(name = "id_persona")
    private UUID idPersona;
}
