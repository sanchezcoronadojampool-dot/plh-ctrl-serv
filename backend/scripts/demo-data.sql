BEGIN;

DO $$
BEGIN
    IF current_database() <> 'condominio_db' THEN
        RAISE EXCEPTION 'Este script de demostración solo se puede ejecutar en la base local condominio_db.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM staff WHERE activo = TRUE) THEN
        RAISE EXCEPTION 'Crea primero la cuenta inicial de administrador para poder asociar las lecturas de demostración.';
    END IF;
END $$;

INSERT INTO roles_propiedad (id_rol, descripcion)
SELECT '10000000-0000-4000-8000-000000000001', 'propietario'
WHERE NOT EXISTS (
    SELECT 1 FROM roles_propiedad WHERE LOWER(descripcion) = 'propietario'
)
ON CONFLICT (id_rol) DO NOTHING;

INSERT INTO personas (
    id_persona, nombre, apellido_paterno, apellido_materno,
    documento_identidad, correo_electronico, telefono_principal, estatus_cuenta
) VALUES
    ('20000000-0000-4000-8000-000000000001', 'Lucía', 'Martínez', 'Rojas', 'DEMO-DOC-0001', 'lucia.demo@example.test', '+51-900-000-101', 'activo'),
    ('20000000-0000-4000-8000-000000000002', 'Bruno', 'Salazar', 'Paredes', 'DEMO-DOC-0002', 'bruno.demo@example.test', '+51-900-000-102', 'activo'),
    ('20000000-0000-4000-8000-000000000003', 'Elena', 'Ríos', 'Castillo', 'DEMO-DOC-0003', 'elena.demo@example.test', '+51-900-000-103', 'activo')
ON CONFLICT (documento_identidad) DO NOTHING;

INSERT INTO propiedades (
    id_propiedad, codigo_interno, numero_casa, manzana, sector, estatus_ocupacion
) VALUES
    ('30000000-0000-4000-8000-000000000001', 'DEMO-CASA-101', '101', 'A', 'Norte', 'ocupada'),
    ('30000000-0000-4000-8000-000000000002', 'DEMO-CASA-102', '102', 'A', 'Norte', 'ocupada'),
    ('30000000-0000-4000-8000-000000000003', 'DEMO-CASA-201', '201', 'B', 'Sur', 'ocupada')
ON CONFLICT (codigo_interno) DO NOTHING;

INSERT INTO propiedad_personas (
    id_propiedad, id_persona, id_rol, fecha_vinculo, es_responsable_pago
)
SELECT link.id_propiedad, link.id_persona, role.id_rol, CURRENT_DATE, TRUE
FROM (VALUES
    ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000001'::uuid),
    ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000002'::uuid),
    ('30000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000003'::uuid)
) AS link(id_propiedad, id_persona)
CROSS JOIN LATERAL (
    SELECT id_rol FROM roles_propiedad
    WHERE LOWER(descripcion) = 'propietario'
    ORDER BY id_rol
    LIMIT 1
) AS role
ON CONFLICT (id_propiedad, id_persona) DO NOTHING;

INSERT INTO tarifas (
    id_tarifa, tipo_servicio, precio_unidad, cargo_fijo, vigencia_desde, descripcion
)
SELECT '11000000-0000-4000-8000-000000000001', 'agua', 2.5000, 4.00, CURRENT_DATE, 'Tarifa demostrativa de agua'
WHERE NOT EXISTS (
    SELECT 1 FROM tarifas
    WHERE LOWER(tipo_servicio) = 'agua'
      AND (vigencia_hasta IS NULL OR vigencia_hasta >= CURRENT_DATE)
)
ON CONFLICT (id_tarifa) DO NOTHING;

INSERT INTO tarifas (
    id_tarifa, tipo_servicio, precio_unidad, cargo_fijo, vigencia_desde, descripcion
)
SELECT '11000000-0000-4000-8000-000000000002', 'luz', 0.7500, 3.00, CURRENT_DATE, 'Tarifa demostrativa de electricidad'
WHERE NOT EXISTS (
    SELECT 1 FROM tarifas
    WHERE LOWER(tipo_servicio) = 'luz'
      AND (vigencia_hasta IS NULL OR vigencia_hasta >= CURRENT_DATE)
)
ON CONFLICT (id_tarifa) DO NOTHING;

INSERT INTO medidores (
    id_medidor, id_propiedad, id_tarifa, tipo_servicio, numero_serie,
    marca_modelo, lectura_inicial, fecha_instalacion
)
SELECT meter.id_medidor, meter.id_propiedad, tariff.id_tarifa, meter.tipo_servicio,
       meter.numero_serie, meter.marca_modelo, meter.lectura_inicial, CURRENT_DATE - 180
