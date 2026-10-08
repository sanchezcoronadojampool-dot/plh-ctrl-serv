package com.condominio.api.controller;

import com.condominio.api.dto.PersonaOption;
import com.condominio.api.dto.PropiedadRequest;
import com.condominio.api.dto.PropiedadResponse;
import com.condominio.api.service.PropiedadAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PropiedadController {
    private final PropiedadAdminService propiedadService;

    @GetMapping("/propiedades")
    public List<PropiedadResponse> listarPropiedades() {
        return propiedadService.listar();
    }

    @PostMapping("/propiedades")
    @ResponseStatus(HttpStatus.CREATED)
    public PropiedadResponse crearPropiedad(@Valid @RequestBody PropiedadRequest request) {
        return propiedadService.crear(request);
    }

    @PutMapping("/propiedades/{id}")
    public PropiedadResponse actualizarPropiedad(@PathVariable UUID id, @Valid @RequestBody PropiedadRequest request) {
        return propiedadService.actualizar(id, request);
    }

    @DeleteMapping("/propiedades/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarPropiedad(@PathVariable UUID id) {
        propiedadService.eliminar(id);
    }

    @GetMapping("/personas/residentes")
    public List<PersonaOption> listarPersonas() {
        return propiedadService.listarPersonas();
    }
}
