-- Requiere esquema en revisión Alembic 015. Respaldar y verificar antes de ejecutar.
CREATE TABLE habitaciones_reserva (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reserva_id INT NOT NULL,
    identificacion VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    capacidad INT NOT NULL,
    observaciones TEXT NULL,
    INDEX ix_habitaciones_reserva_reserva_id (reserva_id),
    CONSTRAINT fk_habitaciones_reserva_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
) ENGINE=InnoDB;
ALTER TABLE pasajeros
    ADD COLUMN habitacion_id INT NULL,
    ADD INDEX ix_pasajeros_habitacion_id (habitacion_id),
    ADD CONSTRAINT fk_pasajeros_habitacion_id FOREIGN KEY (habitacion_id) REFERENCES habitaciones_reserva(id) ON DELETE SET NULL;
-- Después de verificar que ambas sentencias finalizaron correctamente, ejecutar
-- desde el entorno de la aplicación: alembic stamp 016
-- No ejecutar stamp si la estructura no coincide o si alguna sentencia falló.
