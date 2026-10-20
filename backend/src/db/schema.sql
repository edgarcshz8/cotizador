CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price DECIMAL(12,2) NOT NULL,
  unit_label VARCHAR(50) DEFAULT 'unidad',
  category VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(30) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_company VARCHAR(255),
  client_phone VARCHAR(50),
  subtotal DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pendiente',
  currency VARCHAR(10) DEFAULT 'CLP',
  valid_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  service_id UUID,
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name VARCHAR(255) DEFAULT 'Mi Empresa',
  rut VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'CLP',
  tax_percent DECIMAL(5,2) DEFAULT 0,
  quote_valid_days INTEGER DEFAULT 30,
  footer_text TEXT DEFAULT 'Gracias por su preferencia. Esta cotización es válida por el período indicado.'
);

INSERT INTO company_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

INSERT INTO services (name, description, unit_price, unit_label, category) VALUES
  ('Tarjeta NFC', 'Tarjeta NFC personalizada con diseño e información del negocio, compatibilidad universal con smartphones', 15000, 'tarjeta', 'NFC'),
  ('Menú NFC + QR', 'Menú digital interactivo accesible mediante tarjeta NFC y código QR, con actualizaciones sin costo adicional', 45000, 'proyecto', 'NFC'),
  ('Tarjeta de Fidelizar Wallet', 'Tarjeta de fidelización digital compatible con Apple Wallet y Google Wallet, con sistema de puntos', 35000, 'tarjeta', 'Wallet'),
  ('Página Web Básica', 'Página web informativa con diseño responsive, hasta 5 secciones y formulario de contacto', 250000, 'proyecto', 'Web'),
  ('Página Web Avanzada', 'Página web con funcionalidades avanzadas, SEO optimizado, blog y panel de administración', 450000, 'proyecto', 'Web'),
  ('Desarrollo de Software a Medida', 'Desarrollo de aplicación o sistema personalizado según requerimientos específicos del cliente', 90000, 'hora', 'Software')
ON CONFLICT DO NOTHING;
