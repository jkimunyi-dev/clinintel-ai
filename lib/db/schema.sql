use -- ClinIntelAI Database Schema
-- Run this in your Neon SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Doctors)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'doctor' CHECK (role IN ('doctor', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    medical_record_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files table (CSV, images, etc.)
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'analyzed', 'error')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inferences table (AI analysis results)
CREATE TABLE IF NOT EXISTS inferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    inference_type VARCHAR(100) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    confidence_score DECIMAL(5, 4),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_files_patient_id ON files(patient_id);
CREATE INDEX IF NOT EXISTS idx_files_doctor_id ON files(doctor_id);
CREATE INDEX IF NOT EXISTS idx_inferences_file_id ON inferences(file_id);
CREATE INDEX IF NOT EXISTS idx_inferences_patient_id ON inferences(patient_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inferences_updated_at BEFORE UPDATE ON inferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
