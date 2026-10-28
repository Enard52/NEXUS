// Tip tanımı: scripts/site-content.mjs (tek kaynak içerik) için TypeScript bildirimi.
export declare const PRICES: { TRY: { monthly: string; yearly: string; [k: string]: any }; USD: { monthly: string; yearly: string; [k: string]: any }; [k: string]: any };
export declare const APP_URL: string;
export declare const RELEASES_URL: string;
export declare const ISSUES_URL: string;
export declare const MANAGE_URL: string;
export declare const content: Record<string, unknown>;
export declare function priceFor(lang: string): unknown;
export declare const brand: Record<string, unknown>;

