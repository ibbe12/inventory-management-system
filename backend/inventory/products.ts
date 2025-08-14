import { api, APIError } from "encore.dev/api";
import { inventoryDB } from "./db";
import type { Product, ProductWithInventory } from "./types";

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  category?: string;
  unitOfMeasure: string;
  unitPrice: number;
  reorderLevel: number;
  maxStockLevel?: number;
}

export interface UpdateProductRequest {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category?: string;
  unitOfMeasure: string;
  unitPrice: number;
  reorderLevel: number;
  maxStockLevel?: number;
}

export interface ListProductsResponse {
  products: ProductWithInventory[];
}

// Creates a new product.
export const createProduct = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/products" },
  async (req) => {
    try {
      const product = await inventoryDB.queryRow<Product>`
        INSERT INTO products (name, description, sku, category, unit_of_measure, unit_price, reorder_level, max_stock_level)
        VALUES (${req.name}, ${req.description}, ${req.sku}, ${req.category}, ${req.unitOfMeasure}, ${req.unitPrice}, ${req.reorderLevel}, ${req.maxStockLevel})
        RETURNING id, name, description, sku, category, unit_of_measure as "unitOfMeasure", unit_price as "unitPrice", 
                  reorder_level as "reorderLevel", max_stock_level as "maxStockLevel", created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      if (!product) {
        throw APIError.internal("Failed to create product");
      }

      // Create initial inventory record
      await inventoryDB.exec`
        INSERT INTO inventory (product_id, quantity_on_hand, quantity_reserved)
        VALUES (${product.id}, 0, 0)
      `;

      return product;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw APIError.alreadyExists("Product with this SKU already exists");
      }
      throw APIError.internal("Failed to create product", error);
    }
  }
);

// Retrieves all products with their inventory information.
export const listProducts = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products" },
  async () => {
    const products = await inventoryDB.queryAll<ProductWithInventory>`
      SELECT p.id, p.name, p.description, p.sku, p.category, 
             p.unit_of_measure as "unitOfMeasure", p.unit_price as "unitPrice",
             p.reorder_level as "reorderLevel", p.max_stock_level as "maxStockLevel",
             p.created_at as "createdAt", p.updated_at as "updatedAt",
             i.id as "inventory.id", i.quantity_on_hand as "inventory.quantityOnHand",
             i.quantity_reserved as "inventory.quantityReserved", 
             i.quantity_available as "inventory.quantityAvailable",
             i.last_updated as "inventory.lastUpdated"
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.name
    `;

    // Transform flat result to nested structure
    const transformedProducts = products.map(row => {
      const product: ProductWithInventory = {
        id: row.id,
        name: row.name,
        description: row.description,
        sku: row.sku,
        category: row.category,
        unitOfMeasure: row.unitOfMeasure,
        unitPrice: row.unitPrice,
        reorderLevel: row.reorderLevel,
        maxStockLevel: row.maxStockLevel,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };

      if (row['inventory.id']) {
        product.inventory = {
          id: row['inventory.id'],
          productId: row.id,
          quantityOnHand: row['inventory.quantityOnHand'],
          quantityReserved: row['inventory.quantityReserved'],
          quantityAvailable: row['inventory.quantityAvailable'],
          lastUpdated: row['inventory.lastUpdated']
        };
      }

      return product;
    });

    return { products: transformedProducts };
  }
);

// Retrieves a single product by ID.
export const getProduct = api<{ id: number }, Product>(
  { expose: true, method: "GET", path: "/products/:id" },
  async ({ id }) => {
    const product = await inventoryDB.queryRow<Product>`
      SELECT id, name, description, sku, category, unit_of_measure as "unitOfMeasure", 
             unit_price as "unitPrice", reorder_level as "reorderLevel", 
             max_stock_level as "maxStockLevel", created_at as "createdAt", updated_at as "updatedAt"
      FROM products 
      WHERE id = ${id}
    `;

    if (!product) {
      throw APIError.notFound("Product not found");
    }

    return product;
  }
);

// Updates an existing product.
export const updateProduct = api<UpdateProductRequest, Product>(
  { expose: true, method: "PUT", path: "/products/:id" },
  async (req) => {
    try {
      const product = await inventoryDB.queryRow<Product>`
        UPDATE products 
        SET name = ${req.name}, description = ${req.description}, sku = ${req.sku}, 
            category = ${req.category}, unit_of_measure = ${req.unitOfMeasure}, 
            unit_price = ${req.unitPrice}, reorder_level = ${req.reorderLevel}, 
            max_stock_level = ${req.maxStockLevel}, updated_at = NOW()
        WHERE id = ${req.id}
        RETURNING id, name, description, sku, category, unit_of_measure as "unitOfMeasure", 
                  unit_price as "unitPrice", reorder_level as "reorderLevel", 
                  max_stock_level as "maxStockLevel", created_at as "createdAt", updated_at as "updatedAt"
      `;

      if (!product) {
        throw APIError.notFound("Product not found");
      }

      return product;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw APIError.alreadyExists("Product with this SKU already exists");
      }
      throw APIError.internal("Failed to update product", error);
    }
  }
);

// Deletes a product.
export const deleteProduct = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/products/:id" },
  async ({ id }) => {
    const result = await inventoryDB.queryRow`
      DELETE FROM products WHERE id = ${id} RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("Product not found");
    }
  }
);
