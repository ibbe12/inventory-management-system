-- Staff table
CREATE TABLE staff (
  id BIGSERIAL PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  hire_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add staff_id to inventory_transactions table
ALTER TABLE inventory_transactions ADD COLUMN staff_id BIGINT REFERENCES staff(id);

-- Create indexes for better performance
CREATE INDEX idx_staff_employee_id ON staff(employee_id);
CREATE INDEX idx_staff_department ON staff(department);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_inventory_transactions_staff_id ON inventory_transactions(staff_id);
