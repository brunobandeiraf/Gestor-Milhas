import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../index.js";

const JWT_SECRET = "test-secret";

function makeToken(overrides: Record<string, unknown> = {}) {
  return jwt.sign(
    {
      userId: "user-1",
      email: "user@test.com",
      role: "USER",
      registrationStatus: "COMPLETE",
      ...overrides,
    },
    JWT_SECRET
  );
}

// Mock DashboardService
vi.mock("../services/dashboard.service.js", () => ({
  getUserDashboard: vi.fn(),
  getAdminDashboard: vi.fn(),
  getUserMetrics: vi.fn(),
}));

import * as DashboardService from "../services/dashboard.service.js";

describe("Dashboard Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("JWT_SECRET", JWT_SECRET);
  });

  describe("GET /api/dashboard/user", () => {
    const mockDashboard = {
      accounts: [
        { programName: "LATAM Pass", miles: 50000, averagePrice: 40, totalCost: 2000 },
      ],
      totalMiles: 50000,
      totalInvested: 2000,
      totalSaved: 3500,
      upcomingSchedules: [],
    };

    it("returns user dashboard for authenticated user", async () => {
      vi.mocked(DashboardService.getUserDashboard).mockResolvedValue(mockDashboard);

      const res = await request(app)
        .get("/api/dashboard/user")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.totalMiles).toBe(50000);
      expect(res.body.accounts).toHaveLength(1);
      expect(DashboardService.getUserDashboard).toHaveBeenCalledWith("user-1");
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/dashboard/user");

      expect(res.status).toBe(401);
    });

    it("returns 403 for PENDING user", async () => {
      const token = makeToken({ registrationStatus: "PENDING" });

      const res = await request(app)
        .get("/api/dashboard/user")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/dashboard/admin", () => {
    const mockAdminDashboard = {
      managedUsersSavings: 4000,
      globalSavings: 10000,
      users: [],
    };

    it("returns admin dashboard for ADMIN user", async () => {
      vi.mocked(DashboardService.getAdminDashboard).mockResolvedValue(mockAdminDashboard);
      const token = makeToken({ role: "ADMIN", userId: "admin-1" });

      const res = await request(app)
        .get("/api/dashboard/admin")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.managedUsersSavings).toBe(4000);
      expect(res.body.globalSavings).toBe(10000);
      expect(DashboardService.getAdminDashboard).toHaveBeenCalledWith("admin-1");
    });

    it("returns 403 for non-ADMIN user", async () => {
      const token = makeToken({ role: "USER" });

      const res = await request(app)
        .get("/api/dashboard/admin")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/dashboard/admin");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/metrics/user/:id", () => {
    const mockMetrics = {
      accounts: [],
      totalMiles: 0,
      totalInvested: 0,
      totalSaved: 0,
    };

    it("returns user metrics for ADMIN", async () => {
      vi.mocked(DashboardService.getUserMetrics).mockResolvedValue(mockMetrics);
      const token = makeToken({ role: "ADMIN", userId: "admin-1" });

      const res = await request(app)
        .get("/api/dashboard/metrics/user/user-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(DashboardService.getUserMetrics).toHaveBeenCalledWith("user-1");
    });

    it("returns 403 for non-ADMIN user", async () => {
      const token = makeToken({ role: "USER" });

      const res = await request(app)
        .get("/api/dashboard/metrics/user/user-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("returns 401 without token", async () => {
      const res = await request(app)
        .get("/api/dashboard/metrics/user/user-1");

      expect(res.status).toBe(401);
    });
  });
});
