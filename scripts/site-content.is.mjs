import { RELEASES_URL } from "./site-constants.mjs";

export const is = {
  "title": "NEXUS — Snjallheimilið þitt, stjórnað á eigin neti",
  "ogImageAlt": "NEXUS snjallheimilisumhverfi á tölvu og farsíma",
  "description": "NEXUS er snjallheimilisumhverfi sem leggur áherslu á staðbundna stjórnun fyrir Windows, macOS, Linux, Android og iOS. Bein stýring á tækjum í eigin staðarneti, sjálfvirkar aðgerðir sem bregðast við þörfum, og rauntíma orkugildi. Ókeypis að eilífu; valfrjáls NEXUS+ áætlun.",
  "nav": [
    [
      "#features",
      "Eiginleikar"
    ],
    [
      "#how",
      "Hvernig það virkar"
    ],
    [
      "#integrations",
      "Samþættingar"
    ],
    [
      "#pricing",
      "Verðlagning"
    ],
    [
      "#downloads",
      "Sækja"
    ],
    [
      "#faq",
      "Algengar spurningar"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Staðbundið snjallheimili",
    "h1a": "Heimilífið þitt.",
    "h1b": "Þegjandi innan stjórnar þinnar.",
    "lead": "Einn sameinaður vistkerfi fyrir lýsingu, loftslag, gardínur og skynjara — sem talar beint við tækin á eigin staðarneti. Tenging við sjálfvirkar stillingar, mælingar á orkunotkun í rauntíma, og stjórn sem heldur áfram að virka þegar internetið fer niður.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Nýjasta útgáfa",
    "shotAlt": "NEXUS viðmót og stýringarstöð",
    "trust": [
      "Ókeypis, ótakmörkuð tæki",
      "Engin skýþjónusta nauðsynleg fyrir stýringu",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Öflug innviði. Einföld stjórn.",
    "lead": "Hver ástand tækis, orkumæling og sjálfvirk atburðarrás keyrir beint yfir staðarnetið þitt án ytri skýjaðstoðar.",
    "items": [
      [
        "zap",
        "Tengdar sjálfvirkar stillingar",
        "Tíma- og sólarlagsbúið fyrirkomulag keyrir beint á staðbundnum búnaði þínum — heldur áfram áreiðanlega í bakgrunni á skjáborði."
      ],
      [
        "gauge",
        "Rauntíma orkunotkunarlestrar",
        "Lesðu rauntíma vött og orkunotkun beint frá studdum snjallinnstungum og rofum á staðnetinu þínu."
      ],
      [
        "wifi",
        "Staðnetshraði",
        "Bein LAN-samskipti yfir HTTP, TCP og UDP við vörumerkin sem eru talin upp undir Samþættingar. Engin ský-hop í skipanaleiðinni."
      ],
      [
        "lock",
        "Persónuvernd eftir hönnun",
        "Stillingar heimilisins þíns og tækjagögn verða áfram á staðbundnum búnaði þínum. Þörf er á að búa til reikning til að nota NEXUS; hann geymir uppsetninguna þína í þínum eigin röð undir aðgangsstýringu á röð, Device commands fara enn yfir LAN-netið þitt."
      ],
      [
        "sparkles",
        "NEXUS AI Greind",
        "Staðbundnir snjallheimilisstýringar eru strax virkar og ókeypis að eilífu. Valfrjáls skýja AI aðstoðarmaður veitir snjallar tillögur hvenær sem þú þarft leiðbeiningar."
      ],
      [
        "layers",
        "Opnir staðbundnir prófílar",
        "Beinir tenglar tala á LAN-netinu þínu. Matter og Zigbee tengjast í gegnum þinn eigin Home Assistant netþjón — Hluti Samruna listar hvað er bein tenging og hvað er tengt í gegnum brú."
      ]
    ]
  },
  "how": {
    "heading": "Frá niðurhali til tengingar á nokkrum mínútum.",
    "steps": [
      [
        "1",
        "Settu upp & opnaðu",
        "Sæktu innfædda uppsetningarforritið fyrir þinn vettvang (Windows, Linux eða Android). Skráðu þig síðan inn — reikningur er nauðsynlegur til að nota NEXUS, og hann samstillir líka uppsetningu yfir skjái þína."
      ],
      [
        "2",
        "Bættu við tækjunum þínum",
        "Veldu vörumerki þitt, skannaðu heimilisnetið eða sláðu inn IP. Vörumerki með beinan tengi nota sitt eigið samskiptareglur — engin skýjaþjónusta birgja á þeirri leið."
      ],
      [
        "3",
        "Lífgaðu heimilið þitt",
        "Senur, skipulagðar sjálfvirkni og raunverulegar orkugreiningar — samræmd stjórn á skjáborði og farsíma."
      ]
    ]
  },
  "integrations": {
    "heading": "Vinnur með því sem þú þegar átt.",
    "lead": "Ókeypis, staðbundin samskiptareglur fyrst. Allt sem hefur ekki beinan tengil virkar samt í gegnum Home Assistant brýrinn.",
    "groups": [
      [
        "Staðbundið HTTP — á öllum kerfum",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue brýr",
          "Home Assistant"
        ]
      ],
      [
        "Staðnet, enginn reikningur eða lykill — skjáborðsforrit",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (DIY stilling)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Eitthvað vantar? Beiðni um tengi",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Ókeypis til notkunar. NEXUS+ þegar þú vilt meira",
    "lead": "",
    "currencyNote": "Verð í USD",
    "plans": [
      {
        "name": "Ókeypis",
        "price": "$0",
        "period": "forever",
        "features": [
          "Ótakmörkuð tæki og herbergi í öllum studdum staðbundnum samskiptareglum",
          "Engin skýjaráð: keyrir staðbundið á eigin staðneti",
          "30 daglegar NEXUS AI skipanir & tæki aðgerðir",
          "Skipulagðar staðbundnar sjálfvirkni og sérsniðnar senur",
          "Samstilling reikninga milli margra tækja (herbergi, tæki, senur)",
          "100% einkamál: engin rekjanleiki, engin gagnasöfnun"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "á mánuði",
        "badge": "Vinsælasta",
        "features": [
          "Allt í Ókeypis stigi, plús:",
          "2.000 NEXUS AI svör á mánuði í stað 30 á dag",
          "Biðja NEXUS AI um að stilla senur og svara á einföldu máli",
          "Einn reikningur, gildur á öllum NEXUS tækjum",
          "Ókeypis prufutími — 3 dagar mánaðarlega, 7 dagar árlega; hætta við í lok tímabils"
        ],
        "cta": {
          "label": "Byrjaðu ókeypis prufutíma",
          "monthlyLabel": "Byrjaðu 3 daga ókeypis prufutíma",
          "yearlyLabel": "Byrjaðu 7 daga ókeypis prufutíma",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Fjölskylda",
        "price": "Ókeypis",
        "period": "fyrir alla fjölskylduna",
        "badge": "Heil heimil",
        "features": [
          "Húsfélagar með hlutverkamiðaðan aðgang — engin hámarkstakmörk fyrir meðlimi",
          "Hlutverk eiganda, meðlims og gests",
          "Stjórnun á hverjum meðlim, boð og stillingarheimildir",
          "Senur og sjálfvirkni samstillt á öllum innskráðum tækjum þínum",
          "Virk um alla vistkerfið (borðtölvur og farsímar)",
          "Algjörlega ókeypis með heimili þínu"
        ],
        "cta": {
          "label": "Byrjaðu með fjölskyldu",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Hætta hvenær sem er í Reikningsyfirliti í appinu eða á reikningnum þínum á þessari síðu. Hætting tekur gildi í lok núverandi tímabils."
  },
  "downloads": {
    "heading": "Innbyggt í öllum borðtölvum. Hjá þér á símanum.",
    "lead": "Alltaf ókeypis. Hver uppsetningarpakki kemur með birtri SHA-256 tékklisti svo þú getir staðfest hvað þú setur upp.",
    "cards": [
      [
        "windows",
        "monitor",
        "Windows",
        "Windows 10/11 · 64-bita",
        "NEXUS-Setup.exe",
        ".exe"
      ],
      [
        "linux",
        "terminal",
        "Linux",
        "Debian og Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · undirritað APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Útgáfa",
    "sizeLabel": "Stærð",
    "webCard": {
      "title": "Einn reikningur, yfir allt vistkerfið þitt",
      "desc": "Windows og Linux forrit fyrir skjáborð og Android forritið. Þegar þú ert skráð/ur inn haldast herbergin þín, tækin, sviðin og sjálfvirkni samstillt á öllum skjám þínum.",
      "cta": {
        "label": "Sækja NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Á Windows er auðveldasta leiðin Microsoft Store: pakkið er undirritað af Microsoft og uppfærslur koma í gegnum Store. Beint .exe er óundirritað, svo Windows getur varað við „óþekktan útgefanda“ — sjá stöðubrief."
  },
  "faq": {
    "heading": "Mikilvæg spurning, svarað.",
    "items": [
      [
        "Starfar NEXUS alfarið á mínu staðarneti?",
        "Já. NEXUS er byggt á ströngu staðbundnu-forgangsarkitektúr. Tækin þín, herbergin, senur og skynjara-gögn eru unnin beint í gegnum eigin heimartæki þín. Jafnvel við internettruflanir halda öll staðbundin stjórntæki, lýsing og sjálfvirknir áfram að virka hnökralaust án tafar. Örugg innskráning samstillar stillingar þínar yfir alla skjái."
      ],
      [
        "Þarftu að setja upp NEXUS, eða keyrir það í vafranum?",
        "Settu upp skrifborðsforritið (Windows eða Linux) eða Android-forritið. NEXUS er ekki í boði sem vafraforrit. Tækniforritaskipanir fara yfir þitt eigið staðarnet. Shelly, Philips Hue, ESPHome, Tasmota, WLED og Home Assistant nota staðbundið HTTP í skrifborðsforritinu og á Android. TP-Link Kasa og Yeelight þurfa hráan TCP, svo þau keyra í skrifborðsforritinu. Þessi síða er fyrir reikninginn, niðurhal og greiðslur."
      ],
      [
        "Hvað bætir NEXUS+ áætlunin?",
        "Grunnstýring snjallheimilis—ótakmarkaðar tæki, herbergi, sjálfvirkni án nettengingar og staðbundnir skjáborð—er ókeypis. NEXUS+ inniheldur allt í Free, NEXUS AI fyrir senur og spurningar á venjulegu máli, 2.000 svör á mánuði, háþróað tengingar fyrir að bæta við Home Assistant tækjum, og eitt aðgang fyrir öll tæki, með 3 daga mánaðarlegu eða 7 daga árlegu prufu. Tækið skipanir keyra enn staðbundið. Heimilis hlutverk eru innifalin með heimilinu þínu án aukakostnaðar. Hvaða aðgangi tilheyrir NEXUS+ áskriftin mín?"
      ],
      [
        "Á hvaða reikning er NEXUS+ áskriftin mín skráð?",
        "Netfangið sem notað er við afgreiðslu. Skráðu þig inn á þessum vef eða í appinu áður en þú greiðir: afgreiðsla opnast þá með netfangið í reikningnum þínum fyllt út, og áskriftin birtist á öllum tækjum sem þú skráir þig inn á. NEXUS+ er ekki hægt að kaupa án reiknings. Ef þú greiðir með öðru netfangi, þá er áskriftin geymd undir því netfangi og mun ekki birtast á reikningnum þínum fyrr en þú skráir þig inn með því."
      ],
      [
        "Hvernig keyra sjálfvirknir og fyrirfram skipulagðar reglur?",
        "NEXUS sjálfvirknivélin metur áætlanir þínar og skynjarareglur á tækinu sem þú heldur gangandi — skjáborðsforritið situr í kerfistrennu og keyrir allan sólarhringinn, svo ljós, orku- og öryggisrútínur þurfa aldrei að bíða eftir skýinu. Atriði og tímastillir sem kveikt er á frá símanum þínum gilda strax yfir LAN-netinu þínu. Ný atvik berast á tilkynningarrásirnar sem þú virkjar á síðu Samtímatilkynninga: stikuna í forritinu, kerfistilkynningar, ntfy, Telegram eða þinn eigin HTTPS vefkrækju."
      ],
      [
        "Hvaða tæki og vistkerfi eru studd?",
        "NEXUS talar hvert tæki með eigin staðbundna samskiptareglum: Shelly (Gen1 og Gen2+), Tasmota, WLED, ESPHome, Philips Hue og Home Assistant yfir staðbundnu HTTP á hverri vettvang, auk TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY hamur) og Wake-on-LAN yfir staðnetið í skjáborðsforritinu, án reiknings eða lykils. Allt annað — Matter eða Zigbee tæki — tengist í gegnum þinn eigin Home Assistant netþjón, sem NEXUS tekur sem einn staðbundinn miðstöð. Staðbundin IP-uppgötvun tengir tæki samstundis, án ský þjónustu seljanda á milli. Hvernig eru öryggismyndavélar og skynjarar samþætt?"
      ],
      [
        "Hvernig eru öryggismyndavélar og skynjarar samþættir?",
        "NEXUS sameinar öryggismyndavélar þínar, hreyfiskynjara og inngangs-skynjara í miðlægt öryggisstjórnborð. Þú getur sjálfvirkt stillt persónuverndarham, virkjað eftirlitsvenjur þegar þú ferð úr húsi og séð alla hreyfingu eða snertiatburð í forritinu – auk á tilkynningarrásum sem þú virkjar (kerfistilkynningar, ntfy, Telegram eða eigin webhook)."
      ],
      [
        "Get ég hætt við NEXUS+ hvenær sem er?",
        "Já, alveg án vandræða og án skuldbindinga. Þú getur hætt áskrift með einum smelli hvenær sem er: frá stillingum notanda og greiðslu í appinu, í gegnum vefsíðuna okkar, eða beint frá pöntunartenglinum í reikningspóstinum þínum. Kostir þínir í úrvalsáskriftinni halda áfram að vera virkir til loka næsta greiðslutímabils án frekari gjalda."
      ],
      [
        "Get ég stjórnað heimilinu mínu þegar ég er fjarverandi?",
        "Ekki í gegnum NEXUS ský: NEXUS talar beint við tækin þín á heimanetinu og hefur enga millilið. Til að ná til þess utan heimilisins, settu símann eða fartölvuna þína á heimanetið með VPN eins og Tailscale (subnet router) eða WireGuard á leiðarvini þínum; þá virkar NEXUS nákvæmlega eins og heima. NEXUS hefur enn enga stillingu fyrir hub-tölu, svo VPN þarf að gera innlenda netfangasvið þitt aðgengilegt, og skönnun fyrir nýjum tækjum virkar aðeins á heimanetinu. Aldrei sýna tæki á internetinu með port forwarding. Skref-fyrir-skref leiðbeiningarnar eru í docs/REMOTE-ACCESS.md í geymslunni."
      ],
      [
        "Er til iPhone útgáfa?",
        "Það er engin App Store app, því NEXUS notar ekki greiddan Apple Developer reikning. Með Mac og ókeypis Apple ID geturðu búið það til fyrir eigin iPhone (leiðbeining: docs/IOS-BUILD.md), og útgáfa gæti einnig fylgt ósignuðu IPA sem AltStore eða Sideloadly geta undirritað fyrir þig; sú leið hefur ekki enn verið staðfest á raunverulegum iPhone. Ókeypis Apple ID rennur út eftir 7 daga, og tilkynningar meðan appið er lokað eru ekki fáanlegar á iOS. Heimahubbarinn er enn skrifborðsforritið; iPhone er viðskiptavinur."
      ],
      [
        "Tækið mitt er ekki á listanum. Hvað get ég gert?",
        "NEXUS styður aðeins tæki með skjalfest staðbundið samskiptaregluflæði; skýjatæki ein og sér eru ekki studd vegna þess að NEXUS talar aldrei við ský seljanda. Samhæfnislistinn (docs/COMPATIBILITY.md) inniheldur einnig Sonoff í DIY-ham, WiZ, LIFX, Govee (LAN) og Wake-on-LAN. Hvert þessara hefur sjálfvirkar prófanir prótókols, en líkan telst staðfest aðeins þegar einhver tilkynnir að það hafi virkað á raunverulegu tæki. Skrifaðu til okkar í gegnum tengingareyðublað á þessari síðu (veldu „New Device / Connector Request“) eða með tölvupósti: vörumerki og líkan, hvað þú bjóst við og hvað gerðist. Að segja okkur að líkan hafi virkað á raunverulegu tæki þínu er það sem staðfestir það; aldrei setja inn lykilorð, staðbundna lykla eða tákna."
      ],
      [
        "Þarf ég að hafa aðgang? Hvað gerist ef netþjónninn er niðri?",
        "Já: þú skráir þig inn einu sinni með ókeypis netpóstfangi til að opna NEXUS. Eftir það fer stjórnun tækja og keyrsla sjálfvirkra aðgerða fram á þínu eigin neti og heldur áfram að virka án internets. Reikningurinn bætir samstillingu yfir tækin þín, Fjölskylduna og AI-aðstoðarann, sem nota ókeypis skýjaþjónustu með takmörkunum. Þegar ein af þessum þjónustum er ekki tiltæk, til dæmis þegar ókeypis Supabase verkefnið hefur verið stilstillt eftir um viku án virkni, segja skýjaskjáirnir að netþjónninn sé ekki náanlegur í stað þess að sýna eitthvað sem vistað; tækin, sjálfvirku aðgerðirnar og stýritáknið halda áfram að virka. Ef AI-kvóti eða þjónusta er fullnýtt, segir aðstoðarinn að hann gæti ekki svarað."
      ],
      [
        "Get ég tekið afrit af stillingum mínum og flutt þær yfir á annan búnað?",
        "Já. Í stillingum er afritahluti þar sem þú getur flutt út stillingar og sjálfvirkni í JSON-skjal og flutt það inn á annan búnað eða eftir enduruppsetningu. Lykilorð, flýtirit og staðbundin lykla eru fjarlægð af samstilltum búnaði í skránni, svo sláðu þau inn aftur eftir að endurheimt hefur verið framkvæmd. Haltu afritaskránni einkamáli."
      ],
      [
        "Get ég flutt út orkuupplýsingar mínar?",
        "Já. Orkusíðan getur flutt nýjustu raunverulegu aflmælingarnar frá tækjunum þínum sem CSV- eða JSON-skjal. NEXUS hefur aðeins gögn fyrir tæki sem raunverulega senda afl; ef engin eru tengd er ekkert til að flytja út."
      ],
      [
        "Hvers vegna varar Windows mig þegar ég keyri uppsetningarskrána?",
        "Settu upp úr Microsoft Store og þú munt ekki sjá þessa viðvörun: Microsoft undirritar pakkann við vottun og afhendir uppfærslur í gegnum Store. Beinni niðurhal .exe er enn ekki undirritað með viðskiptalegri vottun, svo SmartScreen gæti sýnt „óþekktan útgefanda“. Þú getur borið saman skrána við skammtana sem taldir eru upp í niðurhalsdeildinni áður en þú keyrir hana. Stefna okkar um undirritun kóða er tengd frá síðufótinum. Um NEXUS"
      ]
    ]
  },
  "about": {
    "title": "Um NEXUS",
    "lead": "Sjálfstætt, staðbundið snjallheimilisvettvangur hannaður fyrir hraða, fullkomið einkalíf og raunverulegan eignarhald á vélbúnaði. Með því að tala beint við tækin þín yfir eigið heimilisnet fjarlægir NEXUS skýja-tenginguna að eilífu.",
    "manifesto": {
      "heading": "Af hverju við byggðum NEXUS",
      "text": "Nútíma snjallheimilisiðnaðurinn fór útaf réttri braut. Lokakerfi neyddu heimilismenn í skylduskráningar, skýjaþjónustum sem valda töfum og áreiðanlega mælingatækni. Þegar nettenging þín fer niður ætti rofari í stofunni ekki að hætta að virka. Við þróuðum NEXUS vegna þess að við trúum því að heimili þitt sé skjól: gólfplön þín, stöður mynda og dagleg fjölskyldurútína þín tilheyra einungis þinni eigin vélbúnaði."
    },
    "pillars": [
      {
        "title": "Staðbundinn hraði",
        "desc": "Allar sjálfvirkni og skipanir fara fram yfir staðbundið LAN á millisekúndur. Engar ferðir til fjarstýrt skýjaþjónustu, enginn töf."
      },
      {
        "title": "Óbilandi persónuvernd",
        "desc": "Engin greiningargögn, engin hegðunarprófílun og engin sala á einkarútínum þínum. Reikningur er nauðsynlegur; uppsetningin þín er geymd í þinni eigin röð sem er vernduð á raðstigi. Tækjaskipanir haldast enn á LAN-inu þínu."
      },
      {
        "title": "Engin læsing hjá birgjum",
        "desc": "Opnaðu staðbundnar samskiptareglur fyrst: Shelly, Philips Hue, ESPHome, Tasmota og WLED svara NEXUS beint, og allt annað tengist í gegnum þinn eigin Home Assistant netþjón í stað skýja frá birgja."
      },
      {
        "title": "Heiðarlegt, sjálfbært SaaS",
        "desc": "Kjarni snjallheimilisumsjónar er algjörlega ókeypis og ótakmarkaður að eilífu. NEXUS+ er NEXUS AI áætlunin og hjálpar til við að standa undir notkun á skýinu."
      }
    ],
    "architecture": {
      "heading": "Hannað fyrir áreiðanleika",
      "lead": "NEXUS heldur léttu skrifborðsforriti í kerfistökuskjánum þínum svo tímasetningar og skynjarareglur haldi áfram að vera metnar meðan tölvan þín er kveikt, og farsímappið opnast beint á sama staðarnetinu.",
      "items": [
        {
          "icon": "layers",
          "title": "Skrifborð",
          "desc": "Windows, macOS og Linux forritin halda sig í kerfistökuskjánum og halda staðarnótum og skynjarareglum gangandi meðan tölvan er kveikt. Windows og Linux eru tilbúin sem uppsetningarpakkar; macOS er smíðað úr kóða (ósamþykkt: hægrismelltu → Opna)."
        },
        {
          "icon": "wifi",
          "title": "Sími",
          "desc": "Android- og iOS-forritin opnast á sama staðarnetinu; tækniforritin fara enn í gegnum LAN-ið þitt. Android er afhent sem undirritað APK; iOS er byggt úr kóða með Xcode og ókeypis Apple ID."
        },
        {
          "icon": "lock",
          "title": "Reikningur",
          "desc": "Reikningur er nauðsynlegur svo herbergi, tæki og svið passi á öllum skjám. Tækniforritin fara ekki út af heimaneti þínu."
        }
      ]
    },
    "linksTitle": "Hagnýt tenglar"
  },
  "footer": {
    "tagline": "Stjórnaðu öllu snjallheimilinu þínu beint yfir staðarnetið þitt — án þess að festa þig við ákveðna framleiðanda og án skýjavetur. Jafnvel þegar internetið fer niður hættir heimilið þitt aldrei.",
    "product": "Vara",
    "productLinks": [
      [
        "Eiginleikar",
        "#features"
      ],
      [
        "Verðlagning",
        "#pricing"
      ],
      [
        "Sækja",
        "#downloads"
      ],
      [
        "FAQ",
        "#faq"
      ],
      [
        "Um",
        "/about"
      ]
    ],
    "account": "Viðskiptavinir & Stuðningur",
    "accountLinks": [
      [
        "Hafðu samband & Tæknilegur stuðningur",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Útgáfuminningar & Samfélag",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Sækja öpp",
        "#downloads"
      ]
    ],
    "legal": "Löglegt",
    "legalLinks": [
      [
        "Persónuvernd",
        "/privacy"
      ],
      [
        "Skilmálar",
        "/terms"
      ],
      [
        "Endurgreiðslur",
        "/refund"
      ],
      [
        "Kóða undirritun",
        "/code-signing"
      ],
      [
        "Leggðu til",
        "/contribute"
      ]
    ],
    "rights": "Öll réttindi áskilin.",
    "langSwitchLabel": "Tyrkneska",
    "langSwitchHref": "/tr/"
  }
};
