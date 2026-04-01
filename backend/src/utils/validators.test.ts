import { describe, it, expect } from "vitest";
import { isValidCpf, isValidEmail } from "./validators.js";

describe("isValidCpf", () => {
  it("should accept a valid CPF", () => {
    // Known valid CPF: 529.982.247-25
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("should accept a valid CPF with formatting", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("should reject CPF with all same digits", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
    expect(isValidCpf("99999999999")).toBe(false);
  });

  it("should reject CPF with wrong check digits", () => {
    expect(isValidCpf("52998224726")).toBe(false);
  });

  it("should reject CPF with wrong length", () => {
    expect(isValidCpf("1234567890")).toBe(false);
    expect(isValidCpf("123456789012")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidCpf("")).toBe(false);
  });

  it("should reject non-numeric string", () => {
    expect(isValidCpf("abcdefghijk")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("should accept a valid email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("should accept email with subdomain", () => {
    expect(isValidEmail("user@mail.example.com")).toBe(true);
  });

  it("should reject email without @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("should reject email without domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("should reject plain text", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
  });
});
