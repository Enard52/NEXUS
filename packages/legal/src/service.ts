export class LegalService {
  getTermsOfService(locale: string = "en"): string {
    if (locale === "tr") return "Kullanım Şartları: Bu bir mock metindir.";
    return "Terms of Service: This is a mock text.";
  }

  getPrivacyPolicy(locale: string = "en"): string {
    if (locale === "tr") return "Gizlilik Politikası: Bu bir mock metindir.";
    return "Privacy Policy: This is a mock text.";
  }
}
