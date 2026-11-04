import { RELEASES_URL } from "./site-constants.mjs";

export const fi = {
  "title": "NEXUS — Älykoti, jota hallitset omassa verkossasi",
  "ogImageAlt": "NEXUS-älykotiekosysteemi työpöydällä ja mobiilissa",
  "description": "NEXUS on ensisijaisesti paikallinen älykotiekosysteemi Windowsille, macOS:lle, Linuxille, Androidille ja iOS:lle. Suora laitteiden hallinta omassa paikallisessa verkossasi, reagoivat automaatiot ja reaaliaikaiset energiamittarit. Ilmainen ikuisesti; valinnainen NEXUS+ -suunnitelma.",
  "nav": [
    [
      "#features",
      "Ominaisuudet"
    ],
    [
      "#how",
      "Kuinka se toimii"
    ],
    [
      "#integrations",
      "Integraatiot"
    ],
    [
      "#pricing",
      "Hinnoittelu"
    ],
    [
      "#downloads",
      "Lataa"
    ],
    [
      "#faq",
      "UKK"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Paikallinen älykoti",
    "h1a": "Kotisi.",
    "h1b": "Hiljaisesti hallinnassasi.",
    "lead": "Yksi yhtenäinen ekosysteemi valoillesi, ilmastolle, peitteille ja antureille — kommunikoiden suoraan laitteiden kanssa omassa paikallisessa verkossasi. Reagoivat automaatiot, reaaliaikainen tehon mittaus ja hallinta, joka toimii myös, kun internet on poissa käytöstä.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Uusin versio",
    "shotAlt": "NEXUS-käyttöliittymä ja ohjauskeskus",
    "trust": [
      "Ilmaiset, rajattomat laitteet",
      "Hallintaan ei tarvita pilveä",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Tehokas infrastruktuuri. Vaivaton hallinta.",
    "lead": "Jokainen laitteen tila, tehomittaus ja automatisoitu kohtaus toimii suoraan paikallisessa verkossasi ilman ulkoisia pilvipalveluita.",
    "items": [
      [
        "zap",
        "Reagoivat automaatiot",
        "Aika- ja auringonlaskun laukaisemat skenaariot suoritetaan suoraan paikallisella laitteistollasi — ne jatkuvat luotettavasti taustalla työpöydällä."
      ],
      [
        "gauge",
        "Reaaliaikaiset energiankulutuksen lukemat",
        "Lue reaaliaikainen teho ja energiankulutus suoraan tuetuista älypistorasioista ja -kytkimistä paikallisessa verkossasi."
      ],
      [
        "wifi",
        "Paikallisverkon nopeus",
        "Suora LAN-yhteys HTTP:n, TCP:n ja UDP:n kautta yhdistelmien kohdalla mainittuihin merkkeihin. Ei pilven kautta ohjausta."
      ],
      [
        "lock",
        "Tietosuoja suunnittelussa",
        "Kotisi määritykset ja laitteen telemetria pysyvät omassa laitteistossasi. Tilin luominen on pakollista NEXUSin käyttöön; se tallentaa asetuksesi omaan riviisi rivitason käyttöoikeuksien alla. Laitteen komennot kulkevat edelleen paikallisverkkosi kautta."
      ],
      [
        "sparkles",
        "NEXUS AI -äly",
        "Paikalliset älykodin komennot ovat välittömiä ja ilmaisia ikuisesti. Valinnainen pilvi-AI-avustaja tarjoaa älykkäitä ehdotuksia aina kun tarvitset ohjausta."
      ],
      [
        "layers",
        "Avaa paikalliset protokollat",
        "Suorat liittimet kommunikoivat paikallisverkkosi kautta. Matter ja Zigbee liittyvät oman Home Assistant -palvelimesi kautta — Integraatiot-osio listaa, mikä on suoraa ja mikä yhdistetty."
      ]
    ]
  },
  "how": {
    "heading": "Latauksesta yhteyteen minuuteissa.",
    "steps": [
      [
        "1",
        "Asenna ja avaa",
        "Lataa oma asennusohjelma alustallesi (Windows, Linux tai Android). Kirjaudu sitten sisään — tili tarvitaan NEXUSin käyttöön, ja se myös synkronoi asetukset laitteidesi välillä."
      ],
      [
        "2",
        "Lisää laitteesi",
        "Valitse merkki, skannaa paikallinen verkko tai syötä IP-osoite. Merkit, joilla on suora liitin, käyttävät omaa protokollaa — polussa ei ole valmistajan pilveä."
      ],
      [
        "3",
        "Elä kotiasi",
        "Skenejä, aikataulutettuja automaatioita ja todellisia energiankulutuksia — yhtenäinen hallinta tietokoneella ja mobiilissa."
      ]
    ]
  },
  "integrations": {
    "heading": "Toimii jo omistamiesi laitteiden kanssa.",
    "lead": "Ilmaiset, paikalliset protokollat ensin. Kaikki, joilla ei ole suoraa liitintä, toimivat silti Home Assistant -sillan kautta.",
    "groups": [
      [
        "Paikallinen HTTP — kaikilla alustoilla",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue -silta",
          "Home Assistant"
        ]
      ],
      [
        "Paikallisverkko, ei tiliä tai avainta — työpöytäsovellus",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (DIY-tila)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Jokin puuttuu? Pyydä liitin",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Ilmainen käyttää. NEXUS+, kun haluat enemmän",
    "lead": "",
    "currencyNote": "Hinnat USD",
    "plans": [
      {
        "name": "Ilmainen",
        "price": "$0",
        "period": "forever",
        "features": [
          "Rajoittamattomasti laitteita ja huoneita kaikilla tuetuilla paikallisilla protokollilla",
          "Ei riippuvuutta pilvestä: toimii paikallisesti omassa LAN-verkossasi",
          "30 NEXUS AI -komentoa ja laite-toimintoa päivässä",
          "Aikataulutetut paikalliset automaatiot ja mukautetut kohtaukset",
          "Usean laitteen tilien synkronointi (huoneet, laitteet, kohtaukset)",
          "100 % yksityinen: ei seurantaa, ei tietojen keruuta"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "kuukaudessa",
        "badge": "Suosituin",
        "features": [
          "Kaikki ilmaisessa tasossa, plus:",
          "2 000 NEXUS AI -vastausta kuukaudessa päivittäisen 30 sijaan",
          "Pyydä NEXUS AI:ta asettamaan kohtauksia ja vastaamaan selkokielellä",
          "Yksi tili, voimassa kaikissa NEXUS-laitteissa",
          "Ilmainen kokeilu — 3 päivää kuukausitilauksessa, 7 päivää vuositilauksessa; peruuta kauden lopussa"
        ],
        "cta": {
          "label": "Aloita ilmainen kokeilu",
          "monthlyLabel": "Aloita 3 päivän ilmainen kokeilu",
          "yearlyLabel": "Aloita 7 päivän ilmainen kokeilu",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Perhe",
        "price": "Ilmainen",
        "period": "koko perheelle",
        "badge": "Koko koti",
        "features": [
          "Kotitalouden jäsenet roolipohjaisilla käyttöoikeuksilla — ei jäsentarrajua",
          "Omistaja-, jäsen- ja vierasroolit",
          "Jäsennäkohtainen hallinta, kutsu- ja asetusoikeudet",
          "Kaukokytkennät ja automaatiot synkronoituvat omilla kirjautuneilla laitteillasi",
          "Aktiivinen koko ekosysteemissä (työpöytä ja mobiili)",
          "Täysin ilmainen kodillesi"
        ],
        "cta": {
          "label": "Aloita Perheestä",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Peruuta milloin tahansa sovelluksen Laskutus-osiossa tai tilisi kautta tällä sivustolla. Peruuttaminen astuu voimaan nykyisen jakson lopussa."
  },
  "downloads": {
    "heading": "Natiivisti kaikilla työpöydillä. Kotoa puhelimellasi.",
    "lead": "Aina ilmainen. Jokainen asennusohjelma toimitetaan julkaistun SHA-256-tarkistussumman kanssa, jotta voit varmistaa, mitä asennat.",
    "cards": [
      [
        "windows",
        "monitor",
        "Windows",
        "Windows 10/11 · 64-bittinen",
        "NEXUS-Setup.exe",
        ".exe"
      ],
      [
        "linux",
        "terminal",
        "Linux",
        "Debian ja Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · allekirjoitettu APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Versio",
    "sizeLabel": "Koko",
    "webCard": {
      "title": "Yksi tili, koko ekosysteemisi kattava",
      "desc": "Windows- ja Linux-työpöytäohjelmat sekä Android-sovellus. Kirjautuneena, huoneesi, laitteesi, kohtaukset ja automaatiot pysyvät saumattomasti synkronoituina eri näyttöjen välillä.",
      "cta": {
        "label": "Lataa NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Windowsissa helpoin tapa on Microsoft Store: paketti on allekirjoitettu Microsoftin toimesta ja päivitykset tulevat Storesta. Suora .exe-tiedosto ei ole allekirjoitettu, joten Windows saattaa varoittaa “tuntemattomasta julkaisijasta” — katso tarkistussummat."
  },
  "faq": {
    "heading": "Tärkeät kysymykset, vastattu.",
    "items": [
      [
        "Toimiiko NEXUS täysin omassa paikallisverkossani?",
        "Kyllä. NEXUS on rakennettu tiukalle paikalliselle ensi-periaatteelle. Laitteesi, huoneesi, kohtauksesi ja anturitiedot käsitellään suoraan omassa kotilaitteistossasi. Internetkatkosten aikana kaikki paikalliset ohjaukset, valaistus ja automaatiot toimivat saumattomasti ilman viivettä. Turvallinen kirjautuminen synkronoi asetuksesi kaikilla näytöilläsi."
      ],
      [
        "Pitääkö minun asentaa NEXUS vai toimiiko se selaimessa?",
        "Asenna työpöytäsovellus (Windows tai Linux) tai Android-sovellus. NEXUS ei ole saatavilla selainsovelluksena. Laitteiden komennot kulkevat omassa paikallisessa verkossasi. Shelly, Philips Hue, ESPHome, Tasmota, WLED ja Home Assistant käyttävät paikallista HTTP:tä työpöytäsovelluksessa ja Androidilla. TP-Link Kasa ja Yeelight tarvitsevat raakaa TCP:tä, joten ne toimivat työpöytäsovelluksessa. Tämä sivusto on tarkoitettu tilille, latauksille ja laskutukselle."
      ],
      [
        "Mitä NEXUS+ -suunnitelma lisää?",
        "Perus älykodin ohjaus—rajoittamattomat laitteet, huoneet, offline-automatiikat ja paikalliset kojelaudat—on ilmainen. NEXUS+ sisältää kaiken, mitä Free-versio sisältää, NEXUS AI:n kohtauksia ja kysymyksiä varten selkokielellä, 2 000 vastausta kuukaudessa, edistyneet yhteydet Home Assistant -laitteiden lisäämiseen ja yhden tilin jokaisessa laitteessa, 3 päivän kuukausi- tai 7 päivän vuosikokeilulla. Laitteiden komennot toimivat edelleen paikallisesti. Kotitalouden roolit sisältyvät kotiisi ilman lisäkustannuksia."
      ],
      [
        "Mihin tiliin NEXUS+-tilaukseni kuuluu?",
        "Sähköpostiosoite, jota käytettiin kassalla. Kirjaudu sisään tällä sivustolla tai sovelluksessa ennen maksamista: kassa avautuu silloin täytetyllä tilisi sähköpostiosoitteella ja tilaus näkyy jokaisella laitteella, jolle kirjaudut sisään. NEXUS+:ia ei voi ostaa ilman tiliä. Jos maksat eri sähköpostilla, tilaus tallennetaan kyseisen sähköpostin alle, eikä se näy tililläsi ennen kuin kirjaudut siihen sähköpostiin."
      ],
      [
        "Miten automaatioita ja aikataulutettuja sääntöjä suoritetaan?",
        "NEXUS-automaatioalusta arvioi aikataulusi ja anturisääntösi laitteella, jota pidät käynnissä — työpöytäsovellus pysyy järjestelmäalustalla ja suorittaa tehtäviä ympäri vuorokauden, joten valaistus-, energia- ja turvarutiinit eivät koskaan odota pilveä. Puhelimestasi käynnistetyt toiminnot ja ajastimet toimivat välittömästi LAN-verkon kautta. Uudet tapahtumat leviävät ilmoituskanaviin, jotka otat käyttöön Instant Notifications -sivulla: sovelluksen sisäinen nauha, järjestelmäilmoitukset, ntfy, Telegram tai oma HTTPS webhookisi."
      ],
      [
        "Mitkä laitteet ja ekosysteemit ovat tuettuja?",
        "NEXUS puhuu jokaisen laitteen omaa paikallista protokollaa: Shelly (Gen1 ja Gen2+), Tasmota, WLED, ESPHome, Philips Hue ja Home Assistant paikallisen HTTP:n kautta kaikilla alustoilla, lisäksi TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY-tila) ja Wake-on-LAN paikallisverkossa työpöytäsovelluksessa, ilman tiliä tai avainta. Kaikki muu — Matter- tai Zigbee-laitteet — liittyvät oman Home Assistant -palvelimesi kautta, jota NEXUS käsittelee yhtenä paikallisena keskuksena. Paikallinen IP-löydettävyys yhdistää laitteet välittömästi, ilman valmistajan pilveä välissä."
      ],
      [
        "Miten turvakamerat ja anturit integroidaan?",
        "NEXUS yhdistää valvontakamerasi, liiketunnistimesi ja ovitunnistimesi keskitettyyn turvallisuuskojelautaan. Voit automatisoida yksityisyystilat, aktivoida valvontarutiinit kotiin lähtiessäsi ja nähdä kaikki liike- tai kosketustapahtumat sovelluksessa — sekä niissä ilmoituskanavissa, jotka aktivoit (järjestelmäilmoitukset, ntfy, Telegram tai oma webhook)."
      ],
      [
        "Voinko peruuttaa NEXUS+-palvelun milloin tahansa?",
        "Kyllä, täysin vaivaton eikä sitoumuksia. Voit peruuttaa yhdellä napsautuksella milloin tahansa: sovelluksen Tilin ja maksujen asetuksista, verkkosivustomme kautta tai suoraan tilauslinkistä maksukuittisi sähköpostissa. Premium-edut pysyvät voimassa laskutusjakson loppuun asti ilman tulevia maksuja. Voinko hallita kotiani ollessani poissa?"
      ],
      [
        "Voinko hallita kotiani, kun olen poissa?",
        "Ei NEXUS-pilven kautta: NEXUS kommunikoi laitteidesi kanssa suoraan kotiverkossasi eikä käytä välityspalvelinta. Jos haluat käyttää sitä ulkopuolelta, liitä puhelimesi tai kannettavasi kotiverkkoon VPN:n, kuten Tailscale (aliverkon reititin) tai WireGuardin kautta reitittimessäsi; NEXUS toimii silloin täsmälleen samalla tavalla kuin kotona. NEXUS ei vielä tue hub-osoitteen asetusta, joten VPN:n on tehtävä paikallinen osoitealueesi saavutettavaksi, ja uusien laitteiden skannaaminen toimii vain kotiverkossa. Älä koskaan altista laitetta internetiin porttiohjauksella. Vaiheittainen opas löytyy repositorion tiedostosta docs/REMOTE-ACCESS.md."
      ],
      [
        "Onko olemassa iPhone-versiota?",
        "App Store -sovellusta ei ole, koska NEXUS ei käytä maksullista Apple Developer -tunnusta. Macin ja ilmaisen Apple ID:n avulla voit rakentaa sen omalle iPhonellesi (opas: docs/IOS-BUILD.md), ja julkaisu saattaa myös sisältää allekirjoittamattoman IPA-tiedoston, jonka AltStore tai Sideloadly voi allekirjoittaa puolestasi; tätä polkua ei ole vielä testattu oikealla iPhonella. Ilmainen Apple ID vanhentaa sovelluksen 7 päivän kuluttua, eikä ilmoituksia sovelluksen ollessa suljettuna ole saatavilla iOS:ssä. Kotikeskus on edelleen työpöytäsovellus; iPhone on asiakas."
      ],
      [
        "Laitteeni ei ole listalla. Mitä voin tehdä?",
        "NEXUS tukee vain laitteita, joilla on dokumentoitu paikallinen protokolla; pelkästään pilvessä toimivia laitteita ei tueta, koska NEXUS ei koskaan kommunikoi valmistajan pilven kanssa. Yhteensopivuuslista (docs/COMPATIBILITY.md) sisältää myös Sonoffin DIY-tilassa, WiZ:n, LIFX:n, Goveen (LAN) ja Wake-on-LANin. Jokaiselle näistä on olemassa automatisoidut protokollatestit, mutta malli lasketaan vahvistetuksi vasta, kun joku ilmoittaa, että se toimi oikeassa laitteessa. Ota meihin yhteyttä tämän sivuston yhteydenottolomakkeen kautta (valitse \"New Device / Connector Request\") tai sähköpostitse: mainitse merkki ja malli, mitä odotit ja mitä tapahtui. Ilmoittaminen, että malli toimi oikeassa laitteessasi, merkitsee sen vahvistetuksi; älä koskaan sisällytä salasanoja, paikallisia avaimia tai tokeneita."
      ],
      [
        "Tarvitsenko tilin? Mitä tapahtuu, jos palvelin on poissa käytöstä?",
        "Kyllä: kirjaudut kerran sisään ilmaisella sähköpostitilillä avataksesi NEXUSin. Tämän jälkeen laitteiden ohjaaminen ja automaatioiden suorittaminen tapahtuu omassa verkossasi ja toimii edelleen ilman internetiä. Tili lisää synkronoinnin laitteidesi, Perheen ja tekoälyavustajan välillä, jotka käyttävät ilmaisia pilvipalveluja rajoituksin. Kun jokin näistä ei ole käytettävissä, esimerkiksi kun ilmainen Supabase-projekti on tauolla noin viikon käyttämättömyyden jälkeen, pilvinäytöt sanovat, että palvelimeen ei saada yhteyttä sen sijaan että näytettäisiin, että jotain on tallennettu; laitteet, automaatiot ja ilmaisinalue toimivat edelleen. Jos tekoälyn kiintiö tai palvelu on käytetty loppuun, avustaja sanoo, ettei se voinut vastata."
      ],
      [
        "Voinko varmuuskopioida asetukseni ja siirtää ne toiseen laitteeseen?",
        "Kyllä. Asetuksissa on varmuuskopiointiosio, josta voit viedä asetuksesi ja automaatiot JSON-tiedostoon ja tuoda sen toisella laitteella tai uudelleenasennuksen jälkeen. Salasanat, tunnukset ja paikalliset avaimet on poistettu liitetystä laitelistasta tiedostossa, joten syötä ne uudelleen palauttamisen jälkeen. Pidä varmuuskopiotiedosto yksityisenä."
      ],
      [
        "Voinko viedä energiadataani?",
        "Kyllä. Energiasivu voi viedä laitteidesi uusimmat todelliset tehon mittaukset CSV- tai JSON-tiedostona. NEXUSissa on tietoja vain laitteista, jotka todella raportoivat tehoa; jos laitteita ei ole paritettu, ei ole mitään vietävää."
      ],
      [
        "Miksi Windows varoittaa minua, kun suoritan asennusohjelman?",
        "Asenna Microsoft Storesta, etkä näe tätä varoitusta: Microsoft allekirjoittaa kyseisen paketin sertifioinnin aikana ja toimittaa päivitykset Storen kautta. Suora .exe-lataus ei ole vielä allekirjoitettu kaupallisella varmenteella, joten SmartScreen saattaa näyttää \"tuntematon julkaisija\". Voit verrata tiedostoa latausosion luetteloituihin tarkistussummiin ennen sen suorittamista. Koodin allekirjoituspolitiikkamme on linkitetty sivun alatunnisteesta."
      ]
    ]
  },
  "about": {
    "title": "Tietoja NEXUSista",
    "lead": "Itsenäinen, paikalliseen käyttöön ensisijaisesti suunniteltu älykoti-alusta, joka on suunniteltu nopeuteen, täydelliseen yksityisyyteen ja todelliseen laitteiston omistukseen. Keskustelemalla suoraan laitteidesi kanssa oman kotiverkkosi kautta, NEXUS poistaa pilvirajoitukset lopullisesti. Miksi rakensimme NEXUSin",
    "manifesto": {
      "heading": "Miksi rakensimme NEXUSin",
      "text": "Nykyaikainen älykotiteollisuus otti väärän käännöksen. Suljetut ekosysteemit pakottivat kodinomistajat pakollisiin tilauksiin, pilvestä riippuvaan viiveeseen ja tunkeilevaan telemetrian seurantaan. Kun internetyhteytesi menee poikki, olohuoneen kytkimesi ei pitäisi lakata toimimasta. Rakensimme NEXUSin, koska uskomme, että kotisi on turvapaikkasi: pohjapiirroksesi, kameratilasi ja päivittäiset perherutiinisi kuuluvat ehdottomasti vain omaan laitteistoon."
    },
    "pillars": [
      {
        "title": "Paikallinen-Ensin Nopeus",
        "desc": "Jokainen automaatio ja komento suoritetaan paikallisessa LAN-verkossasi millisekunneissa. Ei edestakaisia matkoja etäpilvipalvelimille, ei viivettä."
      },
      {
        "title": "Kompromissiton yksityisyys",
        "desc": "Ei analytiikkatelemtriaa, ei käyttäytymisprofiilien luomista eikä yksityisten rutiiniesi myyntiä. Tili vaaditaan; asetuksesi tallennetaan omaan rivisuojattuun tiliriviisi. Laitteen komennot pysyvät edelleen paikallisessa verkossasi."
      },
      {
        "title": "Ei toimittajapotkupulmia",
        "desc": "Avoimet paikalliset protokollat ensin: Shelly, Philips Hue, ESPHome, Tasmota ja WLED vastaavat suoraan NEXUSille, ja kaikki muu liittyy oman Home Assistant -palvelimesi kautta sen sijaan, että käyttäisit toimittajan pilveä."
      },
      {
        "title": "Rehellinen, kestävä SaaS",
        "desc": "Ydinsmart-kodin hallinta on täysin ilmaista ja rajatonta ikuisesti. NEXUS+ on NEXUS AI -suunnitelma ja auttaa kattamaan tuon pilvikäytön."
      }
    ],
    "architecture": {
      "heading": "Suunniteltu luotettavuutta varten",
      "lead": "NEXUS pitää kevyen työpöytämoottorin järjestelmäkuvakkeen joukossa, jotta aikataulut ja anturisäännöt arvioituvat, kun tietokoneesi on päällä, ja mobiilisovellus avautuu suoraan samalle paikallisverkolle.",
      "items": [
        {
          "icon": "layers",
          "title": "Työpöytä",
          "desc": "Windows-, macOS- ja Linux-sovellukset pysyvät järjestelmäkuvakkeessa ja pitävät paikalliset aikataulut ja anturisäännöt käynnissä, kun tietokone on päällä. Windows ja Linux toimitetaan valmiina asennusohjelmina; macOS rakennetaan lähdekoodista (allekirjoittamaton: hiiren oikea → Avaa)."
        },
        {
          "icon": "wifi",
          "title": "Puhelin",
          "desc": "Android- ja iOS-sovellukset avautuvat samalle paikallisverkolle; laitteen komennot kulkevat silti LAN-verkossasi. Android toimitetaan allekirjoitettuna APK-tiedostona; iOS rakennetaan lähdekoodista Xcoden ja ilmaisen Apple ID:n avulla."
        },
        {
          "icon": "lock",
          "title": "Tili",
          "desc": "Tili vaaditaan, jotta huoneet, laitteet ja kohtaukset ovat samoja kaikilla näytöillä. Laitteen komennot eivät poistu kotiverkostasi."
        }
      ]
    },
    "linksTitle": "Käytännön linkkejä"
  },
  "footer": {
    "tagline": "Ohjaa koko älykotiasi suoraan paikallisverkon kautta — ilman toimittajakytkentää ja ilman pilvisidonnaisuutta. Vaikka internet menisi poikki, kotisi ei koskaan pysähdy.",
    "product": "Tuote",
    "productLinks": [
      [
        "Ominaisuudet",
        "#features"
      ],
      [
        "Hinnoittelu",
        "#pricing"
      ],
      [
        "Lataa",
        "#downloads"
      ],
      [
        "UKK",
        "#faq"
      ],
      [
        "Tietoa",
        "/about"
      ]
    ],
    "account": "Asiakas & Tuki",
    "accountLinks": [
      [
        "Yhteystiedot & Tekninen tuki",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Julkaisumuistiot & Yhteisö",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Lataa sovelluksia",
        "#downloads"
      ]
    ],
    "legal": "Oikeudelliset tiedot",
    "legalLinks": [
      [
        "Tietosuoja",
        "/privacy"
      ],
      [
        "Ehdot",
        "/terms"
      ],
      [
        "Hyvitykset",
        "/refund"
      ],
      [
        "Koodin allekirjoitus",
        "/code-signing"
      ],
      [
        "Osallistu",
        "/contribute"
      ]
    ],
    "rights": "Kaikki oikeudet pidätetään.",
    "langSwitchLabel": "Türkçe",
    "langSwitchHref": "/tr/"
  }
};