FROM (VALUES
    ('40000000-0000-4000-8000-000000000001'::uuid, '30000000-0000-4000-8000-000000000001'::uuid, 'agua', 'DEMO-AGUA-101', 'DemoFlow A1', 250.00::numeric),
    ('40000000-0000-4000-8000-000000000002'::uuid, '30000000-0000-4000-8000-000000000001'::uuid, 'luz', 'DEMO-LUZ-101', 'DemoVolt E1', 1050.00::numeric),
    ('40000000-0000-4000-8000-000000000003'::uuid, '30000000-0000-4000-8000-000000000002'::uuid, 'agua', 'DEMO-AGUA-102', 'DemoFlow A1', 300.00::numeric),
    ('40000000-0000-4000-8000-000000000004'::uuid, '30000000-0000-4000-8000-000000000002'::uuid, 'luz', 'DEMO-LUZ-102', 'DemoVolt E1', 2350.00::numeric),
    ('40000000-0000-4000-8000-000000000005'::uuid, '30000000-0000-4000-8000-000000000003'::uuid, 'agua', 'DEMO-AGUA-201', 'DemoFlow A1', 180.00::numeric),
    ('40000000-0000-4000-8000-000000000006'::uuid, '30000000-0000-4000-8000-000000000003'::uuid, 'luz', 'DEMO-LUZ-201', 'DemoVolt E1', 820.00::numeric)
) AS meter(id_medidor, id_propiedad, tipo_servicio, numero_serie, marca_modelo, lectura_inicial)
LEFT JOIN LATERAL (
    SELECT id_tarifa
    FROM tarifas
    WHERE LOWER(tipo_servicio) = meter.tipo_servicio
      AND vigencia_desde <= CURRENT_DATE
      AND (vigencia_hasta IS NULL OR vigencia_hasta >= CURRENT_DATE)
    ORDER BY vigencia_desde DESC, id_tarifa
    LIMIT 1
) AS tariff ON TRUE
ON CONFLICT (numero_serie) DO NOTHING;

WITH demo_readings (
    id_lectura, id_medidor, valor_lectura, fecha_lectura, observaciones
) AS (VALUES
    ('50000000-0000-4000-8000-000000000001'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 250.00::numeric, date_trunc('month', CURRENT_DATE::timestamp) - INTERVAL '1 day' + INTERVAL '12 hours', 'DEMO: lectura anterior, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000002'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 258.00::numeric, CURRENT_TIMESTAMP::timestamp, 'DEMO: lectura actual, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000003'::uuid, '40000000-0000-4000-8000-000000000002'::uuid, 1050.00::numeric, date_trunc('month', CURRENT_DATE::timestamp) - INTERVAL '1 day' + INTERVAL '12 hours', 'DEMO: lectura anterior, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000004'::uuid, '40000000-0000-4000-8000-000000000002'::uuid, 1085.00::numeric, CURRENT_TIMESTAMP::timestamp, 'DEMO: lectura actual, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000005'::uuid, '40000000-0000-4000-8000-000000000003'::uuid, 320.00::numeric, date_trunc('month', CURRENT_DATE::timestamp) - INTERVAL '1 day' + INTERVAL '12 hours', 'DEMO: lectura anterior, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000006'::uuid, '40000000-0000-4000-8000-000000000003'::uuid, 334.00::numeric, CURRENT_TIMESTAMP::timestamp, 'DEMO: lectura actual, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000013'::uuid, '40000000-0000-4000-8000-000000000003'::uuid, 305.00::numeric, date_trunc('month', CURRENT_DATE::timestamp) - INTERVAL '1 month' - INTERVAL '1 day' + INTERVAL '12 hours', 'DEMO: lectura histórica, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000014'::uuid, '40000000-0000-4000-8000-000000000003'::uuid, 290.00::numeric, date_trunc('month', CURRENT_DATE::timestamp) - INTERVAL '2 months' - INTERVAL '1 day' + INTERVAL '12 hours', 'DEMO: lectura histórica, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000007'::uuid, '40000000-0000-4000-8000-000000000004'::uuid, 2350.00::numeric, date_trunc('month', CURRENT_DATE::timestamp) - INTERVAL '1 day' + INTERVAL '12 hours', 'DEMO: lectura anterior, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000008'::uuid, '40000000-0000-4000-8000-000000000004'::uuid, 2392.00::numeric, CURRENT_TIMESTAMP::timestamp, 'DEMO: lectura actual, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000009'::uuid, '40000000-0000-4000-8000-000000000005'::uuid, 180.00::numeric, date_trunc('month', CURRENT_DATE::timestamp) - INTERVAL '1 day' + INTERVAL '12 hours', 'DEMO: lectura anterior, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000010'::uuid, '40000000-0000-4000-8000-000000000005'::uuid, 191.00::numeric, CURRENT_TIMESTAMP::timestamp, 'DEMO: lectura actual, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000011'::uuid, '40000000-0000-4000-8000-000000000006'::uuid, 820.00::numeric, date_trunc('month', CURRENT_DATE::timestamp) - INTERVAL '1 day' + INTERVAL '12 hours', 'DEMO: lectura anterior, solo para pruebas.'),
    ('50000000-0000-4000-8000-000000000012'::uuid, '40000000-0000-4000-8000-000000000006'::uuid, 847.00::numeric, CURRENT_TIMESTAMP::timestamp, 'DEMO: lectura actual, solo para pruebas.')
)
INSERT INTO lecturas (
    id_lectura, id_medidor, id_staff, valor_lectura, fecha_lectura, observaciones
)
SELECT demo.id_lectura, demo.id_medidor, staff.id_staff, demo.valor_lectura,
       demo.fecha_lectura::timestamp, demo.observaciones
