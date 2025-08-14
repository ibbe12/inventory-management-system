import { api, APIError } from "encore.dev/api";
import { inventoryDB } from "./db";
import type { InventoryTransaction } from "./types";

export interface CreateTransactionRequest {
  productId: number;
  transactionType: 'RECEIVE' | 'ISSUE' | 'ADJUSTMENT';
  quantity: number;
  referenceNumber?: string;
  notes?: string;
  createdBy?: string;
  staffId?: number;
}

export interface ListTransactionsResponse {
  transactions: InventoryTransaction[];
}

// Creates a new inventory transaction and updates inventory levels.
export const createTransaction = api<CreateTransactionRequest, InventoryTransaction>(
  { expose: true, method: "POST", path: "/transactions" },
  async (req) => {
    const tx = await inventoryDB.begin();
    
    try {
      // Verify product exists
      const product = await tx.queryRow`
        SELECT id FROM products WHERE id = ${req.productId}
      `;
      
      if (!product) {
        throw APIError.notFound("Product not found");
      }

      // Verify staff exists if staffId is provided
      if (req.staffId) {
        const staff = await tx.queryRow`
          SELECT id FROM staff WHERE id = ${req.staffId}
        `;
        
        if (!staff) {
          throw APIError.notFound("Staff member not found");
        }
      }

      // Create transaction record
      const transaction = await tx.queryRow<InventoryTransaction>`
        INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_number, notes, created_by, staff_id)
        VALUES (${req.productId}, ${req.transactionType}, ${req.quantity}, ${req.referenceNumber}, ${req.notes}, ${req.createdBy}, ${req.staffId})
        RETURNING id, product_id as "productId", transaction_type as "transactionType", 
                  quantity, reference_number as "referenceNumber", notes, 
                  created_at as "createdAt", created_by as "createdBy", staff_id as "staffId"
      `;

      if (!transaction) {
        throw APIError.internal("Failed to create transaction");
      }

      // Update inventory based on transaction type
      let quantityChange = 0;
      switch (req.transactionType) {
        case 'RECEIVE':
          quantityChange = req.quantity;
          break;
        case 'ISSUE':
          quantityChange = -req.quantity;
          break;
        case 'ADJUSTMENT':
          quantityChange = req.quantity; // Can be positive or negative
          break;
      }

      // Update inventory levels
      const updatedInventory = await tx.queryRow`
        UPDATE inventory 
        SET quantity_on_hand = quantity_on_hand + ${quantityChange}, last_updated = NOW()
        WHERE product_id = ${req.productId}
        RETURNING quantity_on_hand
      `;

      if (!updatedInventory) {
        throw APIError.internal("Failed to update inventory");
      }

      // Check for negative inventory
      if (updatedInventory.quantity_on_hand < 0) {
        throw APIError.invalidArgument("Transaction would result in negative inventory");
      }

      await tx.commit();
      return transaction;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);

// Retrieves all inventory transactions.
export const listTransactions = api<void, ListTransactionsResponse>(
  { expose: true, method: "GET", path: "/transactions" },
  async () => {
    const transactions = await inventoryDB.queryAll<InventoryTransaction>`
      SELECT id, product_id as "productId", transaction_type as "transactionType", 
             quantity, reference_number as "referenceNumber", notes, 
             created_at as "createdAt", created_by as "createdBy", staff_id as "staffId"
      FROM inventory_transactions
      ORDER BY created_at DESC
    `;

    return { transactions };
  }
);

// Retrieves transactions for a specific product.
export const getProductTransactions = api<{ productId: number }, ListTransactionsResponse>(
  { expose: true, method: "GET", path: "/products/:productId/transactions" },
  async ({ productId }) => {
    const transactions = await inventoryDB.queryAll<InventoryTransaction>`
      SELECT id, product_id as "productId", transaction_type as "transactionType", 
             quantity, reference_number as "referenceNumber", notes, 
             created_at as "createdAt", created_by as "createdBy", staff_id as "staffId"
      FROM inventory_transactions
      WHERE product_id = ${productId}
      ORDER BY created_at DESC
    `;

    return { transactions };
  }
);
