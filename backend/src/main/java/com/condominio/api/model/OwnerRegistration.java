package com.condominio.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "owner_registration_requests")
@Getter
@Setter
@NoArgsConstructor
public class OwnerRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellidoPaterno;

    @Column(length = 100)
    private String apellidoMaterno;

    @Column(nullable = false, unique = true, length = 50)
    private String documentoIdentidad;

    @Column(nullable = false, length = 20)
    private String telefono;

    @Column(length = 255)
    private String correoElectronico;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, columnDefinition = "text")
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String inmueble;

    @Column(nullable = false)
    private LocalDateTime fechaSolicitud = LocalDateTime.now();
}
