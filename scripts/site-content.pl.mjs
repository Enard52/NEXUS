import { RELEASES_URL } from "./site-constants.mjs";

export const pl = {
  "title": "NEXUS — Twój inteligentny dom, zarządzany w Twojej własnej sieci",
  "ogImageAlt": "Ekosystem inteligentnego domu NEXUS na komputerach i urządzeniach mobilnych",
  "description": "NEXUS to ekosystem inteligentnego domu oparty przede wszystkim na lokalnej sieci dla systemów Windows, macOS, Linux, Android i iOS. Bezpośrednia kontrola urządzeń w Twojej własnej sieci lokalnej, responsywne automatyzacje i bieżące wskaźniki zużycia energii. Bezpłatnie na zawsze; opcjonalny plan NEXUS+.",
  "nav": [
    [
      "#features",
      "Funkcje"
    ],
    [
      "#how",
      "Jak to działa"
    ],
    [
      "#integrations",
      "Integracje"
    ],
    [
      "#pricing",
      "Cennik"
    ],
    [
      "#downloads",
      "Pobierz"
    ],
    [
      "#faq",
      "FAQ"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Inteligentny dom oparty na lokalnej sieci",
    "h1a": "Twój dom.",
    "h1b": "Cicho pod Twoją kontrolą.",
    "lead": "Jednolity ekosystem dla Twojego oświetlenia, klimatu, osłon i czujników — komunikujący się bezpośrednio z urządzeniami w Twojej lokalnej sieci. Reaktywne automatyzacje, pomiar zużycia energii na żywo i kontrola, która działa nawet gdy internet przestaje działać.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Najnowsza wersja",
    "shotAlt": "Interfejs NEXUS i centrum kontrolne",
    "trust": [
      "Bezpłatne, nieograniczone urządzenia",
      "Do kontroli nie jest potrzebna chmura",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Potężna infrastruktura. Bezproblemowa kontrola.",
    "lead": "Każdy stan urządzenia, wskaźnik zużycia energii i zautomatyzowana scena działa bezpośrednio w Twojej lokalnej sieci bez zależności od zewnętrznej chmury.",
    "items": [
      [
        "zap",
        "Reaktywne automatyzacje",
        "Scenariusze wyzwalane czasem i zachodem słońca wykonują się bezpośrednio na Twoim lokalnym sprzęcie — kontynuując niezawodnie w tle na komputerze stacjonarnym."
      ],
      [
        "gauge",
        "Odczyty energii na żywo",
        "Odczytuj w czasie rzeczywistym moc i zużycie energii bezpośrednio z obsługiwanych inteligentnych gniazdek i wyłączników w swojej lokalnej sieci."
      ],
      [
        "wifi",
        "Szybkość sieci lokalnej",
        "Bezpośrednia komunikacja LAN przez HTTP, TCP i UDP z markami wymienionymi w Integracjach. Brak pośrednictwa chmury w ścieżce poleceń."
      ],
      [
        "lock",
        "Prywatność wbudowana w projekt",
        "Konfiguracja domu i telemetria urządzeń pozostają na Twoim lokalnym sprzęcie. Konto jest wymagane do korzystania z NEXUS; przechowuje ono Twoją konfigurację w Twoim własnym wierszu z kontrolą dostępu na poziomie wiersza. Polecenia urządzeń nadal przechodzą przez Twoją sieć LAN."
      ],
      [
        "sparkles",
        "NEXUS AI Intelligence",
        "Lokalne polecenia smart home są natychmiastowe i zawsze darmowe. Opcjonalny asystent AI w chmurze zapewnia inteligentne sugestie zawsze, gdy potrzebujesz wskazówek."
      ],
      [
        "layers",
        "Otwórz Lokalne Protokoły",
        "Bezpośrednie złącza komunikują się w Twojej sieci LAN. Matter i Zigbee łączą się przez Twój własny serwer Home Assistant — sekcja Integracje pokazuje, co jest bezpośrednie, a co mostkowane."
      ]
    ]
  },
  "how": {
    "heading": "Od pobrania do połączenia w kilka minut.",
    "steps": [
      [
        "1",
        "Zainstaluj i otwórz",
        "Pobierz rodzimy instalator dla swojej platformy (Windows, Linux lub Android). Następnie zaloguj się — konto jest wymagane do korzystania z NEXUS, a także synchronizuje ustawienia między twoimi ekranami."
      ],
      [
        "2",
        "Dodaj swoje urządzenia",
        "Wybierz swoją markę, zeskanuj lokalną sieć lub wprowadź adres IP. Marki z bezpośrednim łącznikiem używają własnego protokołu — bez chmury dostawcy na tej ścieżce."
      ],
      [
        "3",
        "Ciesz się swoim domem",
        "Sceny, zaplanowane automatyzacje i rzeczywiste odczyty energii — zunifikowana kontrola na komputerze i urządzeniach mobilnych."
      ]
    ]
  },
  "integrations": {
    "heading": "Działa z tym, co już masz.",
    "lead": "Najpierw darmowe protokoły lokalne. Wszystko, co nie ma bezpośredniego łącznika, nadal działa przez mostek Home Assistant.",
    "groups": [
      [
        "Lokalny HTTP — na każdej platformie",
        [
          "Shelly Gen1 i Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Mostek Philips Hue",
          "Home Assistant"
        ]
      ],
      [
        "Lokalna sieć, bez konta lub klucza — aplikacja na komputer",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (tryb DIY)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Brakuje czegoś? Poproś o łącznik",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Bezpłatne w użyciu. NEXUS+, gdy chcesz więcej",
    "lead": "",
    "currencyNote": "Ceny w USD",
    "plans": [
      {
        "name": "Darmowe",
        "price": "$0",
        "period": "forever",
        "features": [
          "Nieograniczona liczba urządzeń i pokoi w każdym obsługiwanym lokalnym protokole",
          "Zero zależności od chmury: działa lokalnie w Twojej sieci LAN",
          "30 codziennych poleceń NEXUS AI i działań urządzeń",
          "Zaplanowane lokalne automatyzacje i niestandardowe sceny",
          "Synchronizacja konta między wieloma urządzeniami (pokoje, urządzenia, sceny)",
          "100% prywatne: brak śledzenia, brak zbierania danych"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "za miesiąc",
        "badge": "Najbardziej popularne",
        "features": [
          "Wszystko z darmowego planu, plus:",
          "2 000 odpowiedzi NEXUS AI miesięcznie zamiast 30 dziennie",
          "Poproś NEXUS AI o ustawienie scen i odpowiedzi w prostym języku",
          "Jedno konto, ważne na każdym urządzeniu NEXUS",
          "Bezpłatna wersja próbna — 3 dni miesięcznie, 7 dni rocznie; anuluj po zakończeniu okresu"
        ],
        "cta": {
          "label": "Rozpocznij bezpłatną wersję próbną",
          "monthlyLabel": "Rozpocznij 3-dniową bezpłatną wersję próbną",
          "yearlyLabel": "Rozpocznij 7-dniową bezpłatną wersję próbną",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Rodzina",
        "price": "Darmowy",
        "period": "dla całej rodziny",
        "badge": "Cały dom",
        "features": [
          "Członkowie gospodarstwa domowego z dostępem opartym na rolach — brak limitu członków",
          "Role właściciela, członka i gościa",
          "Kontrola, zapraszanie i uprawnienia ustawień dla każdego członka",
          "Sceny i automatyzacje synchronizują się na wszystkich urządzeniach, na których jesteś zalogowany",
          "Aktywne w całym ekosystemie (komputer i urządzenia mobilne)",
          "Całkowicie darmowe w Twoim domu"
        ],
        "cta": {
          "label": "Zacznij od Rodziny",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Anuluj w dowolnym momencie w Ustawieniach płatności w aplikacji lub na swoim koncie na tej stronie. Anulowanie wchodzi w życie na koniec bieżącego okresu."
  },
  "downloads": {
    "heading": "Natychmiastowo na każdym komputerze. W domu na Twoim telefonie.",
    "lead": "Zawsze darmowe. Każdy instalator posiada opublikowany sumę kontrolną SHA-256, dzięki czemu możesz zweryfikować to, co instalujesz.",
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
        "Debian i Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · podpisany APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Wersja",
    "sizeLabel": "Rozmiar",
    "webCard": {
      "title": "Jedno konto, w całym Twoim ekosystemie",
      "desc": "Programy desktopowe Windows i Linux oraz aplikacja na Androida. Po zalogowaniu, Twoje pokoje, urządzenia, sceny i automatyzacje pozostają płynnie zsynchronizowane na wszystkich ekranach.",
      "cta": {
        "label": "Pobierz NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Na Windows najprostszą drogą jest Microsoft Store: pakiet jest podpisany przez Microsoft i aktualizacje przychodzą przez Store. Bezpośredni plik .exe nie jest podpisany, więc Windows może ostrzegać o „nieznanym wydawcy” — zobacz sumy kontrolne."
  },
  "faq": {
    "heading": "Ważne pytania, odpowiedzi.",
    "items": [
      [
        "Czy NEXUS działa całkowicie w mojej sieci lokalnej?",
        "Tak. NEXUS jest zbudowany na rygorystycznej architekturze lokalnej. Twoje urządzenia, pokoje, sceny i dane telemetryczne z czujników są przetwarzane bezpośrednio na Twoim własnym sprzęcie domowym. Nawet podczas przerw w dostępie do internetu wszystkie lokalne sterowania, oświetlenie i automatyzacje działają płynnie, bez opóźnień. Bezpieczne logowanie synchronizuje Twoje ustawienia na wszystkich ekranach."
      ],
      [
        "Czy muszę instalować NEXUS, czy działa on w przeglądarce?",
        "Zainstaluj program na komputer (Windows lub Linux) lub aplikację na Androida. NEXUS nie jest oferowany jako aplikacja przeglądarkowa. Polecenia urządzeń są przesyłane przez Twoją lokalną sieć. Shelly, Philips Hue, ESPHome, Tasmota, WLED i Home Assistant korzystają z lokalnego HTTP w programie na komputer oraz na Androidzie. TP-Link Kasa i Yeelight wymagają surowego TCP, więc działają w programie na komputer. Ta strona służy do zarządzania kontem, pobierania plików i rozliczeń. Co dodaje plan NEXUS+?"
      ],
      [
        "What does the NEXUS+ plan add?",
        "Podstawowa kontrola inteligentnego domu — nieograniczona liczba urządzeń, pokoi, automatyzacji offline i lokalnych pulpitów — jest bezpłatna. NEXUS+ zawiera wszystko w wersji Free, NEXUS AI do scen i pytań w języku naturalnym, 2000 odpowiedzi miesięcznie, zaawansowane połączenia do dodawania urządzeń Home Assistant oraz jedno konto na każdym urządzeniu, z 3-dniową wersją próbną miesięczną lub 7-dniową wersją próbną roczną. Polecenia urządzeń nadal działają lokalnie. Role w gospodarstwie domowym są wliczone w cenę Twojego domu bez dodatkowych kosztów."
      ],
      [
        "Do którego konta należy moje subskrypcja NEXUS+?",
        "Adres e-mail użyty przy finalizacji zakupu. Zaloguj się na tej stronie lub w aplikacji przed dokonaniem płatności: wtedy ekran finalizacji zakupu otwiera się z wypełnionym adresem e-mail twojego konta, a subskrypcja pojawia się na każdym urządzeniu, na którym się zalogujesz. NEXUS+ nie można kupić bez konta. Jeśli zapłacisz innym adresem e-mail, subskrypcja zostanie przypisana do tego adresu i nie pojawi się na twoim koncie, dopóki się nim nie zalogujesz."
      ],
      [
        "Jak działają automatyzacje i zaplanowane reguły?",
        "Silnik automatyzacji NEXUS ocenia Twoje harmonogramy i zasady dotyczące czujników na urządzeniu, które cały czas działa — aplikacja desktopowa pozostaje w zasobniku systemowym i działa przez całą dobę, dzięki czemu rutyny dotyczące oświetlenia, energii i bezpieczeństwa nigdy nie czekają na chmurę. Sceny i timery wywoływane z telefonu działają natychmiast w Twojej sieci LAN. Nowe zdarzenia rozprzestrzeniają się na kanały powiadomień, które włączysz na stronie Natychmiastowych Powiadomień: pasek w aplikacji, powiadomienia systemowe, ntfy, Telegram lub własny webhook HTTPS. Jakie urządzenia i ekosystemy są obsługiwane?"
      ],
      [
        "Which devices and ecosystems are supported?",
        "NEXUS obsługuje lokalny protokół każdego urządzenia: Shelly (Gen1 i Gen2+), Tasmota, WLED, ESPHome, Philips Hue i Home Assistant przez lokalny HTTP na każdej platformie, a także TP-Link Kasa, Yeelight, WiZ, Sonoff (tryb DIY) i Wake-on-LAN przez lokalną sieć w aplikacji desktopowej, bez konta ani klucza. Wszystkie inne urządzenia — Matter lub Zigbee — łączą się przez Twój własny serwer Home Assistant, który NEXUS traktuje jako jeden lokalny hub. Lokalna detekcja IP łączy urządzenia natychmiast, bez pośrednictwa chmury dostawcy. Jak zintegrowane są kamery bezpieczeństwa i czujniki?"
      ],
      [
        "How are security cameras and sensors integrated?",
        "NEXUS konsoliduje twoje kamery bezpieczeństwa, czujniki ruchu i czujniki wejściowe w centralnym panelu bezpieczeństwa. Możesz automatyzować tryby prywatności, włączać rutyny nadzoru podczas wychodzenia z domu i zobaczyć każdy ruch lub zdarzenie kontaktowe w aplikacji — a także na kanałach powiadomień, które włączysz (powiadomienia systemowe, ntfy, Telegram lub własny webhook)."
      ],
      [
        "Czy mogę anulować NEXUS+ w dowolnym momencie?",
        "Tak, całkowicie bezproblemowo, bez żadnych zobowiązań. Możesz anulować jednym kliknięciem w dowolnym momencie: z ustawień Konta i Rozliczeń w aplikacji, przez naszą stronę internetową lub bezpośrednio z linku zamówienia w wiadomości e-mail z potwierdzeniem płatności. Twoje korzyści premium pozostają aktywne do końca cyklu rozliczeniowego bez żadnych przyszłych opłat."
      ],
      [
        "Czy mogę sterować moim domem, gdy mnie nie ma?",
        "Nie przez chmurę NEXUS: NEXUS komunikuje się z Twoimi urządzeniami bezpośrednio w Twojej sieci domowej i nie korzysta z przekaźnika. Aby uzyskać do niego dostęp z zewnątrz, podłącz telefon lub laptop do sieci domowej przy użyciu VPN, takiego jak Tailscale (router podsieci) lub WireGuard na routerze; NEXUS wtedy działa dokładnie tak samo jak w domu. NEXUS nie ma jeszcze ustawienia adresu huba, więc VPN musi umożliwiać dostęp do Twojego lokalnego zakresu adresów, a skanowanie nowych urządzeń działa tylko w sieci domowej. Nigdy nie wystawiaj urządzenia do internetu za pomocą przekierowania portów. Przewodnik krok po kroku znajduje się w pliku docs/REMOTE-ACCESS.md w repozytorium."
      ],
      [
        "Czy istnieje wersja na iPhone?",
        "Nie ma aplikacji w App Store, ponieważ NEXUS nie korzysta z płatnego konta Apple Developer. Mając Maca i darmowe Apple ID, możesz zbudować ją dla własnego iPhone'a (przewodnik: docs/IOS-BUILD.md), a w wydaniu może również być dołączony niepodpisany plik IPA, który AltStore lub Sideloadly mogą podpisać za Ciebie; ta metoda nie została jeszcze zweryfikowana na prawdziwym iPhone'ie. Darmowe Apple ID powoduje wygaśnięcie aplikacji po 7 dniach, a powiadomienia podczas zamkniętej aplikacji nie są dostępne na iOS. Centrum domowe nadal działa jako aplikacja desktopowa; iPhone jest klientem."
      ],
      [
        "Moje urządzenie nie znajduje się na liście. Co mogę zrobić?",
        "NEXUS obsługuje tylko urządzenia z udokumentowanym lokalnym protokołem; urządzenia działające wyłącznie w chmurze nie są obsługiwane, ponieważ NEXUS nigdy nie łączy się z chmurą producenta. Lista kompatybilności (docs/COMPATIBILITY.md) obejmuje również Sonoff w trybie DIY, WiZ, LIFX, Govee (LAN) i Wake-on-LAN. Każde z nich ma zautomatyzowane testy protokołu, ale model jest uznawany za zweryfikowany tylko wtedy, gdy ktoś zgłosi, że działał na rzeczywistym urządzeniu. Napisz do nas poprzez formularz kontaktowy na tej stronie (wybierz „Żądanie nowego urządzenia / złącza”) lub e-mailem: marka i model, czego się spodziewałeś i co się wydarzyło. Powiadomienie nas, że model działał na Twoim rzeczywistym urządzeniu, oznacza go jako zweryfikowanego; nigdy nie podawaj haseł, kluczy lokalnych ani tokenów."
      ],
      [
        "Czy potrzebuję konta? Co się stanie, jeśli serwer będzie niedostępny?",
        "Tak: logujesz się raz za pomocą darmowego konta e-mail, aby otworzyć NEXUS. Od tego momentu kontrolowanie urządzeń i uruchamianie automatyzacji odbywa się w twojej własnej sieci i działa bez internetu. Konto dodaje synchronizację między twoimi urządzeniami, Funkcją Rodzina i asystentem AI, które korzystają z darmowych usług w chmurze z limitami. Gdy jedna z nich jest niedostępna, na przykład gdy darmowy projekt Supabase został wstrzymany po około tygodniu bez aktywności, ekrany w chmurze pokazują, że serwer jest niedostępny, zamiast pokazywać coś jako zapisane; urządzenia, automatyzacje i zasobnik wciąż działają. Jeśli quota lub usługa AI zostanie wyczerpana, asystent mówi, że nie mógł odpowiedzieć."
      ],
      [
        "Czy mogę zrobić kopię zapasową moich ustawień i przenieść je na inne urządzenie? Tak. Ustawienia mają sekcję kopii zapasowej, w której możesz wyeksportować swoje ustawienia i automatyzacje do pliku JSON i zaimportować go na innym urządzeniu lub po ponownej instalacji. Hasła, tokeny i lokalne klucze są usuwane z listy sparowanych urządzeń w pliku, więc należy je ponownie wprowadzić po przywróceniu. Zachowaj plik kopii zapasowej w tajemnicy. Czy mogę wyeksportować moje dane energetyczne?",
        "Yes. Settings has a backup section where you can export your settings and automations to a JSON file and import it on another device or after a reinstall. Passwords, tokens and local keys are stripped from the paired device list in the file, so re-enter them after restoring. Keep the backup file private."
      ],
      [
        "Can I export my energy data?",
        "Tak. Strona Energii może eksportować najnowsze odczyty rzeczywistej mocy z Twoich urządzeń w formie pliku CSV lub JSON. NEXUS posiada dane tylko dla urządzeń, które faktycznie raportują moc; jeśli żadne nie jest sparowane, nie ma nic do eksportu. Dlaczego Windows ostrzega mnie, gdy uruchamiam instalator?"
      ],
      [
        "Why does Windows warn me when I run the installer?",
        "Zainstaluj z Microsoft Store, a nie zobaczysz tego ostrzeżenia: Microsoft podpisuje ten pakiet podczas certyfikacji i dostarcza aktualizacje przez Store. Bezpośrednie pobranie pliku .exe nie jest jeszcze podpisane komercyjnym certyfikatem, więc SmartScreen może pokazać „nieznany wydawca”. Możesz porównać plik z sumami kontrolnymi podanymi w sekcji pobierania przed jego uruchomieniem. Nasza polityka podpisywania kodu jest podlinkowana w stopce strony."
      ]
    ]
  },
  "about": {
    "title": "O NEXUS",
    "lead": "Niezależna, lokalna platforma inteligentnego domu zaprojektowana z myślą o szybkości, całkowitej prywatności i prawdziwej własności sprzętu. Dzięki komunikacji bezpośrednio z Twoimi urządzeniami przez własną sieć domową, NEXUS na zawsze eliminuje uzależnienie od chmury.",
    "manifesto": {
      "heading": "Dlaczego stworzyliśmy NEXUS",
      "text": "Nowoczesny przemysł inteligentnych domów skręcił w złym kierunku. Firmowe ekosystemy zmuszały właścicieli domów do obowiązkowych subskrypcji, opóźnień zależnych od chmury oraz inwazyjnego śledzenia telemetrii. Kiedy twoje połączenie internetowe przestaje działać, przełącznik w salonie nie powinien przestać działać. Stworzyliśmy NEXUS, ponieważ wierzymy, że twój dom jest twoją świątynią: twój plan piętra, stany kamer i codzienne rodzinne rutyny należą wyłącznie do twojego własnego sprzętu."
    },
    "pillars": [
      {
        "title": "Lokalnie-przede wszystkim szybkość",
        "desc": "Każda automatyzacja i polecenie wykonuje się przez lokalną sieć LAN w ciągu milisekund. Brak podróży do zdalnych serwerów w chmurze, zerowe opóźnienia."
      },
      {
        "title": "Bezkompromisowa prywatność",
        "desc": "Brak analiz telemetrycznych, brak profilowania zachowań i brak sprzedaży twoich prywatnych rutyn. Konto jest wymagane; twoja konfiguracja jest przechowywana w twoim własnym wierszu konta chronionym na poziomie wiersza. Polecenia urządzeń pozostają wciąż w twojej sieci LAN."
      },
      {
        "title": "Brak uzależnienia od dostawcy",
        "desc": "Najpierw otwarte lokalne protokoły: Shelly, Philips Hue, ESPHome, Tasmota i WLED odpowiadają bezpośrednio na NEXUS, a wszystko inne łączy się przez twój własny serwer Home Assistant zamiast chmury dostawcy."
      },
      {
        "title": "Uczciwe, zrównoważone SaaS",
        "desc": "Podstawowe zarządzanie inteligentnym domem jest całkowicie darmowe i nieograniczone na zawsze. NEXUS+ to plan NEXUS AI i pomaga pokryć koszty korzystania z chmury."
      }
    ],
    "architecture": {
      "heading": "Zaprojektowane dla niezawodności",
      "lead": "NEXUS utrzymuje lekkie silnik desktopowy w zasobniku systemowym, dzięki czemu harmonogramy i reguły czujników są nadal oceniane, gdy komputer jest włączony, a aplikacja mobilna otwiera się bezpośrednio w tej samej sieci lokalnej.",
      "items": [
        {
          "icon": "layers",
          "title": "Desktop",
          "desc": "Aplikacje na Windows, macOS i Linux pozostają w zasobniku systemowym i umożliwiają uruchamianie lokalnych harmonogramów i reguł czujników podczas pracy komputera. Windows i Linux są dostarczane jako gotowe instalatory; macOS jest budowany ze źródła (niepodpisany: kliknij prawym przyciskiem → Otwórz)."
        },
        {
          "icon": "wifi",
          "title": "Telefon",
          "desc": "Aplikacje na Androida i iOS otwierają się w tej samej lokalnej sieci; polecenia urządzeń nadal przechodzą przez twoją sieć LAN. Android jest dostarczany jako podpisany plik APK; iOS jest budowany ze źródła za pomocą Xcode i darmowego Apple ID."
        },
        {
          "icon": "lock",
          "title": "Konto",
          "desc": "Wymagane jest konto, aby pokoje, urządzenia i sceny były zgodne na każdym ekranie. Polecenia urządzeń nie opuszczają twojej sieci domowej."
        }
      ]
    },
    "linksTitle": "Praktyczne linki"
  },
  "footer": {
    "tagline": "Kontroluj cały swój inteligentny dom bezpośrednio w lokalnej sieci — bez uzależnienia od dostawcy i bez zależności od chmury. Nawet gdy internet przestaje działać, twój dom nigdy nie przestaje.",
    "product": "Produkt",
    "productLinks": [
      [
        "Funkcje",
        "#features"
      ],
      [
        "Cennik",
        "#pricing"
      ],
      [
        "Pobierz",
        "#downloads"
      ],
      [
        "FAQ",
        "#faq"
      ],
      [
        "O nas",
        "/about"
      ]
    ],
    "account": "Obsługa klienta & Wsparcie",
    "accountLinks": [
      [
        "Kontakt i wsparcie techniczne",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Notatki o wydaniu i społeczność",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Pobierz aplikacje",
        "#downloads"
      ]
    ],
    "legal": "Prawo",
    "legalLinks": [
      [
        "Prywatność",
        "/privacy"
      ],
      [
        "Warunki",
        "/terms"
      ],
      [
        "Zwroty",
        "/refund"
      ],
      [
        "Podpisywanie kodu",
        "/code-signing"
      ],
      [
        "Współtwórz",
        "/contribute"
      ]
    ],
    "rights": "Wszelkie prawa zastrzeżone.",
    "langSwitchLabel": "Turecki",
    "langSwitchHref": "/tr/"
  }
};
