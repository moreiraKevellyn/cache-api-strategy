import { db } from '../database';

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  category_id: number;
}

export interface ProductWithCategory extends Product {
  category_name: string;
}

export class ProductModel {
  static async findAll(limit: number = 50, offset: number = 0): Promise<Product[]> {
    const query = `
      SELECT id, name, price, description, stock, category_id 
      FROM products 
      ORDER BY id 
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  static async findById(id: number): Promise<ProductWithCategory | null> {
    const query = `
      SELECT 
        p.id, p.name, p.price, p.description, p.stock, p.category_id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByCategory(categoryId: number, limit: number = 50): Promise<ProductWithCategory[]> {
    const query = `
      SELECT 
        p.id, p.name, p.price, p.description, p.stock, p.category_id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1
      ORDER BY p.price DESC
      LIMIT $2
    `;
    const result = await db.query(query, [categoryId, limit]);
    return result.rows;
  }

  static async findTopExpensive(limit: number = 20): Promise<ProductWithCategory[]> {
    const query = `
      SELECT 
        p.id, p.name, p.price, p.description, p.stock, p.category_id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.price DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }

  static async count(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) as total FROM products');
    return parseInt(result.rows[0].total);
  }

  static async findByPriceRange(min: number, max: number): Promise<Product[]> {
    const query = `
      SELECT id, name, price, description, stock, category_id
      FROM products
      WHERE price BETWEEN $1 AND $2
      ORDER BY price
      LIMIT 100
    `;
    const result = await db.query(query, [min, max]);
    return result.rows;
  }
}