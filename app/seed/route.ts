import bcrypt from "bcrypt";
import pool from "./../lib/mysql";
import { invoices, customers, revenues, users } from "../lib/placeholder-data";
import { NextResponse } from 'next/server'; // Import NextResponse


async function seedUsers() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      );
    `);

    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return connection.query(
          `
          INSERT INTO users (name, email, password)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id;  -- No-op to avoid error on duplicate
        `,
          [user.name, user.email, hashedPassword]
        );
      })
    );

    return insertedUsers;
  } finally {
    connection.release();
  }
}

async function seedInvoices() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `);

    const insertedInvoices = await Promise.all(
      invoices.map((invoice) =>
        connection.query(
          `
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id;  -- No-op to avoid error on duplicate
        `,
          [invoice.customer_id, invoice.amount, invoice.status, invoice.date]
        )
      )
    );

    return insertedInvoices;
  } finally {
    connection.release();
  }
}

async function seedCustomers() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `);

    const insertedCustomers = await Promise.all(
      customers.map((customer) =>
        connection.query(
          `
          INSERT INTO customers (name, email, image_url)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id;  -- No-op to avoid error on duplicate
        `,
          [customer.name, customer.email, customer.image_url]
        )
      )
    );

    return insertedCustomers;
  } finally {
    connection.release();
  }
}

async function seedRevenue() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS revenues (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `);

    const insertedRevenue = await Promise.all(
      revenues.map((rev) =>
        connection.query(
          `
          INSERT INTO revenues (month, revenue)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE revenue=revenue;  -- No-op to avoid error on duplicate
        `,
          [rev.month, rev.revenue]
        )
      )
    );

    return insertedRevenue;
  } finally {
    connection.release();
  }
}

export async function GET() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`START TRANSACTION`);
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    await connection.query(`COMMIT`);

    return NextResponse.json({ message: "Database seeded successfully" }); // Return a JSON response
  } catch (error) {
    await connection.query(`ROLLBACK`);
    return NextResponse.json({ error: error.message }, { status: 500 }); // Return a JSON response with error
  } finally {
    connection.release();
  }
}
