import { RELEASES_URL } from "./site-constants.mjs";

export const de = {
  title: "NEXUS — Dein Smart Home, verwaltet in deinem eigenen Netzwerk",
  ogImageAlt: "Das NEXUS-Smart-Home-Ökosystem auf Desktop und Smartphone",
  description:
    "NEXUS ist ein Local-first-Smart-Home-Ökosystem für Windows, macOS, Linux, Android und iOS. Direkte Gerätesteuerung über dein eigenes lokales Netzwerk, reaktionsschnelle Automatisierungen und Energiewerte in Echtzeit. Für immer kostenlos; optionaler NEXUS+-Tarif.",
  nav: [
    ["#features", "Funktionen"],
    ["#how", "So funktioniert’s"],
    ["#integrations", "Integrationen"],
    ["#pricing", "Preise"],
    ["#downloads", "Download"],
    ["#faq", "FAQ"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Local-first Smart Home",
    h1a: "Dein Zuhause.",
    h1b: "Ganz leise in deiner Hand.",
    lead: "Ein einheitliches Ökosystem für Licht, Klima, Rollläden und Sensoren — das direkt mit den Geräten in deinem eigenen lokalen Netzwerk spricht. Reaktionsschnelle Automatisierungen, Strommessung in Echtzeit und eine Steuerung, die weiterläuft, wenn das Internet ausfällt.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Neueste Version",
    shotAlt: "NEXUS-Oberfläche und Kontrollzentrum",
    trust: [
      "Kostenlos, unbegrenzt viele Geräte",
      "Keine Cloud für die Steuerung nötig",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Leistungsstarke Infrastruktur. Mühelose Steuerung.",
    lead: "Jeder Gerätezustand, jeder Leistungswert und jede automatisierte Szene läuft direkt in deinem lokalen Netzwerk, ohne Abhängigkeit von einer externen Cloud.",
    items: [
      [
        "zap",
        "Reaktionsschnelle Automatisierungen",
        "Zeit- und sonnenuntergangsgesteuerte Szenarien laufen direkt auf deiner lokalen Hardware — und werden auf dem Desktop zuverlässig im Hintergrund weiter ausgeführt.",
      ],
      [
        "gauge",
        "Energiewerte live",
        "Lies Leistung in Watt und Stromverbrauch in Echtzeit direkt von unterstützten smarten Steckdosen und Schaltern in deinem lokalen Netzwerk ab.",
      ],
      [
        "wifi",
        "Tempo des lokalen Netzwerks",
        "Direkte LAN-Kommunikation über HTTP, TCP und UDP mit den unter Integrationen aufgeführten Marken. Kein Umweg über die Cloud auf dem Befehlsweg.",
      ],
      [
        "lock",
        "Datenschutz von Grund auf",
        "Deine Heimkonfiguration und die Gerätetelemetrie bleiben auf deiner lokalen Hardware. Für die Nutzung von NEXUS ist ein Konto erforderlich; es speichert deine Einrichtung in deiner eigenen Zeile mit Zugriffskontrolle auf Zeilenebene. Gerätebefehle laufen weiterhin über dein LAN.",
      ],
      [
        "sparkles",
        "NEXUS-AI-Intelligenz",
        "Lokale Smart-Home-Befehle sind sofort verfügbar und für immer kostenlos. Der optionale Cloud-KI-Assistent liefert clevere Vorschläge, wann immer du Hilfe brauchst.",
      ],
      [
        "layers",
        "Offene lokale Protokolle",
        "Direkte Konnektoren sprechen in deinem LAN. Matter und Zigbee werden über deinen eigenen Home-Assistant-Server eingebunden — der Abschnitt Integrationen zeigt, was direkt und was über eine Bridge läuft.",
      ],
    ],
  },
  how: {
    heading: "Vom Download zur Verbindung in wenigen Minuten.",
    steps: [
      [
        "1",
        "Installieren & öffnen",
        "Lade das native Installationsprogramm für deine Plattform herunter (Windows, Linux oder Android). Melde dich dann an — für NEXUS ist ein Konto erforderlich, und es synchronisiert deine Einrichtung außerdem auf allen deinen Bildschirmen.",
      ],
      [
        "2",
        "Geräte hinzufügen",
        "Wähle deine Marke, durchsuche das lokale Netzwerk oder gib eine IP-Adresse ein. Marken mit direktem Konnektor sprechen ihr eigenes Protokoll — ohne Herstellerwolke auf diesem Weg.",
      ],
      [
        "3",
        "Dein Zuhause erleben",
        "Szenen, geplante Automatisierungen und echte Energiewerte — einheitliche Steuerung auf Desktop und Smartphone.",
      ],
    ],
  },
  integrations: {
    heading: "Funktioniert mit dem, was du schon hast.",
    lead: "Zuerst kostenlose, lokale Protokolle. Alles ohne direkten Konnektor funktioniert weiterhin über die Home-Assistant-Bridge.",
    groups: [
      [
        "Lokales HTTP — auf jeder Plattform",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue bridge",
          "Home Assistant",
        ],
      ],
      [
        "Lokales Netzwerk, ohne Konto oder Schlüssel — Desktop-App",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY-Modus)", "Wake-on-LAN"],
      ],
    ],
    more: "Fehlt etwas? Konnektor anfragen",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Kostenlos nutzbar. NEXUS+, wenn du mehr willst",
    lead: "",
    currencyNote: "Preise in USD",
    plans: [
      {
        name: "Kostenlos",
        price: "$0",
        period: "für immer",
        features: [
          "Unbegrenzt viele Geräte und Räume über alle unterstützten lokalen Protokolle",
          "Keinerlei Cloud-Abhängigkeit: läuft lokal in deinem eigenen LAN",
          "30 NEXUS-AI-Befehle und Geräteaktionen pro Tag",
          "Geplante lokale Automatisierungen und eigene Szenen",
          "Kontosynchronisierung über mehrere Geräte (Räume, Geräte, Szenen)",
          "100 % privat: kein Tracking, kein Datensammeln",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "pro Monat",
        badge: "Am beliebtesten",
        features: [
          "Alles aus dem Free-Tarif, plus:",
          "2.000 NEXUS-AI-Antworten im Monat statt 30 am Tag",
          "Bitte NEXUS AI, Szenen einzurichten und in einfacher Sprache zu antworten",
          "Ein Konto, gültig auf jedem NEXUS-Gerät",
          "Kostenlose Testphase — 3 Tage bei monatlicher, 7 Tage bei jährlicher Zahlung; Kündigung zum Periodenende",
        ],
        cta: {
          label: "Kostenlose Testphase starten",
          monthlyLabel: "3 Tage kostenlos testen",
          yearlyLabel: "7 Tage kostenlos testen",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Familie",
        price: "Kostenlos",
        period: "für die ganze Familie",
        badge: "Ganzes Zuhause",
        features: [
          "Haushaltsmitglieder mit rollenbasiertem Zugriff — ohne Obergrenze",
          "Rollen für Eigentümer, Mitglied und Gast",
          "Berechtigungen für Steuerung, Einladungen und Einstellungen pro Mitglied",
          "Szenen und Automatisierungen werden zwischen deinen eigenen angemeldeten Geräten synchronisiert",
          "Aktiv im gesamten Ökosystem (Desktop und Smartphone)",
          "Völlig kostenlos zu deinem Zuhause dazu",
        ],
        cta: { label: "Mit Family starten", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Jederzeit kündbar unter Abrechnung in der App oder über dein Konto auf dieser Website. Die Kündigung wird zum Ende des laufenden Zeitraums wirksam.",
  },
  downloads: {
    heading: "Nativ auf jedem Desktop. Zu Hause auf dem Smartphone.",
    lead: "Immer kostenlos. Jedes Installationsprogramm wird mit einer veröffentlichten SHA-256-Prüfsumme ausgeliefert, damit du prüfen kannst, was du installierst.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 Bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian und Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · signierte APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Version",
    sizeLabel: "Größe",
    webCard: {
      title: "Ein Konto für dein gesamtes Ökosystem",
      desc: "Desktop-Programme für Windows und Linux sowie die Android-App. Angemeldet bleiben deine Räume, Geräte, Szenen und Automatisierungen nahtlos auf all deinen Bildschirmen synchron.",
      cta: { label: "NEXUS herunterladen", href: "#downloads" },
    },
    smartScreenNote:
      "Unter Windows ist der einfachste Weg der Microsoft Store: Das Paket ist von Microsoft signiert, und Updates kommen über den Store. Die direkte .exe ist nicht signiert, daher kann Windows vor einem „unbekannten Herausgeber“ warnen — siehe Prüfsummen.",
  },
  faq: {
    heading: "Die wichtigen Fragen, beantwortet.",
    items: [
      [
        "Läuft NEXUS vollständig in meinem lokalen Netzwerk?",
        "Ja. NEXUS basiert auf einer strikten Local-first-Architektur. Deine Geräte, Räume, Szenen und Sensortelemetrie werden direkt auf der Hardware in deinem Zuhause verarbeitet. Selbst bei Internetausfällen laufen alle lokalen Steuerungen, die Beleuchtung und die Automatisierungen nahtlos und ohne Verzögerung weiter. Die Anmeldung synchronisiert deine Einstellungen sicher auf allen deinen Bildschirmen.",
      ],
      [
        "Muss ich NEXUS installieren, oder läuft es im Browser?",
        "Installiere das Desktop-Programm (Windows oder Linux) oder die Android-App. NEXUS wird nicht als Browser-App angeboten. Gerätebefehle laufen über dein eigenes lokales Netzwerk. Shelly, Philips Hue, ESPHome, Tasmota, WLED und Home Assistant nutzen lokales HTTP im Desktop-Programm und unter Android. TP-Link Kasa und Yeelight benötigen rohes TCP und laufen deshalb im Desktop-Programm. Diese Website dient für Konto, Downloads und Abrechnung.",
      ],
      [
        "Was bringt der NEXUS+-Tarif zusätzlich?",
        "Die grundlegende Smart-Home-Steuerung — unbegrenzt viele Geräte und Räume, Offline-Automatisierungen und lokale Dashboards — ist kostenlos. NEXUS+ umfasst alles aus Free, NEXUS AI für Szenen und Fragen in einfacher Sprache, 2.000 Antworten im Monat, erweiterte Verbindungen zum Hinzufügen von Home-Assistant-Geräten und ein Konto auf jedem Gerät, mit einer Testphase von 3 Tagen bei monatlicher oder 7 Tagen bei jährlicher Zahlung. Gerätebefehle laufen weiterhin lokal. Haushaltsrollen sind ohne Aufpreis in deinem Zuhause enthalten.",
      ],
      [
        "Zu welchem Konto gehört mein NEXUS+-Abonnement?",
        "Zu der E-Mail-Adresse, die beim Bezahlen verwendet wurde. Melde dich vor der Zahlung auf dieser Website oder in der App an: Der Checkout öffnet sich dann mit der E-Mail-Adresse deines Kontos, und das Abonnement erscheint auf jedem Gerät, auf dem du dich anmeldest. NEXUS+ kann nicht ohne Konto gekauft werden. Wenn du mit einer anderen E-Mail-Adresse bezahlst, wird das Abonnement unter dieser Adresse gespeichert und erscheint erst in deinem Konto, wenn du dich damit anmeldest.",
      ],
      [
        "Wie laufen Automatisierungen und geplante Regeln?",
        "Die NEXUS-Automatisierungs-Engine wertet deine Zeitpläne und Sensorregeln auf dem Gerät aus, das du laufen lässt — die Desktop-App bleibt im Infobereich und arbeitet rund um die Uhr, sodass Beleuchtungs-, Energie- und Sicherheitsroutinen nie auf eine Cloud warten. Szenen und Timer, die von deinem Smartphone ausgelöst werden, wirken sofort über dein LAN. Neue Ereignisse werden an die Benachrichtigungskanäle verteilt, die du auf der Seite Sofortbenachrichtigungen aktivierst: die Leiste in der App, Systembenachrichtigungen, ntfy, Telegram oder dein eigener HTTPS-Webhook.",
      ],
      [
        "Welche Geräte und Ökosysteme werden unterstützt?",
        "NEXUS spricht das eigene lokale Protokoll jedes Geräts: Shelly (Gen1 und Gen2+), Tasmota, WLED, ESPHome, Philips Hue und Home Assistant über lokales HTTP auf jeder Plattform, dazu TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY-Modus) und Wake-on-LAN über das lokale Netzwerk in der Desktop-App, ohne Konto oder Schlüssel. Alles andere — Matter- oder Zigbee-Geräte — wird über deinen eigenen Home-Assistant-Server eingebunden, den NEXUS als einen einzigen lokalen Hub behandelt. Die lokale IP-Erkennung koppelt Geräte sofort, ganz ohne Herstellerwolke dazwischen.",
      ],
      [
        "Wie werden Sicherheitskameras und Sensoren eingebunden?",
        "NEXUS bündelt deine Sicherheitskameras, Bewegungsmelder und Eingangssensoren in einem zentralen Sicherheits-Dashboard. Du kannst Privatsphäre-Modi automatisieren, Überwachungsroutinen beim Verlassen des Hauses scharf schalten und jede Bewegung oder jedes Kontaktereignis in der App sehen — sowie über die Benachrichtigungskanäle, die du aktivierst (Systembenachrichtigungen, ntfy, Telegram oder dein eigener Webhook).",
      ],
      [
        "Kann ich NEXUS+ jederzeit kündigen?",
        "Ja, völlig unkompliziert und ohne Bindung. Du kannst jederzeit mit einem Klick kündigen: in den Einstellungen unter Konto & Abrechnung in der App, über unsere Website oder direkt über den Bestelllink in deiner Rechnungsbestätigung per E-Mail. Deine Premium-Vorteile bleiben bis zum Ende deines Abrechnungszeitraums aktiv, ohne weitere Abbuchungen.",
      ],
      [
        "Kann ich mein Zuhause von unterwegs steuern?",
        "Nicht über eine NEXUS-Cloud: NEXUS spricht direkt in deinem Heimnetzwerk mit deinen Geräten und hat kein Relay. Um es von außen zu erreichen, bring dein Smartphone oder deinen Laptop per VPN wie Tailscale (Subnet-Router) oder WireGuard auf deinem Router ins Heimnetzwerk; NEXUS funktioniert dann genau wie zu Hause. NEXUS hat noch keine Einstellung für die Hub-Adresse, daher muss das VPN deinen lokalen Adressbereich erreichbar machen, und die Suche nach neuen Geräten funktioniert nur im Heimnetzwerk. Setze ein Gerät niemals per Portweiterleitung dem Internet aus. Die Schritt-für-Schritt-Anleitung ist docs/REMOTE-ACCESS.md im Repository.",
      ],
      [
        "Gibt es eine iPhone-Version?",
        "Es gibt keine App-Store-App, da NEXUS kein kostenpflichtiges Apple-Developer-Konto nutzt. Mit einem Mac und einer kostenlosen Apple-ID kannst du sie für dein eigenes iPhone bauen (Anleitung: docs/IOS-BUILD.md), und ein Release kann auch eine unsignierte IPA enthalten, die AltStore oder Sideloadly für dich signieren können; dieser Weg wurde noch nicht auf einem echten iPhone verifiziert. Mit einer kostenlosen Apple-ID läuft die App nach 7 Tagen ab, und Benachrichtigungen bei geschlossener App sind unter iOS nicht verfügbar. Der Heim-Hub bleibt das Desktop-Programm; das iPhone ist ein Client.",
      ],
      [
        "Mein Gerät steht nicht auf der Liste. Was kann ich tun?",
        "NEXUS unterstützt nur Geräte mit dokumentiertem lokalem Protokoll; reine Cloud-Geräte werden nicht unterstützt, da NEXUS nie mit einer Herstellerwolke spricht. Die Kompatibilitätsliste (docs/COMPATIBILITY.md) enthält außerdem Sonoff im DIY-Modus, WiZ, LIFX, Govee (LAN) und Wake-on-LAN. Für jedes davon gibt es automatisierte Protokolltests, aber ein Modell gilt erst als verifiziert, wenn jemand meldet, dass es auf einem echten Gerät funktioniert hat. Schreib uns über das Kontaktformular auf dieser Website (wähle „New Device / Connector Request“) oder per E-Mail: Marke und Modell, was du erwartet hast und was passiert ist. Deine Rückmeldung, dass ein Modell auf deinem echten Gerät funktioniert hat, markiert es als verifiziert; gib niemals Passwörter, lokale Schlüssel oder Tokens an.",
      ],
      [
        "Brauche ich ein Konto? Was passiert, wenn der Server nicht erreichbar ist?",
        "Ja: Du meldest dich einmal mit einem kostenlosen E-Mail-Konto an, um NEXUS zu öffnen. Danach laufen Gerätesteuerung und Automatisierungen in deinem eigenen Netzwerk und funktionieren auch ohne Internet weiter. Das Konto ergänzt die Synchronisierung zwischen deinen Geräten, Family und den KI-Assistenten, die kostenlose Cloud-Dienste mit Limits nutzen. Wenn einer davon nicht verfügbar ist, etwa weil das kostenlose Supabase-Projekt nach etwa einer Woche ohne Aktivität pausiert wurde, melden die Cloud-Bildschirme, dass der Server nicht erreichbar ist, statt etwas als gespeichert anzuzeigen; Geräte, Automatisierungen und der Infobereich laufen weiter. Wenn das KI-Kontingent oder der Dienst erschöpft ist, sagt der Assistent, dass er nicht antworten konnte.",
      ],
      [
        "Kann ich meine Einstellungen sichern und auf ein anderes Gerät übertragen?",
        "Ja. In den Einstellungen gibt es einen Backup-Bereich, in dem du deine Einstellungen und Automatisierungen in eine JSON-Datei exportieren und auf einem anderen Gerät oder nach einer Neuinstallation importieren kannst. Passwörter, Tokens und lokale Schlüssel werden aus der Liste der gekoppelten Geräte in der Datei entfernt; gib sie nach der Wiederherstellung neu ein. Halte die Backup-Datei privat.",
      ],
      [
        "Kann ich meine Energiedaten exportieren?",
        "Ja. Die Seite Energie kann die neuesten echten Leistungswerte deiner Geräte als CSV- oder JSON-Datei exportieren. NEXUS hat nur Daten von Geräten, die tatsächlich Leistung melden; ist keines gekoppelt, gibt es nichts zu exportieren.",
      ],
      [
        "Warum warnt mich Windows, wenn ich das Installationsprogramm starte?",
        "Installiere über den Microsoft Store, dann siehst du diese Warnung nicht: Microsoft signiert das Paket bei der Zertifizierung und liefert Updates über den Store. Der direkte .exe-Download ist noch nicht mit einem kommerziellen Zertifikat signiert, daher kann SmartScreen „unbekannter Herausgeber“ anzeigen. Du kannst die Datei vor dem Start mit den im Download-Bereich aufgeführten Prüfsummen vergleichen. Unsere Richtlinie zur Codesignierung ist in der Fußzeile der Website verlinkt.",
      ],
    ],
  },
  about: {
    title: "Über NEXUS",
    lead: "Eine unabhängige Local-first-Smart-Home-Plattform für Tempo, absolute Privatsphäre und echtes Hardware-Eigentum. Indem NEXUS über dein eigenes Heimnetzwerk direkt mit deinen Geräten spricht, beseitigt es die Cloud-Abhängigkeit für immer.",
    manifesto: {
      heading: "Warum wir NEXUS gebaut haben",
      text: "Die moderne Smart-Home-Branche ist falsch abgebogen. Geschlossene Ökosysteme drängten Hausbesitzer in Pflicht-Abos, Verzögerungen durch die Cloud und aufdringliches Telemetrie-Tracking. Wenn deine Internetverbindung ausfällt, sollte der Schalter im Wohnzimmer nicht aufhören zu funktionieren. Wir haben NEXUS gebaut, weil wir glauben, dass dein Zuhause dein Rückzugsort ist: Dein Grundriss, der Status deiner Kameras und die täglichen Routinen deiner Familie gehören ausschließlich auf deine eigene Hardware.",
    },
    pillars: [
      {
        title: "Local-first-Tempo",
        desc: "Jede Automatisierung und jeder Befehl läuft in Millisekunden über dein lokales LAN. Keine Umwege über entfernte Cloud-Server, keine Verzögerung.",
      },
      {
        title: "Datenschutz ohne Kompromisse",
        desc: "Keine Analyse-Telemetrie, kein Verhaltensprofiling und kein Verkauf deiner privaten Routinen. Ein Konto ist erforderlich; deine Einrichtung wird in deiner eigenen, auf Zeilenebene geschützten Kontozeile gespeichert. Gerätebefehle bleiben weiterhin in deinem LAN.",
      },
      {
        title: "Keine Herstellerbindung",
        desc: "Zuerst offene lokale Protokolle: Shelly, Philips Hue, ESPHome, Tasmota und WLED antworten NEXUS direkt, und alles andere wird über deinen eigenen Home-Assistant-Server statt über eine Herstellerwolke eingebunden.",
      },
      {
        title: "Ehrliches, nachhaltiges SaaS",
        desc: "Die grundlegende Smart-Home-Verwaltung ist für immer vollständig kostenlos und unbegrenzt. NEXUS+ ist der NEXUS-AI-Tarif und hilft, diese Cloud-Nutzung zu decken.",
      },
    ],
    architecture: {
      heading: "Für Zuverlässigkeit entwickelt",
      lead: "NEXUS hält eine schlanke Desktop-Engine im Infobereich, damit Zeitpläne und Sensorregeln weiter ausgewertet werden, solange dein Computer läuft, und die mobile App öffnet sich direkt auf demselben lokalen Netzwerk.",
      items: [
        {
          icon: "layers",
          title: "Desktop",
          desc: "Die Apps für Windows, macOS und Linux bleiben im Infobereich und halten lokale Zeitpläne und Sensorregeln am Laufen, solange der Computer eingeschaltet ist. Windows und Linux werden als fertige Installationsprogramme ausgeliefert; macOS wird aus dem Quellcode gebaut (unsigniert: Rechtsklick → Öffnen).",
        },
        {
          icon: "wifi",
          title: "Smartphone",
          desc: "Die Android- und iOS-Apps öffnen sich auf demselben lokalen Netzwerk; Gerätebefehle laufen weiterhin über dein LAN. Android wird als signierte APK ausgeliefert; iOS wird aus dem Quellcode mit Xcode und einer kostenlosen Apple-ID gebaut.",
        },
        {
          icon: "lock",
          title: "Konto",
          desc: "Ein Konto ist erforderlich, damit Räume, Geräte und Szenen auf jedem Bildschirm übereinstimmen. Gerätebefehle verlassen dein Heimnetzwerk nicht.",
        },
      ],
    },
    linksTitle: "Nützliche Links",
  },
  footer: {
    tagline:
      "Steuere dein gesamtes Smart Home direkt über dein lokales Netzwerk — ohne Herstellerbindung und ohne Cloud-Abhängigkeit. Selbst wenn das Internet ausfällt, steht dein Zuhause nie still.",
    product: "Produkt",
    productLinks: [
      ["Funktionen", "#features"],
      ["Preise", "#pricing"],
      ["Download", "#downloads"],
      ["FAQ", "#faq"],
      ["Über uns", "/about"],
    ],
    account: "Kunden & Support",
    accountLinks: [
      ["Kontakt & technischer Support", "javascript:nxOpenContactModal('Technical Support')"],
      ["Versionshinweise & Community", RELEASES_URL],
      ["Apps herunterladen", "#downloads"],
    ],
    legal: "Rechtliches",
    legalLinks: [
      ["Datenschutz", "/privacy"],
      ["Nutzungsbedingungen", "/terms"],
      ["Rückerstattungen", "/refund"],
      ["Codesignierung", "/code-signing"],
      ["Mitwirken", "/contribute"],
    ],
    rights: "Alle Rechte vorbehalten.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
