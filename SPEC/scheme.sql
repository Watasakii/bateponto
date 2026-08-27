-- Habilitar a extensão PostGIS para cálculos geoespaciais (opcional, mas recomendado para geofencing avançado)
-- create extension if not exists postgis;

-- Tabela de Usuários (Funcionários e Administradores)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Para o MVP usaremos hash simples ou texto puro, mas ideal é Supabase Auth
    role VARCHAR(50) CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
    face_descriptor TEXT, -- Armazena os dados biométricos faciais mapeados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir o usuário Admin provisório
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Administrador', 'admin', 'admin', 'admin');

-- Tabela de Configurações da Empresa (Geofencing)
CREATE TABLE company_settings (
    id SERIAL PRIMARY KEY,
    company_lat DECIMAL(10, 8) NOT NULL,
    company_lng DECIMAL(11, 8) NOT NULL,
    allowed_radius_meters INTEGER DEFAULT 100
);

-- Inserir configuração padrão (Exemplo: Coordenadas fictícias)
INSERT INTO company_settings (company_lat, company_lng, allowed_radius_meters)
VALUES (-22.9519, -46.5419, 100); -- Coordenadas genéricas, ajustar conforme necessidade

-- Tabela de Registros de Ponto
CREATE TABLE time_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    clock_in_lat DECIMAL(10, 8),
    clock_in_lng DECIMAL(11, 8),
    clock_out_lat DECIMAL(10, 8),
    clock_out_lng DECIMAL(11, 8),
    clock_in_photo_url TEXT,
    clock_out_photo_url TEXT,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Justificativas / Atestados
CREATE TABLE justifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    time_record_id UUID REFERENCES time_records(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);