import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../prisma/client.js", () => ({
  default: {
    contactMessage: {
      create: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import { create } from "./contact.service.js";

const mockContactMessage = {
  id: "msg-1",
  name: "João Silva",
  email: "joao@example.com",
  message: "Gostaria de mais informações.",
  createdAt: new Date(),
};

describe("ContactService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("create", () => {
    it("creates a contact message successfully", async () => {
      vi.mocked(prisma.contactMessage.create).mockResolvedValue(mockContactMessage);

      const result = await create({
        name: "João Silva",
        email: "joao@example.com",
        message: "Gostaria de mais informações.",
      });

      expect(prisma.contactMessage.create).toHaveBeenCalledWith({
        data: {
          name: "João Silva",
          email: "joao@example.com",
          message: "Gostaria de mais informações.",
        },
      });
      expect(result.id).toBe("msg-1");
      expect(result.name).toBe("João Silva");
      expect(result.email).toBe("joao@example.com");
      expect(result.message).toBe("Gostaria de mais informações.");
    });

    it("propagates database errors", async () => {
      vi.mocked(prisma.contactMessage.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        create({
          name: "Test",
          email: "test@example.com",
          message: "Test message",
        })
      ).rejects.toThrow("Database connection failed");
    });
  });
});
