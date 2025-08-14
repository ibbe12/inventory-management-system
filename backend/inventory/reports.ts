import { api } from "encore.dev/api";
import { inventoryDB } from "./db";
import type { InventoryReport, AssetReport } from "./types";

// Generates an inventory report with key metrics.
export const getInventoryReport = api<void, InventoryReport>(
  { expose: true, method: "GET", path: "/reports/inventory" },
  async () => {
    // Get total products count
    const totalProductsResult = await inventoryDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM products
    `;
    const totalProducts = totalProductsResult?.count || 0;

    // Get total inventory value
    const totalValueResult = await inventoryDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(p.unit_price * i.quantity_on_hand), 0) as total
      FROM products p
      JOIN inventory i ON p.id = i.product_id
    `;
    const totalValue = totalValueResult?.total || 0;

    // Get low stock items count
    const lowStockResult = await inventoryDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE i.quantity_on_hand <= p.reorder_level AND i.quantity_on_hand > 0
    `;
    const lowStockItems = lowStockResult?.count || 0;

    // Get out of stock items count
    const outOfStockResult = await inventoryDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM inventory
      WHERE quantity_on_hand = 0
    `;
    const outOfStockItems = outOfStockResult?.count || 0;

    // Get categories breakdown
    const categories = await inventoryDB.queryAll<{ category: string; count: number; value: number }>`
      SELECT 
        COALESCE(p.category, 'Uncategorized') as category,
        COUNT(*) as count,
        COALESCE(SUM(p.unit_price * i.quantity_on_hand), 0) as value
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      GROUP BY p.category
      ORDER BY value DESC
    `;

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categories
    };
  }
);

// Generates an asset report with key metrics.
export const getAssetReport = api<void, AssetReport>(
  { expose: true, method: "GET", path: "/reports/assets" },
  async () => {
    // Get total assets count
    const totalAssetsResult = await inventoryDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM assets
    `;
    const totalAssets = totalAssetsResult?.count || 0;

    // Get total asset value
    const totalValueResult = await inventoryDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(current_value), 0) as total FROM assets
    `;
    const totalValue = totalValueResult?.total || 0;

    // Get active assets count
    const activeAssetsResult = await inventoryDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM assets WHERE status = 'ACTIVE'
    `;
    const activeAssets = activeAssetsResult?.count || 0;

    // Get maintenance assets count
    const maintenanceAssetsResult = await inventoryDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM assets WHERE status = 'MAINTENANCE'
    `;
    const maintenanceAssets = maintenanceAssetsResult?.count || 0;

    // Get categories breakdown
    const categories = await inventoryDB.queryAll<{ category: string; count: number; value: number }>`
      SELECT 
        COALESCE(category, 'Uncategorized') as category,
        COUNT(*) as count,
        COALESCE(SUM(current_value), 0) as value
      FROM assets
      GROUP BY category
      ORDER BY value DESC
    `;

    return {
      totalAssets,
      totalValue,
      activeAssets,
      maintenanceAssets,
      categories
    };
  }
);

// Generates a low stock report.
export const getLowStockReport = api<void, { products: any[] }>(
  { expose: true, method: "GET", path: "/reports/low-stock" },
  async () => {
    const products = await inventoryDB.queryAll`
      SELECT 
        p.id, p.name, p.sku, p.category,
        i.quantity_on_hand as "quantityOnHand",
        p.reorder_level as "reorderLevel",
        p.unit_price as "unitPrice"
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE i.quantity_on_hand <= p.reorder_level
      ORDER BY (i.quantity_on_hand::float / NULLIF(p.reorder_level, 0)) ASC
    `;

    return { products };
  }
);

// Generates a transaction history report.
export const getTransactionReport = api<{ startDate?: string; endDate?: string }, { transactions: any[] }>(
  { expose: true, method: "GET", path: "/reports/transactions" },
  async ({ startDate, endDate }) => {
    let query = `
      SELECT 
        t.id, t.transaction_type as "transactionType", t.quantity, 
        t.reference_number as "referenceNumber", t.notes, 
        t.created_at as "createdAt", t.created_by as "createdBy",
        p.name as "productName", p.sku as "productSku"
      FROM inventory_transactions t
      JOIN products p ON t.product_id = p.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (startDate) {
      conditions.push(`t.created_at >= $${params.length + 1}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`t.created_at <= $${params.length + 1}`);
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY t.created_at DESC`;

    const transactions = await inventoryDB.rawQueryAll(query, ...params);

    return { transactions };
  }
);

// Generates an asset maintenance report.
export const getMaintenanceReport = api<void, { maintenance: any[] }>(
  { expose: true, method: "GET", path: "/reports/maintenance" },
  async () => {
    const maintenance = await inventoryDB.queryAll`
      SELECT 
        m.id, m.maintenance_type as "maintenanceType", m.description, 
        m.cost, m.performed_date as "performedDate", 
        m.performed_by as "performedBy", m.next_due_date as "nextDueDate",
        a.name as "assetName", a.asset_tag as "assetTag"
      FROM asset_maintenance m
      JOIN assets a ON m.asset_id = a.id
      ORDER BY m.performed_date DESC
    `;

    return { maintenance };
  }
);
