import prisma from "../prisma/client.js";
import type { ContactFormInput } from "../utils/schemas.js";
import type { ContactMessage } from "../generated/prisma/client.js";
import { sendContactEmail } from "./email.service.js";

export async function create(data: ContactFormInput): Promise<ContactMessage> {
  const message = await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      message: data.message,
    },
  });

  // Send email notification (non-blocking — don't fail the request if email fails)
  sendContactEmail({
    name: data.name,
    email: data.email,
    message: data.message,
  }).catch((err) => {
    console.error("[Contact] Falha ao enviar email de contato:", err);
  });

  return message;
}
