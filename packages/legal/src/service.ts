/**
 * NEXUS AI — Legal & Compliance Service (FAZ 19)
 *
 * Provides legal documents (ToS, Privacy Policy, Cookie Policy) in multiple
 * languages, GDPR/KVKK-compliant data subject request handling (download/delete),
 * and a consent manager for voice recording, analytics, and cookies.
 *
 * Tied to FAZ 14 (AccountService) for data ownership and FAZ 15 (Patreon) for
 * PCI-DSS compliance (handled by Patreon — NEXUS never touches card data).
 */

// ── Legal Document Types ─────────────────────────────────────────────────────

export type DocumentType = "terms" | "privacy" | "cookies";
export type ConsentCategory = "voice_recording" | "analytics" | "cookies" | "marketing";

export interface LegalDocument {
  readonly type: DocumentType;
  readonly locale: string;
  readonly version: string;
  readonly effectiveDate: string;
  readonly content: string;
}

export interface ConsentRecord {
  readonly userId: string;
  readonly category: ConsentCategory;
  readonly granted: boolean;
  readonly grantedAt: string;
  /** If revoked, when it was revoked. */
  readonly revokedAt?: string;
}

export type DataRequestType = "export" | "delete";
export type DataRequestStatus = "pending" | "processing" | "completed" | "failed";

export interface DataSubjectRequest {
  readonly id: string;
  readonly userId: string;
  readonly type: DataRequestType;
  readonly status: DataRequestStatus;
  readonly createdAt: string;
  readonly completedAt?: string;
  /** Exported data (for export requests). */
  readonly data?: string;
}

// ── Legal Service ─────────────────────────────────────────────────────────────

export class LegalError extends Error {}

export interface LegalServiceOptions {
  readonly now?: () => Date;
}

export class LegalService {
  private readonly documents = new Map<string, LegalDocument>();
  private readonly consents = new Map<string, ConsentRecord[]>();
  private readonly requests: DataSubjectRequest[] = [];
  private readonly now: () => Date;
  private seq = 0;

  constructor(options: LegalServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.seedDocuments();
  }

  // ── Document Access ───────────────────────────────────────────────────────

  getDocument(type: DocumentType, locale = "en"): LegalDocument | undefined {
    return this.documents.get(`${type}:${locale}`) ?? this.documents.get(`${type}:en`);
  }

  getTermsOfService(locale = "en"): string {
    return this.getDocument("terms", locale)?.content ?? "";
  }

  getPrivacyPolicy(locale = "en"): string {
    return this.getDocument("privacy", locale)?.content ?? "";
  }

  getCookiePolicy(locale = "en"): string {
    return this.getDocument("cookies", locale)?.content ?? "";
  }

  // ── Consent Management ────────────────────────────────────────────────────

  /** Record that a user granted consent for a category. */
  grantConsent(userId: string, category: ConsentCategory): ConsentRecord {
    const record: ConsentRecord = {
      userId,
      category,
      granted: true,
      grantedAt: this.now().toISOString(),
    };
    const list = this.consents.get(userId) ?? [];
    // Replace existing consent for same category
    const filtered = list.filter((c) => c.category !== category);
    filtered.push(record);
    this.consents.set(userId, filtered);
    return record;
  }

  /** Revoke a previously granted consent. */
  revokeConsent(userId: string, category: ConsentCategory): ConsentRecord {
    const list = this.consents.get(userId) ?? [];
    const existing = list.find((c) => c.category === category);
    if (!existing) throw new LegalError(`No consent record for ${category}`);
    const revoked: ConsentRecord = {
      ...existing,
      granted: false,
      revokedAt: this.now().toISOString(),
    };
    const filtered = list.filter((c) => c.category !== category);
    filtered.push(revoked);
    this.consents.set(userId, filtered);
    return revoked;
  }

  /** Check if a user has active consent for a category. */
  hasConsent(userId: string, category: ConsentCategory): boolean {
    const list = this.consents.get(userId) ?? [];
    const record = list.find((c) => c.category === category);
    return record?.granted === true;
  }

  /** Get all consent records for a user. */
  getConsents(userId: string): readonly ConsentRecord[] {
    return [...(this.consents.get(userId) ?? [])];
  }

  // ── Data Subject Requests (GDPR Article 15/17, KVKK) ──────────────────────

  /**
   * Request data export — collects all user data into a portable format.
   * The actual data comes from external sources; this manages the request lifecycle.
   */
  requestDataExport(userId: string, userData?: string): DataSubjectRequest {
    const request: DataSubjectRequest = {
      id: `dsr-${++this.seq}`,
      userId,
      type: "export",
      status: userData ? "completed" : "pending",
      createdAt: this.now().toISOString(),
      completedAt: userData ? this.now().toISOString() : undefined,
      data: userData,
    };
    this.requests.push(request);
    return request;
  }

  /**
   * Request data deletion — erases all personal data.
   * Returns completed immediately in dev mode; real impl queues for async processing.
   */
  requestDataDeletion(userId: string): DataSubjectRequest {
    // Clear consents
    this.consents.delete(userId);
    const request: DataSubjectRequest = {
      id: `dsr-${++this.seq}`,
      userId,
      type: "delete",
      status: "completed",
      createdAt: this.now().toISOString(),
      completedAt: this.now().toISOString(),
    };
    this.requests.push(request);
    return request;
  }

