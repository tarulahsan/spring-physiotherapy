-- Add foreign key columns to patients table
ALTER TABLE patients
ADD COLUMN doctor_id UUID REFERENCES doctors(id),
ADD COLUMN referred_by UUID REFERENCES doctors(id);

-- Add indexes for better query performance
CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_patients_referred_by ON patients(referred_by);
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_name ON patients(name);
