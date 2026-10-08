ALTER TABLE medidores
    ADD COLUMN IF NOT EXISTS id_tarifa UUID REFERENCES tarifas(id_tarifa),
    ADD COLUMN IF NOT EXISTS marca_modelo VARCHAR(100);

ALTER TABLE lecturas
    ADD COLUMN IF NOT EXISTS observaciones TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'lecturas'
          AND column_name = 'fecha_lectura'
          AND data_type = 'timestamp with time zone'
    ) THEN
        ALTER TABLE lecturas
            ALTER COLUMN fecha_lectura TYPE TIMESTAMP WITHOUT TIME ZONE
            USING fecha_lectura AT TIME ZONE current_setting('TimeZone');
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'lecturas'
          AND column_name = 'coordenadas_captura'
          AND udt_name = 'point'
    ) THEN
        ALTER TABLE lecturas
            ALTER COLUMN coordenadas_captura TYPE VARCHAR(100)
            USING coordenadas_captura::text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'facturas'
          AND column_name IN ('fecha_emision', 'fecha_pago')
          AND data_type = 'timestamp with time zone'
    ) THEN
        ALTER TABLE facturas
            ALTER COLUMN fecha_emision TYPE TIMESTAMP WITHOUT TIME ZONE
            USING fecha_emision AT TIME ZONE current_setting('TimeZone'),
            ALTER COLUMN fecha_pago TYPE TIMESTAMP WITHOUT TIME ZONE
            USING fecha_pago AT TIME ZONE current_setting('TimeZone');
    END IF;
END $$;
