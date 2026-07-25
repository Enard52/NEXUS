/**
 * NEXUS AI — Onboarding Wizard (FAZ 20)
 *
 * Guides new users through first-time setup: account → language/addressing
 * preference → first device connection → first skill suggestion.
 *
 * "Yeni bir kullanıcı hiçbir dış yardım almadan hesap açıp ilk cihazını
 * bağlayıp ilk skill'i deneyimleyebiliyor."
 */

export type OnboardingStep =
  | "account_created"
  | "language_set"
  | "address_set"
  | "first_device_connected"
  | "first_skill_suggested"
  | "completed";

export interface OnboardingState {
  readonly userId: string;
  readonly currentStep: OnboardingStep;
  readonly completedSteps: readonly OnboardingStep[];
  readonly startedAt: string;
  readonly completedAt?: string;
}

export interface OnboardingOptions {
  readonly now?: () => Date;
}

/**
 * State machine for the first-time user setup flow.
 * Each step must be completed in order; the wizard tracks progress.
 */
export class OnboardingWizard {
  private readonly states = new Map<string, OnboardingState>();
  private readonly now: () => Date;

  private static readonly STEP_ORDER: OnboardingStep[] = [
    "account_created",
    "language_set",
    "address_set",
    "first_device_connected",
    "first_skill_suggested",
    "completed",
  ];

  constructor(options: OnboardingOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  /** Start onboarding for a new user (after account creation). */
  start(userId: string): OnboardingState {
    const state: OnboardingState = {
      userId,
      currentStep: "account_created",
      completedSteps: ["account_created"],
      startedAt: this.now().toISOString(),
    };
    this.states.set(userId, state);
    return state;
  }

  /** Mark a step as completed and advance to the next. */
  completeStep(userId: string, step: OnboardingStep): OnboardingState {
    const current = this.states.get(userId);
    if (!current) throw new Error(`No onboarding state for user ${userId}`);

    const stepIndex = OnboardingWizard.STEP_ORDER.indexOf(step);
    if (stepIndex < 0) throw new Error(`Unknown step: ${step}`);

    const completed = [...current.completedSteps];
    if (!completed.includes(step)) completed.push(step);

    // Advance to next uncompleted step
    const nextStep = OnboardingWizard.STEP_ORDER.find((s) => !completed.includes(s)) ?? "completed";
    const isComplete = nextStep === "completed";

    const updated: OnboardingState = {
      ...current,
      currentStep: nextStep,
      completedSteps: isComplete ? [...completed, "completed"] : completed,
      completedAt: isComplete ? this.now().toISOString() : undefined,
    };
    this.states.set(userId, updated);
    return updated;
  }

  /** Get current onboarding state. */
  getState(userId: string): OnboardingState | undefined {
    return this.states.get(userId);
  }

  /** Check if onboarding is complete. */
  isComplete(userId: string): boolean {
    return this.states.get(userId)?.currentStep === "completed";
  }

  /** Get the next suggested action for the user. */
  nextAction(userId: string): string {
    const state = this.states.get(userId);
    if (!state) return "Create your account to get started.";

    switch (state.currentStep) {
      case "account_created":
        return "Set your preferred language.";
      case "language_set":
        return "Tell us how you'd like to be addressed.";
      case "address_set":
        return "Connect your first smart device.";
      case "first_device_connected":
        return "Try your first automation skill.";
      case "first_skill_suggested":
        return "Complete the setup.";
      case "completed":
        return "You're all set! Enjoy NEXUS.";
    }
  }
}

// ── FAQ / Knowledge Base ──────────────────────────────────────────────────────

export interface FaqEntry {
  readonly id: string;
  readonly category: string;
  readonly question: string;
  readonly answer: string;
  readonly locale: string;
}

export class FaqService {
  private readonly entries: FaqEntry[] = [];

  constructor() {
    this.seedFaqs();
  }

