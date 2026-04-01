import prisma from "../prisma/client.js";
import type { ContactFormInput } from "../utils/schemas.js";
import type { ContactMessage } from "../generated/prisma/client.js";

export async function create(data: ContactFormInput): Promise<ContactMessage> {
  return prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      message: data.message,
    },
  });
}