  /** Get all data subject requests for a user. */
  getRequests(userId: string): readonly DataSubjectRequest[] {
    return this.requests.filter((r) => r.userId === userId);
  }

  /** Get a specific request by ID. */
  getRequest(id: string): DataSubjectRequest | undefined {
    return this.requests.find((r) => r.id === id);
  }

  // ── Voice Recording Consent ───────────────────────────────────────────────

  /** Whether voice processing is allowed — explicit consent required (GDPR Art 7). */
  canProcessVoice(userId: string): boolean {
    return this.hasConsent(userId, "voice_recording");
  }

  // ── Seed Documents ────────────────────────────────────────────────────────

  private seedDocuments(): void {
    const version = "1.0.0";
    const date = "2026-01-01";

    // English
    this.documents.set("terms:en", {
      type: "terms",
      locale: "en",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI — Terms of Service",
        "",
        "1. Acceptance: By using NEXUS, you agree to these terms.",
        "2. Service: NEXUS provides AI-powered smart home automation.",
        "3. Accounts: You are responsible for your account security.",
        "4. Subscriptions: Paid plans are billed through Patreon.",
        "5. Data: We process data as described in our Privacy Policy.",
        "6. Termination: You may cancel at any time; data deletion available on request.",
        "7. Liability: Service provided as-is; no guarantee of uninterrupted operation.",
        "8. Changes: We may update these terms with 30 days notice.",
      ].join("\n"),
    });

    this.documents.set("privacy:en", {
      type: "privacy",
      locale: "en",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI — Privacy Policy",
        "",
        "1. Data Controller: NEXUS AI.",
        "2. Data Collected: Account info, device states, voice commands (with consent), usage patterns.",
        "3. Legal Basis: Consent (voice), legitimate interest (service operation), contract (account).",
        "4. Storage: Data encrypted at rest; cloud memory synced across your devices only.",
        "5. Third Parties: Patreon (payments); no data sold to advertisers.",
        "6. Retention: Active account data retained; deleted within 30 days of deletion request.",
        "7. Your Rights: Access, rectification, erasure, portability, restriction, objection.",
        "8. Contact: privacy@nexus.ai",
      ].join("\n"),
    });

    this.documents.set("cookies:en", {
      type: "cookies",
      locale: "en",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI — Cookie Policy",
        "",
        "1. Essential Cookies: Required for authentication and session management.",
        "2. Analytics Cookies: Used only with your explicit consent.",
        "3. No Tracking: We do not use third-party advertising cookies.",
        "4. Management: You can revoke cookie consent at any time in Settings.",
      ].join("\n"),
    });

    // Turkish
    this.documents.set("terms:tr", {
      type: "terms",
      locale: "tr",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI — Kullanım Şartları",
        "",
        "1. Kabul: NEXUS'u kullanarak bu şartları kabul etmiş olursunuz.",
        "2. Hizmet: NEXUS, yapay zekâ destekli akıllı ev otomasyonu sunar.",
        "3. Hesaplar: Hesap güvenliğinizden siz sorumlusunuz.",
        "4. Abonelikler: Ücretli planlar Patreon üzerinden faturalandırılır.",
        "5. Veri: Verileriniz Gizlilik Politikamızda açıklandığı şekilde işlenir.",
        "6. Fesih: İstediğiniz zaman iptal edebilirsiniz; veri silme talebi oluşturabilirsiniz.",
        "7. Sorumluluk: Hizmet olduğu gibi sunulur; kesintisiz çalışma garantisi yoktur.",
        "8. Değişiklikler: Bu şartları 30 gün önceden bildirerek güncelleyebiliriz.",
      ].join("\n"),
    });

    this.documents.set("privacy:tr", {
      type: "privacy",
      locale: "tr",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI — Gizlilik Politikası",
        "",
        "1. Veri Sorumlusu: NEXUS AI.",
        "2. Toplanan Veriler: Hesap bilgileri, cihaz durumları, sesli komutlar (onay ile), kullanım kalıpları.",
        "3. Hukuki Dayanak: Rıza (ses), meşru menfaat (hizmet), sözleşme (hesap).",
        "4. Depolama: Veriler şifreli saklanır; bulut hafıza yalnızca kendi cihazlarınız arasında senkronlanır.",
        "5. Üçüncü Taraflar: Patreon (ödemeler); reklam verenlerine veri satılmaz.",
        "6. Saklama: Aktif hesap verisi saklanır; silme talebinden sonra 30 gün içinde silinir.",
        "7. Haklarınız: Erişim, düzeltme, silme, taşınabilirlik, kısıtlama, itiraz (KVKK m.11).",
        "8. İletişim: privacy@nexus.ai",
      ].join("\n"),
    });

    this.documents.set("cookies:tr", {
      type: "cookies",
      locale: "tr",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI — Çerez Politikası",
        "",
        "1. Zorunlu Çerezler: Kimlik doğrulama ve oturum yönetimi için gereklidir.",
        "2. Analitik Çerezler: Yalnızca açık onayınızla kullanılır.",
        "3. İzleme Yok: Üçüncü taraf reklam çerezleri kullanmıyoruz.",
        "4. Yönetim: Çerez onayınızı istediğiniz zaman Ayarlar'dan geri alabilirsiniz.",
      ].join("\n"),
    });
  }
}
