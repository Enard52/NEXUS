import { RELEASES_URL } from "./site-constants.mjs";

export const it = {
  "title": "NEXUS — La tua casa intelligente, gestita sulla tua rete",
  "ogImageAlt": "Ecosistema per la casa intelligente NEXUS su desktop e mobile",
  "description": "NEXUS è un ecosistema per la casa intelligente che privilegia la localizzazione per Windows, macOS, Linux, Android e iOS. Controllo diretto dei dispositivi sulla tua rete locale, automazioni reattive e metriche energetiche in tempo reale. Gratis per sempre; piano opzionale NEXUS+.",
  "nav": [
    [
      "#features",
      "Caratteristiche"
    ],
    [
      "#how",
      "Come funziona"
    ],
    [
      "#integrations",
      "Integrazioni"
    ],
    [
      "#pricing",
      "Prezzi"
    ],
    [
      "#downloads",
      "Scarica"
    ],
    [
      "#faq",
      "FAQ"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Casa intelligente che privilegia la localizzazione",
    "h1a": "La tua casa.",
    "h1b": "Silenziosamente sotto il tuo controllo.",
    "lead": "Un ecosistema unificato per le tue luci, il clima, le tapparelle e i sensori — che comunica direttamente con i dispositivi sulla tua rete locale. Automazioni reattive, misurazione dell'energia in tempo reale e controllo che continua a funzionare anche quando internet cade.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Ultima versione",
    "shotAlt": "Interfaccia e centro di controllo NEXUS",
    "trust": [
      "Dispositivi gratuiti e illimitati",
      "Nessun cloud necessario per il controllo",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Infrastruttura potente. Controllo senza sforzo.",
    "lead": "Ogni stato del dispositivo, metrica di potenza e scena automatizzata funziona direttamente sulla tua rete locale senza dipendenze dal cloud esterno.",
    "items": [
      [
        "zap",
        "Automazioni reattive",
        "Gli scenari attivati da orario o tramonto vengono eseguiti direttamente sul tuo hardware locale — continuando in modo affidabile in background sul desktop."
      ],
      [
        "gauge",
        "Letture Energetiche in Tempo Reale",
        "Leggi l'assorbimento di wattaggio e il consumo energetico in tempo reale direttamente dalle prese e dagli interruttori intelligenti supportati sulla tua rete locale."
      ],
      [
        "wifi",
        "Velocità della Rete Locale",
        "Comunicazione diretta LAN tramite HTTP, TCP e UDP con i marchi elencati sotto Integrazioni. Nessun passaggio cloud nel percorso dei comandi."
      ],
      [
        "lock",
        "Privacy by Design",
        "La configurazione della tua casa e la telemetria dei dispositivi rimangono sul tuo hardware locale. È necessario un account per usare NEXUS; esso salva la tua configurazione nella tua riga personale sotto il controllo di accesso a livello di riga. I comandi dei dispositivi passano comunque attraverso la tua LAN."
      ],
      [
        "sparkles",
        "NEXUS AI Intelligence",
        "I comandi locali della casa intelligente sono istantanei e gratuiti per sempre. L'assistente AI opzionale nel cloud fornisce suggerimenti intelligenti ogni volta che hai bisogno di guida."
      ],
      [
        "layers",
        "Apri protocolli locali",
        "I connettori diretti comunicano sulla tua LAN. Matter e Zigbee si collegano tramite il tuo server Home Assistant — la sezione Integrazioni elenca ciò che è diretto rispetto a ciò che è collegato tramite bridge."
      ]
    ]
  },
  "how": {
    "heading": "Da scaricare a connesso in pochi minuti.",
    "steps": [
      [
        "1",
        "Installa e apri",
        "Scarica l'installer nativo per la tua piattaforma (Windows, Linux o Android). Quindi accedi — è necessario un account per usare NEXUS, e sincronizza anche le impostazioni tra i tuoi schermi."
      ],
      [
        "2",
        "Aggiungi i tuoi dispositivi",
        "Scegli il tuo marchio, scansiona la rete locale o inserisci un IP. I marchi con un connettore diretto parlano il proprio protocollo — nessun cloud del fornitore in questo percorso."
      ],
      [
        "3",
        "Vivi la tua casa",
        "Scene, automazioni programmate e letture energetiche reali — controllo unificato tra desktop e mobile."
      ]
    ]
  },
  "integrations": {
    "heading": "Funziona con ciò che hai già.",
    "lead": "Protocolli locali gratuiti prima di tutto. Qualsiasi cosa senza un connettore diretto funziona ancora tramite il bridge di Home Assistant.",
    "groups": [
      [
        "HTTP locale — su tutte le piattaforme",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Bridge Philips Hue",
          "Home Assistant"
        ]
      ],
      [
        "Rete locale, senza account o chiave — app desktop",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (modalità DIY)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Manca qualcosa? Richiedi un connettore",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Gratuito da usare. NEXUS+ quando vuoi di più",
    "lead": "",
    "currencyNote": "Prezzi in USD",
    "plans": [
      {
        "name": "Gratuito",
        "price": "$0",
        "period": "forever",
        "features": [
          "Dispositivi e stanze illimitati su tutti i protocolli locali supportati",
          "Zero dipendenza dal cloud: funziona localmente sulla tua LAN",
          "30 comandi NEXUS AI e azioni sui dispositivi al giorno",
          "Automazioni locali pianificate e scene personalizzate",
          "Sincronizzazione account multi-dispositivo (stanze, dispositivi, scene)",
          "100% privato: nessun tracciamento, nessuna raccolta dati"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "al mese",
        "badge": "Più popolare",
        "features": [
          "Tutto nel livello Free, più:",
          "2.000 risposte NEXUS AI al mese invece di 30 al giorno",
          "Chiedi a NEXUS AI di impostare scene e rispondere in linguaggio semplice",
          "Un account, valido su ogni dispositivo NEXUS",
          "Prova gratuita — 3 giorni mensile, 7 giorni annuale; annulla alla fine del periodo"
        ],
        "cta": {
          "label": "Inizia la tua prova gratuita",
          "monthlyLabel": "Inizia la prova gratuita di 3 giorni",
          "yearlyLabel": "Inizia la prova gratuita di 7 giorni",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Famiglia",
        "price": "Gratis",
        "period": "per tutta la famiglia",
        "badge": "Casa intera",
        "features": [
          "Membri della famiglia con accesso basato sui ruoli — nessun limite di membri",
          "Ruoli di proprietario, membro e ospite",
          "Controllo per singolo membro, inviti e permessi delle impostazioni",
          "Scene e automazioni sincronizzate tra i dispositivi sui quali sei autenticato",
          "Attivo in tutto l'ecosistema (desktop e mobile)",
          "Completamente gratuito con la tua casa"
        ],
        "cta": {
          "label": "Inizia con Famiglia",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Annulla in qualsiasi momento dalla pagina Fatturazione nell'app o dal tuo account su questo sito. L'annullamento avrà effetto alla fine del periodo in corso."
  },
  "downloads": {
    "heading": "Nativo su ogni desktop. Come a casa sul tuo telefono.",
    "lead": "Sempre gratuito. Ogni installatore viene fornito con un checksum SHA-256 pubblicato così puoi verificare ciò che installi.",
    "cards": [
      [
        "windows",
        "monitor",
        "Windows",
        "Windows 10/11 · 64-bit",
        "NEXUS-Setup.exe",
        ".exe"
      ],
      [
        "linux",
        "terminal",
        "Linux",
        "Debian e Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK firmato",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Versione",
    "sizeLabel": "Dimensione",
    "webCard": {
      "title": "Un account, in tutto il tuo ecosistema",
      "desc": "Programmi desktop per Windows e Linux e l'app Android. Accedendo, le tue stanze, dispositivi, scene e automazioni rimangono sincronizzati senza problemi tra i tuoi schermi.",
      "cta": {
        "label": "Scarica NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Su Windows il percorso più semplice è il Microsoft Store: il pacchetto è firmato da Microsoft e gli aggiornamenti arrivano tramite lo Store. Il .exe diretto non è firmato, quindi Windows potrebbe avvisare riguardo a un “editore sconosciuto” — vedere le somme di controllo."
  },
  "faq": {
    "heading": "Le domande importanti, risposte.",
    "items": [
      [
        "NEXUS funziona interamente sulla mia rete locale?",
        "Sì. NEXUS è costruito su un'architettura rigorosamente local-first. I tuoi dispositivi, stanze, scene e dati dei sensori vengono elaborati direttamente sull'hardware della tua casa. Anche durante le interruzioni di internet, tutti i controlli locali, l'illuminazione e le automazioni continuano a funzionare senza problemi e senza alcun ritardo. Effettuare l'accesso in modo sicuro sincronizza le impostazioni su tutti i tuoi schermi."
      ],
      [
        "Devo installare NEXUS o funziona nel browser?",
        "Installa il programma desktop (Windows o Linux) o l'app Android. NEXUS non è offerto come app per browser. I comandi del dispositivo passano attraverso la tua rete locale. Shelly, Philips Hue, ESPHome, Tasmota, WLED e Home Assistant utilizzano HTTP locale nel programma desktop e su Android. TP-Link Kasa e Yeelight necessitano di TCP grezzo, quindi funzionano nel programma desktop. Questo sito è per l'account, i download e la fatturazione. Cosa aggiunge il piano NEXUS+?"
      ],
      [
        "What does the NEXUS+ plan add?",
        "Il controllo essenziale della casa intelligente—dispositivi illimitati, stanze, automazioni offline e dashboard locali—è gratuito. NEXUS+ include tutto ciò che offre il piano Free, NEXUS AI per scene e domande in linguaggio naturale, 2.000 risposte al mese, connessioni avanzate per aggiungere dispositivi Home Assistant e un account su ogni dispositivo, con una prova di 3 giorni mensile o 7 giorni annuale. I comandi dei dispositivi continuano a funzionare localmente. I ruoli del nucleo familiare sono inclusi con la tua casa senza costi aggiuntivi."
      ],
      [
        "A quale account appartiene il mio abbonamento NEXUS+?",
        "L'indirizzo email utilizzato al momento del pagamento. Accedi a questo sito o all'app prima di pagare: il checkout si apre con l'email del tuo account già compilata e l'abbonamento appare su tutti i dispositivi su cui accedi. NEXUS+ non può essere acquistato senza un account. Se paghi con un'email diversa, l'abbonamento viene memorizzato sotto quell'email e non apparirà sul tuo account fino a quando non effettuerai l'accesso con essa."
      ],
      [
        "Come vengono eseguite le automazioni e le regole pianificate?",
        "Il motore di automazione NEXUS valuta i tuoi programmi e le regole dei sensori sul dispositivo che continui a far funzionare: l'app desktop rimane nella barra di sistema e opera 24 ore su 24, quindi le routine di illuminazione, energia e sicurezza non devono mai attendere il cloud. Scene e timer attivati dal tuo telefono si applicano istantaneamente tramite la tua LAN. I nuovi eventi si diffondono sui canali di notifica che abiliti nella pagina Notifiche istantanee: la barra in-app, le notifiche di sistema, ntfy, Telegram o il tuo webhook HTTPS personale."
      ],
      [
        "Quali dispositivi ed ecosistemi sono supportati?",
        "NEXUS parla il protocollo locale di ciascun dispositivo: Shelly (Gen1 e Gen2+), Tasmota, WLED, ESPHome, Philips Hue e Home Assistant tramite HTTP locale su ogni piattaforma, oltre a TP-Link Kasa, Yeelight, WiZ, Sonoff (modalità DIY) e Wake-on-LAN tramite la rete locale nell'app desktop, senza account o chiave. Tutto il resto — dispositivi Matter o Zigbee — si collega attraverso il proprio server Home Assistant, che NEXUS tratta come un singolo hub locale. La scoperta degli IP locali abbina i dispositivi istantaneamente, senza alcun cloud del fornitore in mezzo. Come sono integrati le telecamere di sicurezza e i sensori?"
      ],
      [
        "How are security cameras and sensors integrated?",
        "NEXUS consolida le tue telecamere di sicurezza, i rilevatori di movimento e i sensori di ingresso in un cruscotto di sicurezza centralizzato. Puoi automatizzare le modalità di privacy, attivare le routine di sorveglianza quando esci di casa e vedere ogni movimento o evento di contatto nell'app — oltre che sui canali di notifica che abiliti (notifiche di sistema, ntfy, Telegram o il tuo webhook). Posso cancellare NEXUS+ in qualsiasi momento?"
      ],
      [
        "Can I cancel NEXUS+ anytime?",
        "Sì, completamente senza problemi e senza alcun impegno. Puoi cancellare con un solo clic in qualsiasi momento: dalle impostazioni Account e Fatturazione nell'app, attraverso il nostro sito web o direttamente dal link dell'ordine nella tua ricevuta via email. I tuoi benefici premium rimangono attivi fino alla fine del ciclo di fatturazione senza alcun addebito futuro. Posso controllare la mia casa quando sono via?"
      ],
      [
        "Can I control my home when I am away?",
        "Non attraverso un cloud NEXUS: NEXUS comunica direttamente con i tuoi dispositivi sulla rete di casa e non ha alcun relay. Per raggiungerlo dall'esterno, connetti il tuo telefono o laptop alla rete di casa tramite una VPN come Tailscale (router subnet) o WireGuard sul tuo router; NEXUS funziona allora esattamente come a casa. NEXUS non ha ancora un'impostazione per l'indirizzo hub, quindi la VPN deve rendere raggiungibile il tuo intervallo di indirizzi locali, e la scansione per nuovi dispositivi funziona solo sulla rete di casa. Non esporre mai un dispositivo a internet tramite il port forwarding. La guida passo-passo si trova in docs/REMOTE-ACCESS.md nel repository."
      ],
      [
        "Esiste una versione per iPhone?",
        "Non c'è un'app sull'App Store, perché NEXUS non utilizza un account Apple Developer a pagamento. Con un Mac e un ID Apple gratuito puoi compilarla per il tuo iPhone (guida: docs/IOS-BUILD.md), e in una release potrebbe anche essere allegato un IPA non firmato che AltStore o Sideloadly possono firmare per te; quel metodo non è ancora stato verificato su un iPhone reale. Un ID Apple gratuito fa scadere l'app dopo 7 giorni, e le notifiche mentre l'app è chiusa non sono disponibili su iOS. L'hub principale rimane l'app desktop; l'iPhone è un client."
      ],
      [
        "Il mio dispositivo non è nella lista. Cosa posso fare?",
        "NEXUS supporta solo dispositivi con un protocollo locale documentato; i dispositivi solo cloud non sono supportati perché NEXUS non comunica mai con un cloud del fornitore. La lista di compatibilità (docs/COMPATIBILITY.md) include anche Sonoff in modalità DIY, WiZ, LIFX, Govee (LAN) e Wake-on-LAN. Ognuno di questi ha test automatici del protocollo, ma un modello è considerato verificato solo quando qualcuno segnala che ha funzionato su un dispositivo reale. Scrivici tramite il modulo di contatto su questo sito (scegli \"Nuova Richiesta Dispositivo / Connettore\") o via e-mail: indica marca e modello, cosa ti aspettavi e cosa è successo. Segnalare che un modello ha funzionato sul tuo dispositivo reale è ciò che lo rende verificato; non includere mai password, chiavi locali o token."
      ],
      [
        "Ho bisogno di un account? Cosa succede se il server è inattivo?",
        "Sì: accedi una volta con un account email gratuito per aprire NEXUS. Dopodiché, il controllo dei dispositivi e l'esecuzione delle automazioni avvengono sulla tua rete e continuano a funzionare senza internet. L'account aggiunge la sincronizzazione tra i tuoi dispositivi, la Famiglia e l'assistente AI, che utilizzano servizi cloud gratuiti con limiti. Quando uno di questi non è disponibile, per esempio quando il progetto gratuito Supabase è stato sospeso dopo circa una settimana senza attività, le schermate cloud indicano che il server non è raggiungibile invece di mostrare qualcosa come salvato; dispositivi, automazioni e la barra delle applicazioni continuano a funzionare. Se la quota o il servizio AI è esaurito, l'assistente dice che non è stato possibile rispondere."
      ],
      [
        "Posso eseguire il backup delle mie impostazioni e trasferirle su un altro dispositivo?",
        "Sì. Impostazioni ha una sezione di backup dove puoi esportare le tue impostazioni e automazioni in un file JSON e importarlo su un altro dispositivo o dopo una reinstallazione. Password, token e chiavi locali vengono rimossi dall'elenco dei dispositivi abbinati nel file, quindi reinseriscili dopo il ripristino. Mantieni il file di backup privato."
      ],
      [
        "Posso esportare i miei dati energetici?",
        "Sì. La pagina Energia può esportare le ultime letture di potenza reale dai tuoi dispositivi come file CSV o JSON. NEXUS ha dati solo per i dispositivi che effettivamente riportano la potenza; se non ce ne sono collegati, non c'è nulla da esportare. Perché Windows mi avvisa quando eseguo l'installatore?"
      ],
      [
        "Why does Windows warn me when I run the installer?",
        "Installa dallo Store di Microsoft e non vedrai questo avviso: Microsoft firma quel pacchetto durante la certificazione e fornisce aggiornamenti tramite lo Store. Il download diretto del file .exe non è ancora firmato con un certificato commerciale, quindi SmartScreen potrebbe mostrare “editore sconosciuto”. Puoi confrontare il file con le somme di controllo elencate nella sezione download prima di eseguirlo. La nostra politica di firma del codice è collegata nel footer del sito."
      ]
    ]
  },
  "about": {
    "title": "Informazioni su NEXUS",
    "lead": "Una piattaforma per la casa intelligente indipendente, focalizzata prima sul locale, progettata per la velocità, la privacy assoluta e la vera proprietà dell'hardware. Parlando direttamente con i tuoi dispositivi attraverso la tua rete domestica, NEXUS elimina per sempre il vincolo al cloud.",
    "manifesto": {
      "heading": "Perché Abbiamo Creato NEXUS",
      "text": "L'industria moderna delle case intelligenti ha preso una direzione sbagliata. Gli ecosistemi proprietari hanno costretto i proprietari di casa a sottoscrizioni obbligatorie, ritardi dipendenti dal cloud e tracciamento invasivo della telemetria. Quando la connessione a Internet cade, l'interruttore del soggiorno non dovrebbe smettere di funzionare. Abbiamo creato NEXUS perché crediamo che la tua casa sia il tuo santuario: la disposizione delle stanze, lo stato delle tue telecamere e le tue routine familiari giornaliere appartengono esclusivamente al tuo hardware."
    },
    "pillars": [
      {
        "title": "Velocità Local-First",
        "desc": "Ogni automazione e comando viene eseguito sulla tua rete locale in millisecondi. Nessun viaggio di ritorno ai server cloud remoti, zero latenza."
      },
      {
        "title": "Privacy Intransigente",
        "desc": "Nessuna telemetria analitica, nessun profilamento comportamentale e nessuna vendita delle tue abitudini private. È necessario un account; la tua configurazione è memorizzata nella tua riga di account protetta a livello di riga. I comandi dei dispositivi rimangono comunque sulla tua LAN."
      },
      {
        "title": "Nessun Blocco del Fornitore",
        "desc": "Protocolli locali aperti prima: Shelly, Philips Hue, ESPHome, Tasmota e WLED rispondono direttamente a NEXUS, e tutto il resto si collega tramite il tuo server Home Assistant invece di un cloud del fornitore."
      },
      {
        "title": "SaaS Onesto e Sostenibile",
        "desc": "La gestione principale della casa intelligente è completamente gratuita e illimitata per sempre. NEXUS+ è il piano NEXUS AI e aiuta a coprire l'utilizzo del cloud."
      }
    ],
    "architecture": {
      "heading": "Progettato per l'affidabilità",
      "lead": "NEXUS mantiene un motore desktop leggero nella tray del sistema in modo che gli orari e le regole dei sensori vengano valutati mentre il computer è acceso, e l'app mobile si apre direttamente sulla stessa rete locale.",
      "items": [
        {
          "icon": "layers",
          "title": "Desktop",
          "desc": "Le app per Windows, macOS e Linux rimangono nella tray del sistema e continuano a far funzionare gli orari locali e le regole dei sensori mentre il computer è acceso. Windows e Linux vengono distribuiti come installatori pronti; macOS è compilato dal sorgente (non firmato: clic destro → Apri)."
        },
        {
          "icon": "wifi",
          "title": "Telefono",
          "desc": "Le app Android e iOS si aprono sulla stessa rete locale; i comandi dei dispositivi viaggiano ancora attraverso la tua LAN. Android viene fornito come APK firmato; iOS viene compilato dal codice sorgente con Xcode e un ID Apple gratuito."
        },
        {
          "icon": "lock",
          "title": "Account",
          "desc": "È necessario un account affinché stanze, dispositivi e scenari corrispondano su ogni schermo. I comandi dei dispositivi non lasciano la tua rete domestica."
        }
      ]
    },
    "linksTitle": "Link pratici"
  },
  "footer": {
    "tagline": "Controlla l'intera casa intelligente direttamente sulla tua rete locale — senza vincoli da parte dei fornitori e senza dipendenza dal cloud. Anche quando Internet cade, la tua casa non si ferma mai.",
    "product": "Prodotto",
    "productLinks": [
      [
        "Funzionalità",
        "#features"
      ],
      [
        "Prezzi",
        "#pricing"
      ],
      [
        "Download",
        "#downloads"
      ],
      [
        "FAQ",
        "#faq"
      ],
      [
        "Informazioni",
        "/about"
      ]
    ],
    "account": "Assistenza clienti",
    "accountLinks": [
      [
        "Contatti e Supporto Tecnico",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Note di Rilascio e Comunità",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Scarica App",
        "#downloads"
      ]
    ],
    "legal": "Legale",
    "legalLinks": [
      [
        "Privacy",
        "/privacy"
      ],
      [
        "Termini",
        "/terms"
      ],
      [
        "Rimborsi",
        "/refund"
      ],
      [
        "Firma del Codice",
        "/code-signing"
      ],
      [
        "Contribuisci",
        "/contribute"
      ]
    ],
    "rights": "Tutti i diritti riservati.",
    "langSwitchLabel": "Türkçe",
    "langSwitchHref": "/tr/"
  }
};