  /** Get all FAQs for a locale (falls back to English). */
  getAll(locale = "en"): readonly FaqEntry[] {
    const localized = this.entries.filter((e) => e.locale === locale);
    return localized.length > 0 ? localized : this.entries.filter((e) => e.locale === "en");
  }

  /** Search FAQs by keyword. */
  search(query: string, locale = "en"): readonly FaqEntry[] {
    const lower = query.toLowerCase();
    return this.getAll(locale).filter(
      (e) => e.question.toLowerCase().includes(lower) || e.answer.toLowerCase().includes(lower),
    );
  }

  /** Get FAQs by category. */
  getByCategory(category: string, locale = "en"): readonly FaqEntry[] {
    return this.getAll(locale).filter((e) => e.category === category);
  }

  private seedFaqs(): void {
    // English
    this.entries.push(
      { id: "faq-1", category: "account", question: "How do I create an account?", answer: "Download NEXUS and follow the onboarding wizard to create your account.", locale: "en" },
      { id: "faq-2", category: "account", question: "How do I reset my password?", answer: "Go to Settings > Account > Reset Password. A reset link will be sent to your email.", locale: "en" },
      { id: "faq-3", category: "devices", question: "Which devices are supported?", answer: "NEXUS supports IKEA, Xiaomi, Sonoff, Tuya, and Philips Hue devices, with more added regularly.", locale: "en" },
      { id: "faq-4", category: "devices", question: "How do I connect a new device?", answer: "Go to Settings > Devices > Add Device. Follow the pairing instructions for your device brand.", locale: "en" },
      { id: "faq-5", category: "billing", question: "How do I upgrade to Premium?", answer: "Go to Settings > Subscription > Upgrade. You'll be redirected to Patreon to complete the payment.", locale: "en" },
      { id: "faq-6", category: "billing", question: "How do I cancel my subscription?", answer: "Go to Settings > Subscription > Cancel. Your access continues until the end of the billing period.", locale: "en" },
      { id: "faq-7", category: "privacy", question: "How is my data protected?", answer: "All data is encrypted at rest. Voice processing requires explicit consent. You can export or delete your data at any time.", locale: "en" },
    );

    // Turkish
    this.entries.push(
      { id: "faq-tr-1", category: "account", question: "Hesap nasıl oluştururum?", answer: "NEXUS'u indirin ve onboarding sihirbazını takip ederek hesabınızı oluşturun.", locale: "tr" },
      { id: "faq-tr-2", category: "account", question: "Şifremi nasıl sıfırlarım?", answer: "Ayarlar > Hesap > Şifre Sıfırla bölümüne gidin. E-postanıza sıfırlama linki gönderilecektir.", locale: "tr" },
      { id: "faq-tr-3", category: "devices", question: "Hangi cihazlar destekleniyor?", answer: "NEXUS; IKEA, Xiaomi, Sonoff, Tuya ve Philips Hue cihazlarını destekler, sürekli yenileri eklenmektedir.", locale: "tr" },
      { id: "faq-tr-4", category: "devices", question: "Yeni cihaz nasıl bağlarım?", answer: "Ayarlar > Cihazlar > Cihaz Ekle bölümüne gidin. Cihaz markanız için eşleştirme talimatlarını izleyin.", locale: "tr" },
      { id: "faq-tr-5", category: "billing", question: "Premium'a nasıl geçerim?", answer: "Ayarlar > Abonelik > Yükselt bölümüne gidin. Ödemeyi tamamlamak için Patreon'a yönlendirileceksiniz.", locale: "tr" },
      { id: "faq-tr-6", category: "billing", question: "Aboneliğimi nasıl iptal ederim?", answer: "Ayarlar > Abonelik > İptal Et. Erişiminiz fatura döneminin sonuna kadar devam eder.", locale: "tr" },
      { id: "faq-tr-7", category: "privacy", question: "Verilerim nasıl korunuyor?", answer: "Tüm veriler şifreli saklanır. Ses işleme açık onay gerektirir. Verilerinizi istediğiniz zaman dışa aktarabilir veya silebilirsiniz.", locale: "tr" },
    );
  }
}
