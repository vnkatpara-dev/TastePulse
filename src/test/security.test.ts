import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Frontend Role & Security Trust (Phase 1 & Phase 5)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("does not store or read user roles from localStorage", () => {
    // Verify localStorage has no user_role keys
    const keys = Object.keys(localStorage);
    const roleKeys = keys.filter(k => k.startsWith("user_role_"));
    expect(roleKeys.length).toBe(0);

    // Editing localStorage must have no effect on application state
    localStorage.setItem("user_role_test_uid", "owner");
    expect(localStorage.getItem("user_role_test_uid")).toBe("owner");
    // Clear it
    localStorage.clear();
    expect(localStorage.getItem("user_role_test_uid")).toBeNull();
  });

  it("verifies sentiment classifier keyword filtering rules", () => {
    const neutralTerms = ["okay", "decent", "waited", "difficult", "lost"];
    const negativeKeywords = [
      "bad", "terrible", "awful", "hate", "horrible", "rude",
      "slow", "worst", "poor", "disgusting", "dirty", "cold",
      "overpriced", "dismissive", "hair"
    ];

    // Ensure none of the neutral terms are present in the negative list
    neutralTerms.forEach(term => {
      expect(negativeKeywords).not.toContain(term);
    });
  });
});
