"use server";

import { z } from "zod";
import pool from "./mysql";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  const [insertResult] = await pool.query(
    `
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (?, ?, ?, ?)`,
    [`${customerId}`, `${amountInCents}`, `${status}`, `${date}`]
  );

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  const [updatedResult] = await pool.query(
    `
      UPDATE invoices
      SET 
        customer_id = ?, 
        amount = ?, 
        status = ?
      WHERE id = ?
    `,
    [`${customerId}`, `${amountInCents}`, `${status}`, `${id}`]
  );

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  const [deletedResult] = await pool.query(`DELETE FROM invoices WHERE id = ?`, [`${id}`]);
  revalidatePath('/dashboard/invoices');
}
