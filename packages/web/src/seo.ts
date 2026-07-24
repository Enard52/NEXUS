/**
 * NEXUS AI — SEO & discoverability (FAZ 10/18 web front end)
 *
 * Search engines and social platforms only see what the HTML `<head>` tells
 * them, so this module renders that contract explicitly and testably:
 *   - primary meta (title, description, keywords, robots, theme-color, canonical),
 *   - Open Graph + Twitter Card tags for rich link previews,
 *   - hreflang alternates for the multilingual site (FAZ 13),
 *   - JSON-LD structured data (schema.org SoftwareApplication) so the product
 *     is eligible for rich results,
 *   - robots.txt and sitemap.xml generators.
 *
 * Everything is a pure `config -> string` function: deterministic and unit
 * tested, no live crawler or network needed.
 */

/** One translated variant of the page, for hreflang alternates. */
export interface LocaleAlternate {
  /** BCP-47 language tag, e.g. "en", "tr". */
  readonly lang: string;
  /** Absolute URL of that language's page. */
  readonly url: string;
}

export interface SeoConfig {
  readonly title: string;
  readonly description: string;
  /** Canonical absolute URL of the page. */
  readonly url: string;
  readonly siteName: string;
  /** OG locale, e.g. "en_US". */
  readonly locale: string;
  readonly alternates?: readonly LocaleAlternate[];
  /** Absolute URL to the social preview image (1200×630 recommended). */
  readonly image?: string;
  readonly keywords?: readonly string[];
  /** Brand theme color for the browser chrome. */
  readonly themeColor?: string;
  /** Robots directive; defaults to "index,follow". */
  readonly robots?: string;
  /** Twitter handle incl. "@", if any. */
  readonly twitterSite?: string;
}

/** Escape a value for safe use inside a double-quoted HTML attribute. */
function attr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escape a JSON string for safe embedding inside a <script> element. */
function safeJson(value: unknown): string {
  // Prevent a literal "</script>" (or any "<") from breaking out of the tag.
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

/**
 * schema.org SoftwareApplication JSON-LD. Free multi-platform app, which is
 * what makes NEXUS eligible for a rich software result in search.
 */
export function structuredData(config: SeoConfig): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.siteName,
    description: config.description,
    url: config.url,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows, macOS, Linux, iOS, Android",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...(config.image ? { image: config.image } : {}),
  };
  return `<script type="application/ld+json">\n${safeJson(data)}\n</script>`;
}

/** schema.org Organization + WebSite JSON-LD to anchor brand/knowledge results. */
export function organizationData(config: SeoConfig): string {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.siteName,
    url: config.url,
    ...(config.image ? { logo: config.image } : {}),
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.siteName,
    url: config.url,
    inLanguage: (config.alternates ?? []).map((a) => a.lang),
  };
  return (
    `<script type="application/ld+json">\n${safeJson(org)}\n</script>\n` +
    `<script type="application/ld+json">\n${safeJson(site)}\n</script>`
  );
}

/** Render the full SEO `<head>` block (meta + OG + Twitter + hreflang + JSON-LD). */
export function renderHead(config: SeoConfig): string {
  const robots = config.robots ?? "index,follow";
  const lines: string[] = [
    `<title>${attr(config.title)}</title>`,
    `<meta name="description" content="${attr(config.description)}" />`,
    `<meta name="robots" content="${attr(robots)}" />`,
    `<link rel="canonical" href="${attr(config.url)}" />`,
  ];

  if (config.keywords && config.keywords.length > 0) {
    lines.push(`<meta name="keywords" content="${attr(config.keywords.join(", "))}" />`);
  }
  if (config.themeColor) {
    lines.push(`<meta name="theme-color" content="${attr(config.themeColor)}" />`);
  }

  // Open Graph.
  lines.push(
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${attr(config.siteName)}" />`,
    `<meta property="og:title" content="${attr(config.title)}" />`,
    `<meta property="og:description" content="${attr(config.description)}" />`,
    `<meta property="og:url" content="${attr(config.url)}" />`,
    `<meta property="og:locale" content="${attr(config.locale)}" />`,
  );
  for (const alt of config.alternates ?? []) {
    lines.push(`<meta property="og:locale:alternate" content="${attr(alt.lang)}" />`);
  }
  if (config.image) {
    lines.push(`<meta property="og:image" content="${attr(config.image)}" />`);
  }

  // Twitter Card.
  lines.push(
    `<meta name="twitter:card" content="${config.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${attr(config.title)}" />`,
    `<meta name="twitter:description" content="${attr(config.description)}" />`,
  );
  if (config.twitterSite) {
    lines.push(`<meta name="twitter:site" content="${attr(config.twitterSite)}" />`);
  }
  if (config.image) {
    lines.push(`<meta name="twitter:image" content="${attr(config.image)}" />`);
  }

  // hreflang alternates (self-referencing set is best practice).
  for (const alt of config.alternates ?? []) {
    lines.push(`<link rel="alternate" hreflang="${attr(alt.lang)}" href="${attr(alt.url)}" />`);
  }
  if (config.alternates && config.alternates.length > 0) {
    // x-default points crawlers at the canonical when no language matches.
    lines.push(`<link rel="alternate" hreflang="x-default" href="${attr(config.url)}" />`);
  }

  lines.push(structuredData(config));
  lines.push(organizationData(config));
  return lines.join("\n");
}

export interface SitemapEntry {
  readonly url: string;
  /** ISO date (YYYY-MM-DD) of last modification. */
  readonly lastmod?: string;
  readonly changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  /** 0.0–1.0 priority hint. */
  readonly priority?: number;
}

/** Generate a valid urlset sitemap.xml body. */
export function renderSitemap(entries: readonly SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const parts = [`    <loc>${attr(e.url)}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${attr(e.lastmod)}</lastmod>`);
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Generate robots.txt that allows everything and points at the sitemap. */
export function renderRobotsTxt(sitemapUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
}

export interface ManifestOptions {
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly themeColor: string;
  readonly backgroundColor: string;
  /** Path to the app icon (relative or absolute). */
  readonly iconPath: string;
}

/** Generate a Web App Manifest (installable PWA + richer mobile presence). */
export function renderManifest(options: ManifestOptions): string {
  const manifest = {
    name: options.name,
    short_name: options.shortName,
    description: options.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    icons: [
      { src: options.iconPath, sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
    ],
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
