import { RELEASES_URL } from "./site-constants.mjs";

export const fr = {
  "title": "NEXUS — Votre maison intelligente, gérée sur votre propre réseau",
  "ogImageAlt": "Écosystème maison intelligente NEXUS sur ordinateur et mobile",
  "description": "NEXUS est un écosystème de maison intelligente local pour Windows, macOS, Linux, Android et iOS. Contrôle direct des appareils sur votre propre réseau local, automatisations réactives et mesures d'énergie en temps réel. Gratuit pour toujours ; plan NEXUS+ optionnel.",
  "nav": [
    [
      "#features",
      "Fonctionnalités"
    ],
    [
      "#how",
      "Comment ça fonctionne"
    ],
    [
      "#integrations",
      "Intégrations"
    ],
    [
      "#pricing",
      "Tarifs"
    ],
    [
      "#downloads",
      "Télécharger"
    ],
    [
      "#faq",
      "Maison intelligente locale"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Maison intelligente locale",
    "h1a": "Votre maison.",
    "h1b": "Sous votre contrôle en toute discrétion.",
    "lead": "Un écosystème unifié pour vos lumières, votre climat, vos stores et vos capteurs — communiquant directement avec les appareils sur votre propre réseau local. Automatisations réactives, mesure de puissance en temps réel et contrôle qui continue de fonctionner lorsque Internet est coupé.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Dernière version",
    "shotAlt": "Interface NEXUS et centre de contrôle",
    "trust": [
      "Gratuit, appareils illimités",
      "Aucun cloud requis pour le contrôle",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Infrastructure puissante. Contrôle sans effort.",
    "lead": "Chaque état d'appareil, métrique de puissance et scène automatisée fonctionne directement sur votre réseau local sans dépendances cloud externes.",
    "items": [
      [
        "zap",
        "Automatisations réactives",
        "Les scénarios déclenchés par l'heure et le coucher du soleil s'exécutent directement sur votre matériel local — continuant de manière fiable en arrière-plan sur le bureau."
      ],
      [
        "gauge",
        "Lectures d'énergie en temps réel",
        "Lisez la puissance et la consommation en temps réel directement depuis les prises et interrupteurs intelligents pris en charge sur votre réseau local."
      ],
      [
        "wifi",
        "Vitesse du réseau local",
        "Communication directe LAN via HTTP, TCP et UDP avec les marques listées sous Intégrations. Aucun passage par le cloud dans le chemin de commande."
      ],
      [
        "lock",
        "Confidentialité dès la conception",
        "La configuration de votre maison et la télémétrie des appareils restent sur votre matériel local. Un compte est requis pour utiliser NEXUS ; il stocke votre configuration dans votre propre ligne sous contrôle d'accès au niveau des lignes. Les commandes des appareils passent toujours par votre LAN."
      ],
      [
        "sparkles",
        "NEXUS AI Intelligence",
        "Les commandes locales de la maison intelligente sont instantanées et gratuites pour toujours. L'assistant AI optionnel dans le cloud fournit des suggestions intelligentes chaque fois que vous avez besoin de conseils."
      ],
      [
        "layers",
        "Protocoles locaux ouverts",
        "Les connecteurs directs communiquent sur votre LAN. Matter et Zigbee se connectent via votre propre serveur Home Assistant — la section Intégrations indique ce qui est direct et ce qui est relayé."
      ]
    ]
  },
  "how": {
    "heading": "Du téléchargement à la connexion en quelques minutes.",
    "steps": [
      [
        "1",
        "Installez et ouvrez",
        "Téléchargez l'installateur natif pour votre plateforme (Windows, Linux ou Android). Ensuite, connectez-vous — un compte est nécessaire pour utiliser NEXUS, et il synchronise également la configuration sur vos écrans."
      ],
      [
        "2",
        "Ajoutez vos appareils",
        "Choisissez votre marque, scannez le réseau local ou saisissez une IP. Les marques avec un connecteur direct utilisent leur propre protocole — aucun cloud fournisseur dans ce chemin."
      ],
      [
        "3",
        "Vivez votre maison",
        "Scènes, automations programmées et relevés d'énergie réels — contrôle unifié sur ordinateur et mobile."
      ]
    ]
  },
  "integrations": {
    "heading": "Compatible avec ce que vous possédez déjà.",
    "lead": "Protocoles locaux gratuits en premier. Tout ce qui n'a pas de connecteur direct fonctionne toujours via le pont Home Assistant.",
    "groups": [
      [
        "HTTP local — sur toutes les plateformes",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Pont Philips Hue",
          "Home Assistant"
        ]
      ],
      [
        "Réseau local, sans compte ni clé — application de bureau",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (mode DIY)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Quelque chose manque ? Demandez un connecteur",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Gratuit à utiliser. NEXUS+ lorsque vous voulez plus",
    "lead": "",
    "currencyNote": "Prix en USD",
    "plans": [
      {
        "name": "Gratuit",
        "price": "$0",
        "period": "forever",
        "features": [
          "Nombre illimité d'appareils et de pièces sur tous les protocoles locaux pris en charge",
          "Zéro dépendance au cloud : fonctionne localement sur votre propre LAN",
          "30 commandes NEXUS AI quotidiennes et actions sur les appareils",
          "Automatisations locales programmées et scènes personnalisées",
          "Synchronisation de compte multi-appareils (pièces, appareils, scènes)",
          "100% privé : pas de suivi, pas de collecte de données"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "par mois",
        "badge": "Le plus populaire",
        "features": [
          "Tout ce qui est inclus dans le niveau Gratuit, plus :",
          "2 000 réponses NEXUS AI par mois au lieu de 30 par jour",
          "Demandez à NEXUS AI de configurer des scènes et de répondre en langage courant",
          "Un compte, valable sur tous les appareils NEXUS",
          "Essai gratuit — 3 jours mensuel, 7 jours annuel ; annulation à la fin de la période"
        ],
        "cta": {
          "label": "Commencez votre essai gratuit",
          "monthlyLabel": "Commencez l'essai gratuit de 3 jours",
          "yearlyLabel": "Commencez l'essai gratuit de 7 jours",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Famille",
        "price": "Gratuit",
        "period": "pour toute la famille",
        "badge": "Toute la maison",
        "features": [
          "Membres du foyer avec accès basé sur les rôles — pas de limite de membres",
          "Rôles propriétaire, membre et invité",
          "Contrôle, invitation et autorisations des paramètres par membre",
          "Les scènes et automatisations se synchronisent sur vos propres appareils connectés",
          "Actif sur l'ensemble de l'écosystème (ordinateur et mobile)",
          "Complètement gratuit avec votre foyer"
        ],
        "cta": {
          "label": "Commencez avec Famille",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Annulez à tout moment depuis la facturation dans l'application ou depuis votre compte sur ce site. L'annulation prend effet à la fin de la période en cours."
  },
  "downloads": {
    "heading": "Natifs sur tous les ordinateurs de bureau. Comme à la maison sur votre téléphone.",
    "lead": "Toujours gratuit. Chaque installateur est livré avec un checksum SHA-256 publié afin que vous puissiez vérifier ce que vous installez.",
    "cards": [
      [
        "windows",
        "monitor",
        "Windows",
        "Windows 10/11 · 64 bits",
        "NEXUS-Setup.exe",
        ".exe"
      ],
      [
        "linux",
        "terminal",
        "Linux",
        "Debian et Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK signé",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Version",
    "sizeLabel": "Taille",
    "webCard": {
      "title": "Un compte, sur l'ensemble de votre écosystème",
      "desc": "Programmes de bureau Windows et Linux et application Android. Connecté, vos pièces, appareils, scènes et automatisations restent parfaitement synchronisés sur tous vos écrans.",
      "cta": {
        "label": "Télécharger NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Sur Windows, la voie la plus facile est le Microsoft Store : le package est signé par Microsoft et les mises à jour passent par le Store. Le .exe direct n'est pas signé, donc Windows peut avertir d’un « éditeur inconnu » — voir les sommes de contrôle. Les questions importantes, répondues. Est-ce que NEXUS fonctionne entièrement sur mon réseau local ?"
  },
  "faq": {
    "heading": "The important questions, answered.",
    "items": [
      [
        "Does NEXUS operate entirely on my local network?",
        "Oui. NEXUS est construit sur une architecture locale stricte. Vos appareils, pièces, scènes et télémétrie des capteurs sont traités directement par votre propre matériel domestique. Même en cas de coupure d'internet, tous les contrôles locaux, l'éclairage et les automatisations continuent de fonctionner sans interruption et sans latence. Se connecter de manière sécurisée synchronise vos paramètres sur tous vos écrans. Dois-je installer NEXUS ou fonctionne-t-il dans le navigateur ?"
      ],
      [
        "Do I need to install NEXUS, or does it run in the browser?",
        "Installez le programme de bureau (Windows ou Linux) ou l'application Android. NEXUS n'est pas proposé en tant qu'application pour navigateur. Les commandes des appareils passent par votre propre réseau local. Shelly, Philips Hue, ESPHome, Tasmota, WLED et Home Assistant utilisent le HTTP local dans le programme de bureau et sur Android. TP-Link Kasa et Yeelight nécessitent le TCP brut, donc ils fonctionnent dans le programme de bureau. Ce site est destiné au compte, aux téléchargements et à la facturation. Qu'apporte le plan NEXUS+ ?"
      ],
      [
        "What does the NEXUS+ plan add?",
        "Le contrôle intelligent essentiel de la maison—appareils illimités, pièces, automatisations hors ligne et tableaux de bord locaux—est gratuit. NEXUS+ inclut tout ce qui est dans la version gratuite, NEXUS AI pour les scènes et questions en langage simple, 2 000 réponses par mois, des connexions avancées pour ajouter des appareils Home Assistant, et un compte sur chaque appareil, avec un essai de 3 jours par mois ou de 7 jours par an. Les commandes des appareils fonctionnent toujours localement. Les rôles au sein du foyer sont inclus avec votre maison sans coût supplémentaire."
      ],
      [
        "À quel compte appartient mon abonnement NEXUS+ ?",
        "L'adresse e-mail utilisée lors du paiement. Connectez-vous sur ce site ou dans l'application avant de payer : le paiement s'ouvre alors avec l'e-mail de votre compte rempli, et l'abonnement apparaît sur tous les appareils sur lesquels vous vous connectez. NEXUS+ ne peut pas être acheté sans compte. Si vous payez avec une adresse e-mail différente, l'abonnement est enregistré sous cette adresse e-mail et n'apparaîtra pas sur votre compte tant que vous ne vous y êtes pas connecté."
      ],
      [
        "Comment les automatisations et les règles programmées s'exécutent-elles ?",
        "Le moteur d'automatisation NEXUS évalue vos horaires et règles de capteurs sur l'appareil que vous gardez en fonctionnement — l'application de bureau reste dans la barre système et s'exécute en continu, de sorte que les routines d'éclairage, d'énergie et de sécurité n'attendent jamais un cloud. Les scènes et minuteries déclenchées depuis votre téléphone s'appliquent instantanément sur votre LAN. Les nouveaux événements se propagent aux canaux de notification que vous activez sur la page Notifications instantanées : le bandeau dans l'application, les notifications système, ntfy, Telegram ou votre propre webhook HTTPS."
      ],
      [
        "Quels appareils et écosystèmes sont pris en charge ?",
        "NEXUS communique avec le protocole local de chaque appareil : Shelly (Gen1 et Gen2+), Tasmota, WLED, ESPHome, Philips Hue et Home Assistant via HTTP local sur toutes les plateformes, ainsi que TP-Link Kasa, Yeelight, WiZ, Sonoff (mode DIY) et Wake-on-LAN sur le réseau local dans l'application de bureau, sans compte ni clé. Tout le reste — appareils Matter ou Zigbee — se connecte via votre propre serveur Home Assistant, que NEXUS considère comme un seul hub local. La découverte IP locale permet d'apparier les appareils instantanément, sans passer par le cloud du fabricant. Comment les caméras de sécurité et les capteurs sont-ils intégrés ?"
      ],
      [
        "How are security cameras and sensors integrated?",
        "NEXUS centralise vos caméras de sécurité, détecteurs de mouvement et capteurs d'entrée dans un tableau de bord de sécurité centralisé. Vous pouvez automatiser les modes de confidentialité, activer les routines de surveillance en quittant la maison et voir chaque mouvement ou événement de contact dans l'application — ainsi que sur les canaux de notification que vous activez (notifications système, ntfy, Telegram ou votre propre webhook). Puis-je annuler NEXUS+ à tout moment ?"
      ],
      [
        "Can I cancel NEXUS+ anytime?",
        "Oui, entièrement sans tracas et sans aucun engagement. Vous pouvez annuler en un clic à tout moment : depuis les paramètres de compte et de facturation dans l'application, via notre site Web, ou directement depuis le lien de commande dans votre reçu de facturation par email. Vos avantages premium restent actifs jusqu'à la fin de votre cycle de facturation sans frais futurs."
      ],
      [
        "Puis-je contrôler ma maison lorsque je suis absent ?",
        "Pas par un cloud NEXUS : NEXUS communique directement avec vos appareils sur votre réseau domestique et n'a pas de relais. Pour y accéder depuis l'extérieur, mettez votre téléphone ou ordinateur portable sur le réseau domestique avec un VPN tel que Tailscale (routeur de sous-réseau) ou WireGuard sur votre routeur ; NEXUS fonctionne alors exactement comme à la maison. NEXUS n'a pas encore de réglage d'adresse de hub, donc le VPN doit rendre votre plage d'adresses locale accessible, et la recherche de nouveaux appareils ne fonctionne que sur le réseau domestique. Ne jamais exposer un appareil à Internet avec le transfert de port. Le guide étape par étape se trouve dans docs/REMOTE-ACCESS.md du dépôt."
      ],
      [
        "Y a-t-il une version pour iPhone ?",
        "Il n'y a pas d'application sur l'App Store, car NEXUS n'utilise pas de compte développeur Apple payant. Avec un Mac et un identifiant Apple gratuit, vous pouvez la compiler pour votre propre iPhone (guide : docs/IOS-BUILD.md), et une version publiée peut également joindre un IPA non signé que AltStore ou Sideloadly peuvent signer pour vous ; ce chemin n'a pas encore été vérifié sur un vrai iPhone. Un identifiant Apple gratuit fait expirer l'application après 7 jours, et les notifications lorsque l'application est fermée ne sont pas disponibles sur iOS. Le hub principal reste l'application de bureau ; l'iPhone est un client."
      ],
      [
        "Mon appareil n'est pas sur la liste. Que puis-je faire ?",
        "NEXUS ne prend en charge que les appareils disposant d’un protocole local documenté ; les appareils uniquement cloud ne sont pas pris en charge car NEXUS ne communique jamais avec un cloud de fournisseur. La liste de compatibilité (docs/COMPATIBILITY.md) inclut également Sonoff en mode DIY, WiZ, LIFX, Govee (LAN) et Wake-on-LAN. Chacun de ces appareils dispose de tests de protocole automatisés, mais un modèle est considéré comme vérifié uniquement lorsqu’une personne rapporte qu’il a fonctionné sur un appareil réel. Écrivez-nous via le formulaire de contact sur ce site (choisissez « New Device / Connector Request ») ou par e-mail : indiquez la marque et le modèle, ce que vous attendiez et ce qui s’est passé. Nous considérerons un modèle comme vérifié seulement lorsque vous nous aurez indiqué qu’il a fonctionné sur votre appareil réel ; n’incluez jamais de mots de passe, de clés locales ou de jetons."
      ],
      [
        "Ai-je besoin d'un compte ? Que se passe-t-il si le serveur est en panne ?",
        "Oui : vous vous connectez une fois avec un compte e-mail gratuit pour ouvrir NEXUS. Après cela, le contrôle des appareils et l'exécution des automatisations se font sur votre propre réseau et continuent de fonctionner sans Internet. Le compte ajoute la synchronisation entre vos appareils, la Famille et l'assistant IA, qui utilisent des services cloud gratuits avec des limites. Lorsqu'un de ces services n'est pas disponible, par exemple lorsque le projet Supabase gratuit a été mis en pause après environ une semaine d'inactivité, les écrans cloud indiquent que le serveur est inaccessible au lieu de montrer quelque chose comme sauvegardé ; les appareils, les automatisations et la barre de tâches continuent de fonctionner. Si le quota ou le service de l'IA est épuisé, l'assistant indique qu'il n'a pas pu répondre."
      ],
      [
        "Puis-je sauvegarder mes paramètres et les transférer sur un autre appareil ?",
        "Oui. Les paramètres disposent d'une section de sauvegarde où vous pouvez exporter vos paramètres et automatisations dans un fichier JSON et les importer sur un autre appareil ou après une réinstallation. Les mots de passe, jetons et clés locales sont supprimés de la liste des appareils appairés dans le fichier, il faut donc les ressaisir après la restauration. Gardez le fichier de sauvegarde privé."
      ],
      [
        "Puis-je exporter mes données énergétiques ?",
        "Oui. La page Énergie peut exporter les dernières lectures de puissance réelle de vos appareils sous forme de fichier CSV ou JSON. NEXUS ne dispose que des données des appareils qui rapportent réellement de l'énergie ; sans aucun appareil appairé, il n'y a rien à exporter."
      ],
      [
        "Pourquoi Windows me prévient-il lorsque j’exécute le programme d’installation ?",
        "Installez depuis le Microsoft Store et vous ne verrez pas cet avertissement : Microsoft signe ce paquet lors de la certification et fournit les mises à jour via le Store. Le téléchargement direct du .exe n'est pas encore signé avec un certificat commercial, donc SmartScreen peut afficher « éditeur inconnu ». Vous pouvez comparer le fichier avec les sommes de contrôle listées dans la section téléchargements avant de l'exécuter. Notre politique de signature de code est liée depuis le pied de page du site."
      ]
    ]
  },
  "about": {
    "title": "À propos de NEXUS",
    "lead": "Une plateforme domotique indépendante, axée sur le local, conçue pour la rapidité, la confidentialité absolue et la véritable propriété du matériel. En communiquant directement avec vos appareils via votre propre réseau domestique, NEXUS élimine définitivement la dépendance au cloud. Pourquoi nous avons créé NEXUS",
    "manifesto": {
      "heading": "Why We Built NEXUS",
      "text": "L'industrie moderne de la maison intelligente a pris une mauvaise direction. Les écosystèmes propriétaires ont imposé aux propriétaires des abonnements obligatoires, des retards dépendant du cloud et une surveillance invasive. Lorsque votre connexion Internet tombe en panne, votre interrupteur de salon ne devrait pas cesser de fonctionner. Nous avons créé NEXUS parce que nous croyons que votre maison est votre sanctuaire : votre plan d'étage, l'état de vos caméras et vos routines familiales quotidiennes appartiennent strictement à votre propre matériel."
    },
    "pillars": [
      {
        "title": "Vitesse locale avant tout",
        "desc": "Chaque automatisation et commande s'exécute sur votre réseau local en millisecondes. Pas de trajets aller-retour vers des serveurs cloud distants, zéro latence."
      },
      {
        "title": "Confidentialité sans compromis",
        "desc": "Pas de télémétrie analytique, pas de profilage comportemental, et aucune vente de vos routines privées. Un compte est requis ; votre configuration est stockée dans la ligne de compte protégée au niveau de la ligne de votre propre compte. Les commandes des appareils restent toujours sur votre réseau local."
      },
      {
        "title": "Pas de verrouillage fournisseur",
        "desc": "Protocoles locaux ouverts en priorité : Shelly, Philips Hue, ESPHome, Tasmota et WLED répondent directement à NEXUS, et tout le reste se connecte via votre propre serveur Home Assistant plutôt que le cloud d’un fournisseur."
      },
      {
        "title": "SaaS honnête et durable",
        "desc": "La gestion principale de la maison intelligente est complètement gratuite et illimitée pour toujours. NEXUS+ est le plan NEXUS AI et aide à couvrir cette utilisation du cloud."
      }
    ],
    "architecture": {
      "heading": "Conçu pour la fiabilité",
      "lead": "NEXUS maintient un moteur léger sur le bureau dans votre barre des tâches afin que les horaires et les règles des capteurs continuent de s'exécuter tant que votre ordinateur est allumé, et l'application mobile s'ouvre directement sur le même réseau local.",
      "items": [
        {
          "icon": "layers",
          "title": "Bureau",
          "desc": "Les applications Windows, macOS et Linux restent dans la barre des tâches et continuent d'exécuter les horaires locaux et les règles des capteurs pendant que l'ordinateur est allumé. Windows et Linux sont fournis sous forme d'installateurs prêts à l'emploi ; macOS est construit à partir du code source (non signé : clic droit → Ouvrir)."
        },
        {
          "icon": "wifi",
          "title": "Téléphone",
          "desc": "Les applications Android et iOS s'ouvrent sur le même réseau local ; les commandes des appareils passent toujours par votre LAN. Android est fourni sous forme d’APK signé ; iOS est construit à partir du code source avec Xcode et un identifiant Apple gratuit."
        },
        {
          "icon": "lock",
          "title": "Compte",
          "desc": "Un compte est requis afin que les pièces, les appareils et les scènes correspondent sur chaque écran. Les commandes des appareils ne quittent pas votre réseau domestique."
        }
      ]
    },
    "linksTitle": "Liens pratiques"
  },
  "footer": {
    "tagline": "Contrôlez toute votre maison intelligente directement via votre réseau local — sans dépendance à un fournisseur et sans cloud. Même lorsque l’internet tombe en panne, votre maison ne s’arrête jamais.",
    "product": "Produit",
    "productLinks": [
      [
        "Fonctionnalités",
        "#features"
      ],
      [
        "Tarifs",
        "#pricing"
      ],
      [
        "Téléchargement",
        "#downloads"
      ],
      [
        "FAQ",
        "#faq"
      ],
      [
        "À propos",
        "/about"
      ]
    ],
    "account": "Service client & Support",
    "accountLinks": [
      [
        "Contact & Support technique",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Notes de version & Communauté",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Télécharger des applications",
        "#downloads"
      ]
    ],
    "legal": "Juridique",
    "legalLinks": [
      [
        "Confidentialité",
        "/privacy"
      ],
      [
        "Conditions",
        "/terms"
      ],
      [
        "Remboursements",
        "/refund"
      ],
      [
        "Signature de code",
        "/code-signing"
      ],
      [
        "Contribuer",
        "/contribute"
      ]
    ],
    "rights": "Tous droits réservés.",
    "langSwitchLabel": "Türkçe",
    "langSwitchHref": "/tr/"
  }
};
