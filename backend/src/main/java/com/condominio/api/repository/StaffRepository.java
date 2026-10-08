package com.condominio.api.repository;

import com.condominio.api.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface StaffRepository extends JpaRepository<Staff, UUID> {
    Optional<Staff> findByUsernameIgnoreCase(String username);
    Optional<Staff> findFirstByPersona_CorreoElectronicoIgnoreCaseAndActivoTrue(String correoElectronico);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByUsernameIgnoreCaseAndIdStaffNot(String username, UUID idStaff);
    boolean existsByPersona_IdPersona(UUID idPersona);
    @Query("SELECT COUNT(s) FROM Staff s WHERE s.activo = true AND LOWER(s.rolSistema) IN ('admin', 'administrador')")
    long countActiveAdministrators();
    @Query("SELECT s FROM Staff s WHERE s.activo = true AND LOWER(s.rolSistema) IN ('admin', 'administrador')")
    List<Staff> findActiveAdministrators();
}