FROM demo_readings demo
CROSS JOIN LATERAL (
    SELECT id_staff
    FROM staff
    WHERE activo = TRUE
    ORDER BY CASE WHEN LOWER(rol_sistema) IN ('admin', 'administrador') THEN 0 ELSE 1 END, username
    LIMIT 1
) AS staff
ON CONFLICT (id_lectura) DO NOTHING;

WITH invoice_periods (
    id_factura, id_lectura_anterior, id_lectura_actual, estatus_pago, fecha_emision, fecha_vencimiento
) AS (VALUES
    ('60000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000002'::uuid, 'pagado', CURRENT_TIMESTAMP::timestamp, CURRENT_DATE + 15),
    ('60000000-0000-4000-8000-000000000002'::uuid, '50000000-0000-4000-8000-000000000003'::uuid, '50000000-0000-4000-8000-000000000004'::uuid, 'pendiente', CURRENT_TIMESTAMP::timestamp, CURRENT_DATE + 15),
    ('60000000-0000-4000-8000-000000000003'::uuid, '50000000-0000-4000-8000-000000000005'::uuid, '50000000-0000-4000-8000-000000000006'::uuid, 'pendiente', CURRENT_TIMESTAMP::timestamp, CURRENT_DATE + 15),
    ('60000000-0000-4000-8000-000000000004'::uuid, '50000000-0000-4000-8000-000000000007'::uuid, '50000000-0000-4000-8000-000000000008'::uuid, 'pendiente', CURRENT_TIMESTAMP::timestamp, CURRENT_DATE + 15),
    ('60000000-0000-4000-8000-000000000005'::uuid, '50000000-0000-4000-8000-000000000009'::uuid, '50000000-0000-4000-8000-000000000010'::uuid, 'pendiente', CURRENT_TIMESTAMP::timestamp, CURRENT_DATE + 15),
    ('60000000-0000-4000-8000-000000000006'::uuid, '50000000-0000-4000-8000-000000000011'::uuid, '50000000-0000-4000-8000-000000000012'::uuid, 'pendiente', CURRENT_TIMESTAMP::timestamp, CURRENT_DATE + 15),
    ('60000000-0000-4000-8000-000000000007'::uuid, '50000000-0000-4000-8000-000000000014'::uuid, '50000000-0000-4000-8000-000000000013'::uuid, 'vencido', (date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '1 month' - INTERVAL '1 day')::timestamp, date_trunc('month', CURRENT_DATE)::date - 16)
)
INSERT INTO facturas (
    id_factura, id_lectura, id_propiedad, id_persona_cobro,
    consumo_periodo, monto_subtotal, monto_cargo_fijo, monto_total,
    fecha_emision, fecha_vencimiento, estatus_pago, metodo_pago, fecha_pago
)
SELECT period.id_factura,
       current_reading.id_lectura,
       meter.id_propiedad,
       owner.id_persona,
       current_reading.valor_lectura - previous_reading.valor_lectura,
       ROUND((current_reading.valor_lectura - previous_reading.valor_lectura) * tariff.precio_unidad, 2),
       COALESCE(tariff.cargo_fijo, 0),
       ROUND((current_reading.valor_lectura - previous_reading.valor_lectura) * tariff.precio_unidad, 2) + COALESCE(tariff.cargo_fijo, 0),
       period.fecha_emision,
       period.fecha_vencimiento,
       period.estatus_pago,
       CASE WHEN period.estatus_pago = 'pagado' THEN 'Transferencia (demo)' ELSE NULL END,
       CASE WHEN period.estatus_pago = 'pagado' THEN CURRENT_TIMESTAMP::timestamp ELSE NULL END
FROM invoice_periods period
JOIN lecturas previous_reading ON previous_reading.id_lectura = period.id_lectura_anterior
JOIN lecturas current_reading ON current_reading.id_lectura = period.id_lectura_actual
JOIN medidores meter ON meter.id_medidor = current_reading.id_medidor
JOIN tarifas tariff ON tariff.id_tarifa = meter.id_tarifa
JOIN propiedad_personas owner
  ON owner.id_propiedad = meter.id_propiedad
 AND owner.es_responsable_pago = TRUE
ON CONFLICT (id_lectura) DO NOTHING;

COMMIT;

SELECT 'propiedades' AS tabla, COUNT(*) AS registros FROM propiedades WHERE codigo_interno LIKE 'DEMO-%'
UNION ALL
SELECT 'medidores', COUNT(*) FROM medidores WHERE numero_serie LIKE 'DEMO-%'
UNION ALL
SELECT 'lecturas', COUNT(*) FROM lecturas WHERE observaciones LIKE 'DEMO:%'
UNION ALL
SELECT 'facturas', COUNT(*) FROM facturas f
JOIN lecturas l ON l.id_lectura = f.id_lectura
WHERE l.observaciones LIKE 'DEMO:%';
