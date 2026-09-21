-- Sistema Germa 66 - Esquema relacional MySQL (RNF-06: PK/FK y sin duplicados)

-- ===== RF-01 Seguridad y roles =====
CREATE TABLE IF NOT EXISTS roles (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(120) NOT NULL UNIQUE,
  clave_hash VARCHAR(100) NOT NULL,
  rol_id     INT NOT NULL,
  activo     TINYINT(1) NOT NULL DEFAULT 1,
  creado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- Clase AuditoriaSeguridad del diagrama UML
CREATE TABLE IF NOT EXISTS auditoria_seguridad (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT NULL,
  fecha_hora       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accion_realizada VARCHAR(255) NOT NULL,
  direccion_ip     VARCHAR(45) NULL,
  CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ===== RF-02 Inventario tecnológico (Sprint 2) =====
CREATE TABLE IF NOT EXISTS inventario (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  codigo    VARCHAR(40) NOT NULL UNIQUE,
  nombre    VARCHAR(120) NOT NULL,
  categoria ENUM('arma','raid_suit','artefacto') NOT NULL,
  cantidad  INT NOT NULL DEFAULT 0,
  estado    ENUM('disponible','en_mantenimiento','agotado','baja') NOT NULL DEFAULT 'disponible',
  ubicacion VARCHAR(120) NULL,
  CONSTRAINT chk_inv_cantidad CHECK (cantidad >= 0)
) ENGINE=InnoDB;

-- ===== RF-03 Cyborgs (Sprint 2) =====
CREATE TABLE IF NOT EXISTS cyborgs (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  codigo    VARCHAR(40) NOT NULL UNIQUE,
  serie     VARCHAR(60) NOT NULL UNIQUE,
  nombre    VARCHAR(100) NULL,
  estado    ENUM('activo','en_mantenimiento','baja') NOT NULL DEFAULT 'activo',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cyborg_equipamiento (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cyborg_id   INT NOT NULL,
  item_id     INT NOT NULL,
  cantidad    INT NOT NULL DEFAULT 1,
  asignado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eq_cyborg FOREIGN KEY (cyborg_id) REFERENCES cyborgs(id) ON DELETE CASCADE,
  CONSTRAINT fk_eq_item   FOREIGN KEY (item_id)   REFERENCES inventario(id),
  CONSTRAINT chk_eq_cant CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- ===== RF-04 Reinos clientes (Sprint 3) =====
CREATE TABLE IF NOT EXISTS reinos_clientes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL UNIQUE,
  contacto      VARCHAR(120) NULL,
  ubicacion     VARCHAR(120) NULL,
  estado_cuenta ENUM('al_dia','en_mora','suspendida') NOT NULL DEFAULT 'al_dia'
) ENGINE=InnoDB;

-- ===== RF-05 Pedidos (Sprint 3) =====
CREATE TABLE IF NOT EXISTS pedidos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  usuario_id INT NOT NULL,
  estado     ENUM('pendiente','confirmado','en_preparacion','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  fecha      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ped_cliente FOREIGN KEY (cliente_id) REFERENCES reinos_clientes(id),
  CONSTRAINT fk_ped_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido_items (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  item_id   INT NOT NULL,
  cantidad  INT NOT NULL,
  CONSTRAINT fk_pi_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_pi_item   FOREIGN KEY (item_id)   REFERENCES inventario(id),
  CONSTRAINT chk_pi_cant CHECK (cantidad > 0)
) ENGINE=InnoDB;
