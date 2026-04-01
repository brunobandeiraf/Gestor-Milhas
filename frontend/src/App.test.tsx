import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";

const renderWithProviders = (initialRoute = "/") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("App", () => {
  it("should render the landing page at /", () => {
    renderWithProviders("/");
    expect(screen.getByText("Gerencie suas milhas com inteligência")).toBeDefined();
  });

  it("should render the features page at /funcionalidades", () => {
    renderWithProviders("/funcionalidades");
    expect(screen.getByRole("heading", { level: 1, name: "Funcionalidades" })).toBeDefined();
  });

  it("should render the contact page at /contato", () => {
    renderWithProviders("/contato");
    expect(screen.getByRole("heading", { level: 1, name: "Contato" })).toBeDefined();
  });

  it("should render login button in header on public pages", () => {
    renderWithProviders("/");
    expect(screen.getByText("Entrar")).toBeDefined();
  });

  it("should render navigation links in header", () => {
    renderWithProviders("/");
    expect(screen.getByText("Início")).toBeDefined();
    expect(screen.getByText("Funcionalidades")).toBeDefined();
    expect(screen.getByText("Contato")).toBeDefined();
  });
});
