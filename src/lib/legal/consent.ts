export type UserRole = "driver" | "fleet_manager" | "admin" | "super_admin";
export type UserPlan = "free" | "lite" | "pro";

export type LegalConsentState = {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dsgvoAccepted: boolean;
};

export const LEGAL_CONSENT_VERSION = "2026-04-13";

export function createLegalConsentMetadata(consent: LegalConsentState) {
  const acceptedAt = new Date().toISOString();
  return {
    legal_consent_version: LEGAL_CONSENT_VERSION,
    legal_consents_accepted_at: acceptedAt,
    terms_accepted: consent.termsAccepted,
    privacy_accepted: consent.privacyAccepted,
    dsgvo_accepted: consent.dsgvoAccepted,
  };
}

export function hasAcceptedAllLegalConsents(value: LegalConsentState): boolean {
  return value.termsAccepted && value.privacyAccepted && value.dsgvoAccepted;
}
