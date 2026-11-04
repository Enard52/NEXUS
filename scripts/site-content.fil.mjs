import { RELEASES_URL } from "./site-constants.mjs";

export const fil = {
  "title": "NEXUS — Ang iyong matalinong tahanan, pinamamahalaan sa iyong sariling network",
  "ogImageAlt": "NEXUS smart home ecosystem sa desktop at mobile",
  "description": "Ang NEXUS ay isang lokal-primer na smart home ecosystem para sa Windows, macOS, Linux, Android at iOS. Direktang kontrol sa mga device sa iyong sariling lokal na network, mabilis na mga automation, at live na mga sukatan ng enerhiya. Libre magpakailanman; opsyonal na planong NEXUS+.",
  "nav": [
    [
      "#features",
      "Mga Tampok"
    ],
    [
      "#how",
      "Paano ito gumagana"
    ],
    [
      "#integrations",
      "Integrasyon"
    ],
    [
      "#pricing",
      "Pagpepresyo"
    ],
    [
      "#downloads",
      "I-download"
    ],
    [
      "#faq",
      "FAQ"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Lokal-primer na smart home",
    "h1a": "Ang iyong tahanan.",
    "h1b": "Tahimik na nasa iyong kontrol.",
    "lead": "Isang pinag-isang ekosistema para sa iyong mga ilaw, klima, takip, at sensor — direktang nakikipag-usap sa mga aparato sa iyong sariling lokal na network. Mabilis na automations, live na pagsukat ng kuryente, at kontrol na nagpapatuloy kahit na mawalan ng internet.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Pinakabagong bersyon",
    "shotAlt": "NEXUS interface at control center",
    "trust": [
      "Libre, walang limitasyong mga aparato",
      "Hindi kailangan ang cloud para sa kontrol",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Makapangyarihang imprastruktura. Madaling kontrol.",
    "lead": "Bawat estado ng aparato, sukatan ng kuryente, at awtomatikong eksena ay tumatakbo nang direkta sa iyong lokal na network nang walang depensiya sa panlabas na cloud.",
    "items": [
      [
        "zap",
        "Mabilis na Automations",
        "Ang mga scenario na pinapagana ng oras at pagsikat ng araw ay direktang isinasagawa sa iyong lokal na hardware — patuloy na maaasahan sa background sa desktop."
      ],
      [
        "gauge",
        "Live na Pagbasa ng Enerhiya",
        "Basahin ang kasalukuyang wattage at pagkonsumo ng kuryente direkta mula sa mga suportadong smart plug at switch sa iyong lokal na network."
      ],
      [
        "wifi",
        "Bilisan ng Lokal na Network",
        "Direktang LAN na komunikasyon sa pamamagitan ng HTTP, TCP, at UDP sa mga brand na nakalista sa ilalim ng Integrations. Walang cloud hop sa path ng utos."
      ],
      [
        "lock",
        "Privacy sa Pamamagitan ng Disenyo",
        "Ang iyong home configuration at device telemetry ay nananatili sa iyong lokal na hardware. Kinakailangan ang isang account upang magamit ang NEXUS; ito ay nag-iimbak ng iyong setup sa iyong sariling row sa ilalim ng row-level access control. Ang mga utos ng device ay dumadaan pa rin sa iyong LAN."
      ],
      [
        "sparkles",
        "NEXUS AI na Katalinuhan",
        "Ang mga lokal na utos para sa smart home ay instant at libre magpakailanman. Ang opsyonal na cloud AI assistant ay nagbibigay ng mga intelligenteng suhestiyon tuwing kailangan mo ng gabay."
      ],
      [
        "layers",
        "Buksan ang Lokal na mga Protocol",
        "Ang direktang connectors ay nakikipag-usap sa iyong LAN. Ang Matter at Zigbee ay sumasali sa pamamagitan ng iyong sariling Home Assistant server — ang seksyon ng Integrations ay naglilista kung alin ang direktang konektado at alin ang bridged."
      ]
    ]
  },
  "how": {
    "heading": "Mula sa pag-download hanggang sa konektado sa loob ng ilang minuto.",
    "steps": [
      [
        "1",
        "I-install at buksan",
        "I-download ang native installer para sa iyong platform (Windows, Linux, o Android). Pagkatapos ay mag-sign in — kinakailangan ang isang account para magamit ang NEXUS, at pinagsasabay din nito ang setup sa iyong mga screen."
      ],
      [
        "2",
        "Idagdag ang iyong mga device",
        "Pumili ng iyong brand, i-scan ang lokal na network o ilagay ang IP. Ang mga brand na may direktang konektor ay gumagamit ng kanilang sariling protocol — walang vendor cloud sa landas na iyon.\\nI-enjoy ang iyong tahanan"
      ],
      [
        "3",
        "Mga scene, naka-schedule na automations at totoong pagbasa ng enerhiya — pinagsama-samang kontrol sa desktop at mobile.",
        "Gumagana sa kung ano ang mayroon ka na."
      ]
    ]
  },
  "integrations": {
    "heading": "Gumagana sa mga gamit mo na.",
    "lead": "Libre, unang lokal na mga protocol. Kahit ano na walang direktang connector ay gumagana pa rin sa pamamagitan ng Home Assistant bridge.",
    "groups": [
      [
        "Lokal na HTTP — sa lahat ng platform",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue bridge",
          "Home Assistant"
        ]
      ],
      [
        "Lokal na network, walang account o key — desktop app",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (DIY mode)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "May kulang ba? Humiling ng connector",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Libre gamitin. NEXUS+ kapag gusto mo ng higit pa",
    "lead": "",
    "currencyNote": "Presyo sa USD",
    "plans": [
      {
        "name": "Libre",
        "price": "$0",
        "period": "forever",
        "features": [
          "Walang limitasyon sa mga device at kuwarto sa bawat suportadong lokal na protocol",
          "Walang pag-asa sa cloud: tumatakbo sa iyong sariling LAN",
          "30 araw-araw na NEXUS AI commands at device actions",
          "Nakatakdang lokal na automasyon at pasadyang mga eksena",
          "Pag-sync ng multi-device account (mga kwarto, device, eksena)",
          "100% pribado: walang pagsubaybay, walang pagkuha ng data"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "bawat buwan",
        "badge": "Pinakapopular",
        "features": [
          "Lahat sa Free tier, dagdag pa:",
          "2,000 NEXUS AI na sagot bawat buwan sa halip na 30 bawat araw",
          "Hilingin sa NEXUS AI na mag-set ng mga eksena at sumagot sa simpleng wika",
          "Isang account, valid sa bawat NEXUS device",
          "Libreng pagsubok — 3 araw buwan-buwan, 7 araw taon-taon; kanselahin sa pagtatapos ng period"
        ],
        "cta": {
          "label": "Simulan ang iyong libreng pagsubok",
          "monthlyLabel": "Simulan ang 3-araw na libreng pagsubok",
          "yearlyLabel": "Simulan ang 7-araw na libreng pagsubok",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Pamilya",
        "price": "Libre",
        "period": "para sa buong pamilya",
        "badge": "Buong bahay",
        "features": [
          "Mga miyembro ng sambahayan na may access batay sa papel — walang limitasyon sa bilang ng miyembro",
          "Mga papel ng may-ari, miyembro, at bisita",
          "Kontrol sa bawat miyembro, paanyaya, at mga pahintulot sa setting",
          "Pag-sync ng mga eksena at automation sa lahat ng iyong mga naka-sign-in na device",
          "Aktibo sa buong ecosystem (desktop at mobile)",
          "Ganap na libre kasama ang iyong tahanan"
        ],
        "cta": {
          "label": "Magsimula sa Pamilya",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Kanselahin anumang oras mula sa Pagbabayad sa app o mula sa iyong account sa site na ito. Ang pagkansela ay magiging epektibo sa katapusan ng kasalukuyang panahon."
  },
  "downloads": {
    "heading": "Katutubong nasa bawat desktop. Komportable sa iyong telepono.",
    "lead": "Palaging libre. Bawat installer ay may kasamang inilathalang SHA-256 checksum upang maaari mong beripikahin ang iyong ini-install.",
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
        "Debian at Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · naka-signed na APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Bersyon",
    "sizeLabel": "Laki",
    "webCard": {
      "title": "Isang account, sa buong iyong ecosystem",
      "desc": "Windows at Linux desktop na mga programa at ang Android app. Kapag naka-sign in, ang iyong mga rooms, devices, scenes, at automations ay mananatiling tuloy-tuloy na naka-synchronize sa lahat ng iyong screen.",
      "cta": {
        "label": "I-download ang NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Sa Windows, ang pinakamadaling paraan ay ang Microsoft Store: ang package ay pirmado ng Microsoft at ang mga update ay dumarating sa pamamagitan ng Store. Ang direktang .exe ay hindi pirmado, kaya maaaring magbigay ng babala ang Windows tungkol sa isang “hindi kilalang publisher” — tingnan ang checksums."
  },
  "faq": {
    "heading": "Ang mga mahahalagang tanong, sinagot.",
    "items": [
      [
        "Ang NEXUS ba ay nagpapatakbo nang buong buo sa aking lokal na network?",
        "Oo. Ang NEXUS ay binuo sa isang mahigpit na lokal-unang arkitektura. Ang iyong mga device, silid, eksena, at sensor telemetry ay pinoproseso nang direkta sa iyong sariling hardware sa bahay. Kahit sa panahon ng pagkawala ng internet, ang lahat ng lokal na kontrol, ilaw, at mga automation ay patuloy na gumagana nang maayos nang walang pagkaantala. Ang pag-sign in nang ligtas ay nagsi-synchronize ng iyong mga setting sa lahat ng iyong screen."
      ],
      [
        "Kailangan ko ba i-install ang NEXUS, o maaari ba itong patakbuhin sa browser?",
        "I-install ang desktop na programa (Windows o Linux) o ang Android app. Hindi inaalok ang NEXUS bilang browser app. Ang mga utos ng device ay dumadaan sa iyong sariling lokal na network. Ginagamit ng Shelly, Philips Hue, ESPHome, Tasmota, WLED at Home Assistant ang lokal na HTTP sa desktop na programa at sa Android. Nangangailangan ang TP-Link Kasa at Yeelight ng raw TCP, kaya tumatakbo sila sa desktop na programa. Ang site na ito ay para sa account, downloads at billing. Ano ang idinadagdag ng NEXUS+ plan?"
      ],
      [
        "Ano ang idinaragdag ng NEXUS+ plan?",
        "Ang mahalagang kontrol sa smart home—walang limitasyong mga device, kuwarto, offline na automations, at lokal na dashboards—ay libre. Kasama sa NEXUS+ ang lahat ng nasa Libre, NEXUS AI para sa mga eksena at tanong sa simpleng wika, 2,000 sagot kada buwan, advanced na koneksyon para sa pagdagdag ng mga Home Assistant device, at isang account sa bawat device, kasama ang 3-araw na buwanang o 7-araw na taunang trial. Ang mga utos sa device ay patuloy na tumatakbo nang lokal. Kasama rin ang mga tungkulin sa bahay sa iyong tahanan nang walang dagdag na gastos."
      ],
      [
        "Aling account ang pag-aari ng aking NEXUS+ subscription?",
        "Ang email address na ginamit sa pag-checkout. Mag-sign in sa site na ito o sa app bago ka magbayad: magbubukas ang checkout na may nakalagay na email ng iyong account, at lilitaw ang subscription sa bawat device na iyong inilalog-inan. Hindi mabibili ang NEXUS+ nang walang account. Kung magbabayad ka gamit ang ibang email, ang subscription ay itatago sa email na iyon at hindi lalabas sa iyong account hanggang sa mag-sign in ka gamit ito. Paano tumatakbo ang mga awtomasyon at mga iskedyul na patakaran?"
      ],
      [
        "Paano tumatakbo ang mga automation at naka-iskedyul na panuntunan?",
        "Sinusuri ng NEXUS automation engine ang iyong mga iskedyul at sensor rules sa device na patuloy mong pinapatakbo — nananatili ang desktop app sa system tray at nagpapatupad ng 24/7, kaya ang mga routine sa pag-iilaw, enerhiya at seguridad ay hindi kailanman naghihintay sa cloud. Ang mga eksena at timer na pinapagana mula sa iyong telepono ay agad na naaaplay sa iyong LAN. Ang mga bagong kaganapan ay kumakalat sa mga notification channel na pinapagana mo sa pahina ng Instant Notifications: ang in-app strip, system notifications, ntfy, Telegram, o iyong sariling HTTPS webhook."
      ],
      [
        "Aling mga device at ecosystem ang sinusuportahan?",
        "Nagsasalita ang NEXUS ng sariling lokal na protocol ng bawat device: Shelly (Gen1 at Gen2+), Tasmota, WLED, ESPHome, Philips Hue at Home Assistant sa lokal na HTTP sa bawat platform, kasama ang TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode) at Wake-on-LAN sa lokal na network sa desktop app, nang walang account o key. Ang lahat ng iba pa — Matter o Zigbee na kagamitan — ay sumasali sa pamamagitan ng sarili mong Home Assistant server, na itinuturing ng NEXUS bilang isang solong lokal na hub. Agad na nagkapares ang mga device sa lokal na pagtuklas ng IP, nang walang vendor cloud sa pagitan. Paano isinasama ang mga security camera at sensor?"
      ],
      [
        "Paano isinasama ang mga security camera at sensor?",
        "Pinagsasama ng NEXUS ang iyong mga security camera, motion detector, at entry sensor sa isang sentralisadong security dashboard. Maaari mong i-automate ang mga privacy mode, i-arm ang mga surveillance routine kapag umaalis sa bahay, at makita ang bawat galaw o contact event sa app — pati na rin sa mga notification channel na iyong pinagana (system notifications, ntfy, Telegram, o iyong sariling webhook). Maaari ko bang kanselahin ang NEXUS+ anumang oras?"
      ],
      [
        "Maaari ko bang kanselahin ang NEXUS+ anumang oras?",
        "Oo, ganap na walang abala at walang obligasyon. Maaari kang mag-cancel sa isang click anumang oras: mula sa Account & Billing settings sa app, sa pamamagitan ng aming website, o direkta mula sa order link sa iyong billing email receipt. Mananatiling aktibo ang iyong premium na benepisyo hanggang sa katapusan ng iyong billing cycle nang walang anumang karagdagang singil sa hinaharap. Maaari ko bang kontrolin ang aking bahay kapag wala ako?"
      ],
      [
        "Makokontrol ko ba ang aking tahanan kapag wala ako?",
        "Hindi sa pamamagitan ng NEXUS cloud: Direktang nakikipag-usap ang NEXUS sa iyong mga device sa iyong home network at wala itong relay. Para maabot ito mula sa labas, ilagay ang iyong telepono o laptop sa home network gamit ang VPN tulad ng Tailscale (subnet router) o WireGuard sa iyong router; gagana ang NEXUS eksakto tulad ng sa bahay. Wala pang setting ng hub-address ang NEXUS, kaya kailangan ng VPN na maging maabot ang iyong lokal na address range, at gumagana lamang ang pag-scan para sa mga bagong device sa home network. Huwag kailanman ibukas ang isang device sa internet gamit ang port forwarding. Ang step-by-step na gabay ay nasa docs/REMOTE-ACCESS.md sa repository."
      ],
      [
        "Mayroon bang bersyon para sa iPhone?",
        "Walang app sa App Store, dahil hindi gumagamit ang NEXUS ng bayad na Apple Developer account. Sa isang Mac at libreng Apple ID, maaari mo itong i-build para sa iyong sariling iPhone (gabay: docs/IOS-BUILD.md), at maaaring maglakip din ang isang release ng unsigned na IPA na maaaring pirmahan ng AltStore o Sideloadly para sa iyo; ang pamamaraan na iyon ay hindi pa napatunayan sa isang totoong iPhone. Ang libreng Apple ID ay nagpapawalang bisa sa app pagkatapos ng 7 araw, at ang mga notipikasyon habang nakasara ang app ay hindi available sa iOS. Ang home hub ay nananatiling desktop app; ang iPhone ay isang kliyente."
      ],
      [
        "Hindi kabilang ang aking device sa listahan. Ano ang maaari kong gawin?",
        "Sinusuportahan lamang ng NEXUS ang mga device na may dokumentadong lokal na protocol; ang mga cloud-only na device ay hindi sinusuportahan dahil hindi kailanman nakikipag-usap ang NEXUS sa cloud ng vendor. Kasama rin sa listahan ng pagiging compatible (docs/COMPATIBILITY.md) ang Sonoff sa DIY mode, WiZ, LIFX, Govee (LAN) at Wake-on-LAN. Bawat isa sa mga ito ay may awtomatikong pagsubok sa protocol, ngunit ang isang modelo ay binibilang na beripikado lamang kapag may nag-ulat na gumana ito sa isang totoong device. Sumulat sa amin sa pamamagitan ng contact form sa site na ito (piliin ang “New Device / Connector Request”) o sa pamamagitan ng e-mail: ang brand at modelo, kung ano ang iyong inaasahan at kung ano ang nangyari. Ang pagsasabi sa amin na gumana ang isang modelo sa iyong totoong device ang siyang nagpapakita na ito ay beripikado; huwag kailanman isama ang mga password, lokal na key o token."
      ],
      [
        "Kailangan ko ba ng account? Ano ang mangyayari kung bumaba ang server?",
        "Oo: mag-sign in ka ng isang beses gamit ang libreng email account upang buksan ang NEXUS. Pagkatapos nito, ang pagkontrol sa mga device at pagpapatakbo ng mga automation ay nangyayari sa iyong sariling network at patuloy na gumagana kahit walang internet. Ang account ay nagdaragdag ng sync sa iyong mga device, Pamilya at ang AI assistant, na gumagamit ng libreng cloud services na may limitasyon. Kapag ang isa sa mga ito ay hindi available, halimbawa kapag ang libreng Supabase project ay na-pause matapos ang halos isang linggo na walang aktibidad, sinasabi ng cloud screens na hindi maabot ang server sa halip na ipakita na ang isang bagay ay naisave; ang mga device, automation, at tray ay patuloy na gumagana. Kung maubos ang AI quota o serbisyo, sasabihin ng assistant na hindi ito makasagot."
      ],
      [
        "Pwede ko bang i-back up ang aking mga setting at ilipat ang mga ito sa ibang device?",
        "Oo. May seksyon ang Settings para sa backup kung saan maaari mong i-export ang iyong mga setting at automation sa isang JSON file at i-import ito sa ibang device o pagkatapos ng muling pag-install. Ang mga password, token, at lokal na key ay tinatanggal mula sa listahan ng naka-paired na device sa file, kaya kailangan mo itong muling ilagay pagkatapos ng pag-restore. Panatilihing pribado ang backup file."
      ],
      [
        "Pwede ko bang i-export ang aking data sa enerhiya?",
        "Oo. Maaaring i-export ng pahina ng Enerhiya ang pinakabagong mga pagbasa ng totoong lakas mula sa iyong mga aparato bilang isang CSV o JSON na file. Ang NEXUS ay may datos lamang para sa mga aparatong aktwal na nag-uulat ng lakas; kung walang naka-pair, wala nang ma-e-export."
      ],
      [
        "Bakit ako binabalaan ng Windows kapag pinapatakbo ko ang installer?",
        "I-install mula sa Microsoft Store at hindi mo makikita ang babalang ito: Pinipirmahan ng Microsoft ang pakete sa panahon ng sertipikasyon at nagde-deliver ng mga update sa pamamagitan ng Store. Ang direktang .exe na pag-download ay hindi pa pinipirmahan gamit ang commercial certificate, kaya maaaring ipakita ng SmartScreen ang “unknown publisher”. Maaari mong ikumpara ang file sa mga checksums na nakalista sa seksyon ng pag-download bago ito patakbuhin. Ang aming patakaran sa pag-sign ng code ay naka-link mula sa footer ng site."
      ]
    ]
  },
  "about": {
    "title": "Tungkol sa NEXUS",
    "lead": "Isang independyente, lokal-unang smart home na plataporma na idinisenyo para sa bilis, ganap na privacy, at tunay na pagmamay-ari ng hardware. Sa pamamagitan ng direktang pakikipag-usap sa iyong mga device sa pamamagitan ng sarili mong home network, tinatanggal ng NEXUS ang cloud lock-in magpakailanman.",
    "manifesto": {
      "heading": "Bakit Nilikha Namin ang NEXUS",
      "text": "Ang modernong industriya ng smart home ay nagkamali ng direksyon. Pinilit ng mga proprietary ecosystem ang mga may-ari ng bahay na sumunod sa mga obligadong subscription, cloud-dependent na pagkaantala, at mapanghimasok na telemetry tracking. Kapag bumaba ang iyong koneksyon sa internet, hindi dapat huminto ang paggana ng switch sa iyong sala. Binuo namin ang NEXUS dahil naniniwala kami na ang iyong bahay ay iyong santuwaryo: ang iyong floor plan, estado ng iyong mga camera, at pang-araw-araw na gawain ng pamilya ay nararapat lamang na nasa iyong sariling hardware."
    },
    "pillars": [
      {
        "title": "Bilis na Una ang Lokal",
        "desc": "Bawat automation at utos ay naisasagawa sa iyong lokal na LAN sa loob ng millisecond. Walang roundtrips sa malalayong cloud server, zero latency."
      },
      {
        "title": "Hindi Matitinag na Privacy",
        "desc": "Walang analytics telemetry, walang behavioral profiling, at walang pagbebenta ng iyong mga pribadong gawain. Kinakailangan ang isang account; ang iyong setup ay nakaimbak sa iyong sariling row-level-protected account row. Ang mga utos ng device ay nananatili pa rin sa iyong LAN."
      },
      {
        "title": "Walang Vendor Lock-In",
        "desc": "Buksan muna ang mga lokal na protocol: direktang sumasagot ang Shelly, Philips Hue, ESPHome, Tasmota at WLED sa NEXUS, at ang iba pa ay sasali sa pamamagitan ng iyong sariling Home Assistant server sa halip na sa cloud ng vendor."
      },
      {
        "title": "Tapat, Napapanatiling SaaS",
        "desc": "Ang pangunahing pamamahala ng matalinong bahay ay ganap na libre at walang limitasyon magpakailanman. Ang NEXUS+ ay ang plano ng NEXUS AI at tumutulong na masakop ang paggamit ng cloud na iyon."
      }
    ],
    "architecture": {
      "heading": "Dinisenyo para sa Kahusayan",
      "lead": "Pinananatili ng NEXUS ang isang magaan na desktop engine sa iyong system tray upang patuloy na masuri ang mga iskedyul at mga patakaran ng sensor habang naka-on ang iyong computer, at ang mobile app ay direktang nagbubukas sa parehong lokal na network.",
      "items": [
        {
          "icon": "layers",
          "title": "Desktop",
          "desc": "Ang mga app para sa Windows, macOS at Linux ay nananatili sa system tray at pinapatakbo ang mga lokal na iskedyul at patakaran ng sensor habang naka-on ang computer. Ang Windows at Linux ay ihinahain bilang mga handang installer; ang macOS ay binuo mula sa source (hindi naka-sign: i-right-click → Open)."
        },
        {
          "icon": "wifi",
          "title": "Telepono",
          "desc": "Ang mga Android at iOS na app ay nagbubukas sa parehong lokal na network; ang mga utos ng device ay dumadaan pa rin sa iyong LAN. Ang Android ay ipinapadala bilang isang naka-sign na APK; ang iOS ay binuo mula sa source gamit ang Xcode at isang libreng Apple ID."
        },
        {
          "icon": "lock",
          "title": "Account",
          "desc": "Kinakailangan ang isang account upang magkapareho ang mga kuwarto, device, at mga eksena sa bawat screen. Ang mga utos ng device ay hindi lumalabas sa iyong home network."
        }
      ]
    },
    "linksTitle": "Praktikal na mga link"
  },
  "footer": {
    "tagline": "Kontrolin ang buong smart home mo nang direkta sa iyong lokal na network — walang vendor lock-in at walang depende sa cloud. Kahit na huminto ang internet, hindi titigil ang iyong bahay.",
    "product": "Produkto",
    "productLinks": [
      [
        "Mga Tampok",
        "#features"
      ],
      [
        "Pagpepresyo",
        "#pricing"
      ],
      [
        "I-download",
        "#downloads"
      ],
      [
        "FAQ",
        "#faq"
      ],
      [
        "Tungkol sa Amin",
        "/about"
      ]
    ],
    "account": "Customer at Suporta",
    "accountLinks": [
      [
        "Pakikipag-ugnay at Suporta sa Teknikal",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Mga Tala ng Paglabas at Komunidad",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "I-download ang Mga App",
        "#downloads"
      ]
    ],
    "legal": "Legal",
    "legalLinks": [
      [
        "Pribado",
        "/privacy"
      ],
      [
        "Mga Tuntunin",
        "/terms"
      ],
      [
        "Mga Pagbabalik ng Pondo",
        "/refund"
      ],
      [
        "Pagpirma ng Code",
        "/code-signing"
      ],
      [
        "Magtulungan",
        "/contribute"
      ]
    ],
    "rights": "Lahat ng karapatan ay nakalaan.",
    "langSwitchLabel": "Türkçe",
    "langSwitchHref": "/tr/"
  }
};
