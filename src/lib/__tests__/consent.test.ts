import { describe, it, expect } from "vitest";
import {
  LEGAL_CONSENT_VERSION,
  createLegalConsentMetadata,
  hasAcceptedAllLegalConsents,
  type LegalConsentState,
} from "../legal/consent";

describe("LEGAL_CONSENT_VERSION", () => {
  it("is a non-empty string", () => {
    expect(typeof LEGAL_CONSENT_VERSION).toBe("string");
    expect(LEGAL_CONSENT_VERSION.length).toBeGreaterThan(0);
  });

  it("matches expected value", () => {
    expect(LEGAL_CONSENT_VERSION).toBe("2026-04-13");
  });
});

describe("createLegalConsentMetadata", () => {
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

  it("returns the current consent version", () => {
    const result = createLegalConsentMetadata({
      termsAccepted: true,
      privacyAccepted: true,
      dsgvoAccepted: true,
    });
    expect(result.legal_consent_version).toBe(LEGAL_CONSENT_VERSION);
  });

  it("returns an ISO timestamp for accepted_at", () => {
    const result = createLegalConsentMetadata({
      termsAccepted: true,
      privacyAccepted: true,
      dsgvoAccepted: true,
    });
    expect(result.legal_consents_accepted_at).toMatch(isoPattern);
  });

  it("reflects terms_accepted: true when passed true", () => {
    const result = createLegalConsentMetadata({
      termsAccepted: true,
      privacyAccepted: false,
      dsgvoAccepted: false,
    });
    expect(result.terms_accepted).toBe(true);
    expect(result.privacy_accepted).toBe(false);
    expect(result.dsgvo_accepted).toBe(false);
  });

  it("reflects privacy_accepted: true when passed true", () => {
    const result = createLegalConsentMetadata({
      termsAccepted: false,
      privacyAccepted: true,
      dsgvoAccepted: false,
    });
    expect(result.privacy_accepted).toBe(true);
    expect(result.terms_accepted).toBe(false);
    expect(result.dsgvo_accepted).toBe(false);
  });

  it("reflects dsgvo_accepted: true when passed true", () => {
    const result = createLegalConsentMetadata({
      termsAccepted: false,
      privacyAccepted: false,
      dsgvoAccepted: true,
    });
    expect(result.dsgvo_accepted).toBe(true);
  });

  it("reflects all false when all are false", () => {
    const result = createLegalConsentMetadata({
      termsAccepted: false,
      privacyAccepted: false,
      dsgvoAccepted: false,
    });
    expect(result.terms_accepted).toBe(false);
    expect(result.privacy_accepted).toBe(false);
    expect(result.dsgvo_accepted).toBe(false);
  });

  it("accepted_at is close to now", () => {
    const before = Date.now();
    const result = createLegalConsentMetadata({
      termsAccepted: true,
      privacyAccepted: true,
      dsgvoAccepted: true,
    });
    const after = Date.now();
    const ts = new Date(result.legal_consents_accepted_at).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("hasAcceptedAllLegalConsents", () => {
  it("returns true when all three are accepted", () => {
    const state: LegalConsentState = {
      termsAccepted: true,
      privacyAccepted: true,
      dsgvoAccepted: true,
    };
    expect(hasAcceptedAllLegalConsents(state)).toBe(true);
  });

  it("returns false when terms not accepted", () => {
    expect(
      hasAcceptedAllLegalConsents({
        termsAccepted: false,
        privacyAccepted: true,
        dsgvoAccepted: true,
      }),
    ).toBe(false);
  });

  it("returns false when privacy not accepted", () => {
    expect(
      hasAcceptedAllLegalConsents({
        termsAccepted: true,
        privacyAccepted: false,
        dsgvoAccepted: true,
      }),
    ).toBe(false);
  });

  it("returns false when dsgvo not accepted", () => {
    expect(
      hasAcceptedAllLegalConsents({
        termsAccepted: true,
        privacyAccepted: true,
        dsgvoAccepted: false,
      }),
    ).toBe(false);
  });

  it("returns false when all are false", () => {
    expect(
      hasAcceptedAllLegalConsents({
        termsAccepted: false,
        privacyAccepted: false,
        dsgvoAccepted: false,
      }),
    ).toBe(false);
  });
});
