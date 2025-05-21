-- Tabla para registrar las operaciones de uso y devolución de efectivo
CREATE TABLE IF NOT EXISTS uso_devolucion (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('USO', 'DEVOLUCION')),
    persona_id INTEGER NOT NULL,
    persona_nombre VARCHAR(255) NOT NULL,
    guaranies BIGINT DEFAULT 0,
    dolares DECIMAL(12, 2) DEFAULT 0,
    reales DECIMAL(12, 2) DEFAULT 0,
    motivo TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    anulado BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_persona FOREIGN KEY (persona_id) REFERENCES persona(id),
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Tabla para mantener el saldo actual de cada persona
CREATE TABLE IF NOT EXISTS saldo_persona (
    persona_id INTEGER PRIMARY KEY,
    guaranies BIGINT DEFAULT 0,
    dolares DECIMAL(12, 2) DEFAULT 0,
    reales DECIMAL(12, 2) DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_persona FOREIGN KEY (persona_id) REFERENCES persona(id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_uso_devolucion_persona_id ON uso_devolucion(persona_id);
CREATE INDEX IF NOT EXISTS idx_uso_devolucion_fecha ON uso_devolucion(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_uso_devolucion_tipo ON uso_devolucion(tipo);

-- Función para actualizar el saldo después de una operación de uso o devolución
CREATE OR REPLACE FUNCTION actualizar_saldo_persona()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es una operación de uso (prestamos dinero)
    IF NEW.tipo = 'USO' THEN
        -- Intentar actualizar el saldo existente
        UPDATE saldo_persona
        SET 
            guaranies = guaranies + NEW.guaranies,
            dolares = dolares + NEW.dolares,
            reales = reales + NEW.reales,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE persona_id = NEW.persona_id;
        
        -- Si no existe, crear un nuevo registro de saldo
        IF NOT FOUND THEN
            INSERT INTO saldo_persona (persona_id, guaranies, dolares, reales)
            VALUES (NEW.persona_id, NEW.guaranies, NEW.dolares, NEW.reales);
        END IF;
    
    -- Si es una operación de devolución (nos devuelven dinero)
    ELSIF NEW.tipo = 'DEVOLUCION' THEN
        -- Intentar actualizar el saldo existente
        UPDATE saldo_persona
        SET 
            guaranies = guaranies - NEW.guaranies,
            dolares = dolares - NEW.dolares,
            reales = reales - NEW.reales,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE persona_id = NEW.persona_id;
        
        -- Si no existe, crear un nuevo registro de saldo con valores negativos
        IF NOT FOUND THEN
            INSERT INTO saldo_persona (persona_id, guaranies, dolares, reales)
            VALUES (NEW.persona_id, -NEW.guaranies, -NEW.dolares, -NEW.reales);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el saldo después de insertar una operación
CREATE TRIGGER trigger_actualizar_saldo_persona
AFTER INSERT ON uso_devolucion
FOR EACH ROW
EXECUTE FUNCTION actualizar_saldo_persona();

-- Función para anular una operación de uso o devolución
CREATE OR REPLACE FUNCTION anular_uso_devolucion(p_id INTEGER, p_usuario_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_tipo VARCHAR(20);
    v_persona_id INTEGER;
    v_guaranies BIGINT;
    v_dolares DECIMAL(12, 2);
    v_reales DECIMAL(12, 2);
BEGIN
    -- Obtener los datos de la operación a anular
    SELECT tipo, persona_id, guaranies, dolares, reales
    INTO v_tipo, v_persona_id, v_guaranies, v_dolares, v_reales
    FROM uso_devolucion
    WHERE id = p_id AND anulado = FALSE;
    
    -- Si no se encuentra la operación o ya está anulada
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Marcar la operación como anulada
    UPDATE uso_devolucion
    SET anulado = TRUE
    WHERE id = p_id;
    
    -- Revertir el efecto en el saldo según el tipo de operación
    IF v_tipo = 'USO' THEN
        UPDATE saldo_persona
        SET 
            guaranies = guaranies - v_guaranies,
            dolares = dolares - v_dolares,
            reales = reales - v_reales,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE persona_id = v_persona_id;
    ELSIF v_tipo = 'DEVOLUCION' THEN
        UPDATE saldo_persona
        SET 
            guaranies = guaranies + v_guaranies,
            dolares = dolares + v_dolares,
            reales = reales + v_reales,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE persona_id = v_persona_id;
    END IF;
    
    -- Registrar la anulación en el historial si es necesario
    INSERT INTO historial_anulaciones (
        tabla, 
        registro_id, 
        usuario_id,
        fecha
    ) VALUES (
        'uso_devolucion',
        p_id,
        p_usuario_id,
        CURRENT_TIMESTAMP
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 