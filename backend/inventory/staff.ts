import { api, APIError } from "encore.dev/api";
import { inventoryDB } from "./db";
import type { Staff } from "./types";

export interface CreateStaffRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
}

export interface UpdateStaffRequest {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
}

export interface ListStaffResponse {
  staff: Staff[];
}

// Creates a new staff member.
export const createStaff = api<CreateStaffRequest, Staff>(
  { expose: true, method: "POST", path: "/staff" },
  async (req) => {
    try {
      const staff = await inventoryDB.queryRow<Staff>`
        INSERT INTO staff (employee_id, first_name, last_name, email, phone, department, position, hire_date, status)
        VALUES (${req.employeeId}, ${req.firstName}, ${req.lastName}, ${req.email}, ${req.phone}, ${req.department}, ${req.position}, ${req.hireDate}, ${req.status})
        RETURNING id, employee_id as "employeeId", first_name as "firstName", last_name as "lastName", 
                  email, phone, department, position, hire_date as "hireDate", status,
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      if (!staff) {
        throw APIError.internal("Failed to create staff member");
      }

      return staff;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw APIError.alreadyExists("Staff member with this employee ID or email already exists");
      }
      throw APIError.internal("Failed to create staff member", error);
    }
  }
);

// Retrieves all staff members.
export const listStaff = api<void, ListStaffResponse>(
  { expose: true, method: "GET", path: "/staff" },
  async () => {
    const staff = await inventoryDB.queryAll<Staff>`
      SELECT id, employee_id as "employeeId", first_name as "firstName", last_name as "lastName", 
             email, phone, department, position, hire_date as "hireDate", status,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM staff
      ORDER BY first_name, last_name
    `;

    return { staff };
  }
);

// Retrieves active staff members only.
export const listActiveStaff = api<void, ListStaffResponse>(
  { expose: true, method: "GET", path: "/staff/active" },
  async () => {
    const staff = await inventoryDB.queryAll<Staff>`
      SELECT id, employee_id as "employeeId", first_name as "firstName", last_name as "lastName", 
             email, phone, department, position, hire_date as "hireDate", status,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM staff
      WHERE status = 'ACTIVE'
      ORDER BY first_name, last_name
    `;

    return { staff };
  }
);

// Retrieves a single staff member by ID.
export const getStaff = api<{ id: number }, Staff>(
  { expose: true, method: "GET", path: "/staff/:id" },
  async ({ id }) => {
    const staff = await inventoryDB.queryRow<Staff>`
      SELECT id, employee_id as "employeeId", first_name as "firstName", last_name as "lastName", 
             email, phone, department, position, hire_date as "hireDate", status,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM staff 
      WHERE id = ${id}
    `;

    if (!staff) {
      throw APIError.notFound("Staff member not found");
    }

    return staff;
  }
);

// Updates an existing staff member.
export const updateStaff = api<UpdateStaffRequest, Staff>(
  { expose: true, method: "PUT", path: "/staff/:id" },
  async (req) => {
    try {
      const staff = await inventoryDB.queryRow<Staff>`
        UPDATE staff 
        SET employee_id = ${req.employeeId}, first_name = ${req.firstName}, last_name = ${req.lastName}, 
            email = ${req.email}, phone = ${req.phone}, department = ${req.department}, 
            position = ${req.position}, hire_date = ${req.hireDate}, status = ${req.status}, 
            updated_at = NOW()
        WHERE id = ${req.id}
        RETURNING id, employee_id as "employeeId", first_name as "firstName", last_name as "lastName", 
                  email, phone, department, position, hire_date as "hireDate", status,
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      if (!staff) {
        throw APIError.notFound("Staff member not found");
      }

      return staff;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw APIError.alreadyExists("Staff member with this employee ID or email already exists");
      }
      throw APIError.internal("Failed to update staff member", error);
    }
  }
);

// Deletes a staff member.
export const deleteStaff = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/staff/:id" },
  async ({ id }) => {
    const result = await inventoryDB.queryRow`
      DELETE FROM staff WHERE id = ${id} RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("Staff member not found");
    }
  }
);
