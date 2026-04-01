import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "../middlewares/error-handler.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    contactMessage: {
      create: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import contactRoutes from "./contact.routes.js";

const mockContactMessage = {
  id: "msg-1",
  name: "João Silva",
  email: "joao@example.com",
  message: "Gostaria de mais informações.",
  createdAt: new Date(),
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/contact", contactRoutes);
  app.use(errorHandler);
  return app;
}

describe("Contact Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /api/contact", () => {
    it("returns 201 with valid data", async () => {
      vi.mocked(prisma.contactMessage.create).mockResolvedValue(mockContactMessage);

      const app = createApp();
      const res = await request(app).post("/api/contact").send({
        name: "João Silva",
        email: "joao@example.com",
        message: "Gostaria de mais informações.",
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("João Silva");
      expect(res.body.email).toBe("joao@example.com");
      expect(res.body.message).toBe("Gostaria de mais informações.");
    });

    it("does not require authentication", async () => {
      vi.mocked(prisma.contactMessage.create).mockResolvedValue(mockContactMessage);

      const app = createApp();
      const res = await request(app).post("/api/contact").send({
        name: "Test",
        email: "test@example.com",
        message: "Hello",
      });

      // Should succeed without any auth header
      expect(res.status).toBe(201);
    });

    it("returns 400 when name is missing", async () => {
      const app = createApp();
      const res = await request(app).post("/api/contact").send({
        email: "joao@example.com",
        message: "Gostaria de mais informações.",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details).toHaveProperty("name");
    });

    it("returns 400 when email is missing", async () => {
      const app = createApp();
      const res = await request(app).post("/api/contact").send({
        name: "João Silva",
        message: "Gostaria de mais informações.",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details).toHaveProperty("email");
    });

    it("returns 400 when email is invalid", async () => {
      const app = createApp();
      const res = await request(app).post("/api/contact").send({
        name: "João Silva",
        email: "not-an-email",
        message: "Gostaria de mais informações.",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details).toHaveProperty("email");
    });

    it("returns 400 when message is missing", async () => {
      const app = createApp();
      const res = await request(app).post("/api/contact").send({
        name: "João Silva",
        email: "joao@example.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details).toHaveProperty("message");
    });

    it("returns 400 when name is empty string", async () => {
      const app = createApp();
      const res = await request(app).post("/api/contact").send({
        name: "",
        email: "joao@example.com",
        message: "Hello",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details).toHaveProperty("name");
    });

    it("returns 400 when message is empty string", async () => {
      const app = createApp();
      const res = await request(app).post("/api/contact").send({
        name: "João",
        email: "joao@example.com",
        message: "",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details).toHaveProperty("message");
    });

    it("returns 400 when body is empty", async () => {
      const app = createApp();
      const res = await request(app).post("/api/contact").send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
