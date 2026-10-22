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
  client_company VARCHAR(255) NOT NULL,
  client_contact VARCHAR(255),
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  client_city VARCHAR(100),
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

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut VARCHAR(20) UNIQUE NOT NULL,
  company VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migrations for existing databases
DO $$
BEGIN
  -- clients: rename name -> contact
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='name')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='contact') THEN
    ALTER TABLE clients RENAME COLUMN name TO contact;
    ALTER TABLE clients ALTER COLUMN contact DROP NOT NULL;
  END IF;
  -- clients: make company NOT NULL (fill nulls first)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='company') THEN
    UPDATE clients SET company = contact WHERE company IS NULL AND contact IS NOT NULL;
    UPDATE clients SET company = rut WHERE company IS NULL;
  END IF;
  -- clients: add city
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='city') THEN
    ALTER TABLE clients ADD COLUMN city VARCHAR(100);
  END IF;
  -- quotes: rename client_name -> client_contact
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='client_name')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='client_contact') THEN
    ALTER TABLE quotes RENAME COLUMN client_name TO client_contact;
    ALTER TABLE quotes ALTER COLUMN client_contact DROP NOT NULL;
    -- fill client_company from client_contact where empty
    UPDATE quotes SET client_company = client_contact WHERE client_company IS NULL AND client_contact IS NOT NULL;
  END IF;
  -- quotes: add client_city
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='client_city') THEN
    ALTER TABLE quotes ADD COLUMN client_city VARCHAR(100);
  END IF;
  -- services: add billing_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='billing_type') THEN
    ALTER TABLE services ADD COLUMN billing_type VARCHAR(20) DEFAULT 'unico';
  END IF;
  -- quote_items: add billing_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_items' AND column_name='billing_type') THEN
    ALTER TABLE quote_items ADD COLUMN billing_type VARCHAR(20) DEFAULT 'unico';
  END IF;
END $$;
