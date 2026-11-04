import { RELEASES_URL } from "./site-constants.mjs";

export const sw = {
  title: "NEXUS — Nyumba yako janja, inayodhibitiwa kwenye mtandao wako mwenyewe",
  ogImageAlt: "Mfumo wa nyumba janja wa NEXUS kwenye kompyuta na simu",
  description:
    "NEXUS ni mfumo wa nyumba janja unaotanguliza mtandao wa ndani kwa Windows, macOS, Linux, Android na iOS. Udhibiti wa moja kwa moja wa vifaa kupitia mtandao wako wa ndani, otomatiki za haraka, na vipimo vya nishati vya moja kwa moja. Bure milele; mpango wa hiari wa NEXUS+.",
  nav: [
    ["#features", "Vipengele"],
    ["#how", "Jinsi inavyofanya kazi"],
    ["#integrations", "Miunganisho"],
    ["#pricing", "Bei"],
    ["#downloads", "Pakua"],
    ["#faq", "Maswali"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Nyumba janja inayotanguliza mtandao wa ndani",
    h1a: "Nyumba yako.",
    h1b: "Kimya kimya chini ya udhibiti wako.",
    lead: "Mfumo mmoja wa pamoja wa taa, hali ya hewa, pazia na vihisi vyako — unaozungumza moja kwa moja na vifaa vilivyo kwenye mtandao wako wa ndani. Otomatiki za haraka, upimaji wa umeme wa moja kwa moja, na udhibiti unaoendelea kufanya kazi intaneti ikikatika.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Toleo jipya zaidi",
    shotAlt: "Kiolesura na kituo cha udhibiti cha NEXUS",
    trust: [
      "Bure, vifaa bila kikomo",
      "Hakuna wingu linalohitajika kwa udhibiti",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Miundombinu yenye nguvu. Udhibiti usio na usumbufu.",
    lead: "Kila hali ya kifaa, kipimo cha umeme, na onyesho la otomatiki hufanya kazi moja kwa moja kwenye mtandao wako wa ndani bila kutegemea wingu la nje.",
    items: [
      [
        "zap",
        "Otomatiki za haraka",
        "Matukio yanayoanzishwa kwa wakati au machweo hutekelezwa moja kwa moja kwenye vifaa vyako vya ndani — na huendelea kwa uhakika chinichini kwenye kompyuta.",
      ],
      [
        "gauge",
        "Usomaji wa nishati wa moja kwa moja",
        "Soma wati na matumizi ya umeme wa wakati halisi moja kwa moja kutoka kwa plagi na swichi janja zinazotumika kwenye mtandao wako wa ndani.",
      ],
      [
        "wifi",
        "Kasi ya mtandao wa ndani",
        "Mawasiliano ya moja kwa moja ya LAN kupitia HTTP, TCP na UDP na chapa zilizoorodheshwa chini ya Miunganisho. Hakuna kituo cha wingu katika njia ya amri.",
      ],
      [
        "lock",
        "Faragha kwa muundo",
        "Mipangilio ya nyumba yako na telemetria ya vifaa hubaki kwenye vifaa vyako vya ndani. Akaunti inahitajika ili kutumia NEXUS; huhifadhi mipangilio yako kwenye safu yako mwenyewe chini ya udhibiti wa ufikiaji wa kiwango cha safu. Amri za vifaa bado hupita kwenye LAN yako.",
      ],
      [
        "sparkles",
        "Akili ya NEXUS AI",
        "Amri za ndani za nyumba janja ni za papo hapo na bure milele. Msaidizi wa hiari wa AI wa wingu hutoa mapendekezo janja kila unapohitaji mwongozo.",
      ],
      [
        "layers",
        "Itifaki wazi za ndani",
        "Viunganishi vya moja kwa moja huzungumza kwenye LAN yako. Matter na Zigbee huunganishwa kupitia seva yako mwenyewe ya Home Assistant — sehemu ya Miunganisho inaorodhesha lipi ni la moja kwa moja na lipi linapitia daraja.",
      ],
    ],
  },
  how: {
    heading: "Kutoka kupakua hadi kuunganishwa kwa dakika chache.",
    steps: [
      [
        "1",
        "Sakinisha na ufungue",
        "Pakua kisakinishi asilia cha jukwaa lako (Windows, Linux au Android). Kisha ingia — akaunti inahitajika ili kutumia NEXUS, na pia husawazisha mipangilio kwenye skrini zako zote.",
      ],
      [
        "2",
        "Ongeza vifaa vyako",
        "Chagua chapa yako, changanua mtandao wa ndani au weka anwani ya IP. Chapa zenye kiunganishi cha moja kwa moja huzungumza itifaki yake yenyewe — hakuna wingu la mtengenezaji katika njia hiyo.",
      ],
      [
        "3",
        "Ishi nyumba yako",
        "Maonyesho, otomatiki zilizopangwa na usomaji halisi wa nishati — udhibiti wa pamoja kwenye kompyuta na simu.",
      ],
    ],
  },
  integrations: {
    heading: "Inafanya kazi na ulichonacho tayari.",
    lead: "Itifaki za bure na za ndani kwanza. Kisicho na kiunganishi cha moja kwa moja bado kinafanya kazi kupitia daraja la Home Assistant.",
    groups: [
      [
        "HTTP ya ndani — kwenye kila jukwaa",
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
        "Mtandao wa ndani, bila akaunti wala ufunguo — programu ya kompyuta",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (hali ya DIY)", "Wake-on-LAN"],
      ],
    ],
    more: "Kuna kinachokosekana? Omba kiunganishi",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Bure kutumia. NEXUS+ unapotaka zaidi",
    lead: "",
    currencyNote: "Bei ni kwa USD",
    plans: [
      {
        name: "Bure",
        price: "$0",
        period: "milele",
        features: [
          "Vifaa na vyumba bila kikomo kwenye kila itifaki ya ndani inayotumika",
          "Hakuna utegemezi wa wingu: inafanya kazi ndani ya LAN yako mwenyewe",
          "Amri 30 za kila siku za NEXUS AI na vitendo vya vifaa",
          "Otomatiki za ndani zilizopangwa na maonyesho maalum",
          "Usawazishaji wa akaunti kwenye vifaa vingi (vyumba, vifaa, maonyesho)",
          "Faragha 100%: hakuna ufuatiliaji, hakuna ukusanyaji wa data",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "kwa mwezi",
        badge: "Maarufu zaidi",
        features: [
          "Kila kitu katika kiwango cha Bure, pamoja na:",
          "Majibu 2,000 ya NEXUS AI kwa mwezi badala ya 30 kwa siku",
          "Muulize NEXUS AI aweke maonyesho na ajibu kwa lugha ya kawaida",
          "Akaunti moja, inayofaa kwenye kila kifaa cha NEXUS",
          "Jaribio la bure — siku 3 kwa mwezi, siku 7 kwa mwaka; ghairi mwishoni mwa kipindi",
        ],
        cta: {
          label: "Anza jaribio lako la bure",
          monthlyLabel: "Anza jaribio la bure la siku 3",
          yearlyLabel: "Anza jaribio la bure la siku 7",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Familia",
        price: "Bure",
        period: "kwa familia nzima",
        badge: "Nyumba nzima",
        features: [
          "Wanakaya wenye ufikiaji kulingana na majukumu — hakuna kikomo cha wanachama",
          "Majukumu ya mmiliki, mwanachama na mgeni",
          "Ruhusa za udhibiti, mialiko na mipangilio kwa kila mwanachama",
          "Maonyesho na otomatiki husawazishwa kwenye vifaa vyako ulivyoingia navyo",
          "Inatumika katika mfumo mzima (kompyuta na simu)",
          "Bure kabisa pamoja na nyumba yako",
        ],
        cta: { label: "Anza na Familia", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Ghairi wakati wowote kupitia Bili ndani ya programu au kutoka kwenye akaunti yako kwenye tovuti hii. Kughairi kunaanza kutumika mwishoni mwa kipindi cha sasa.",
  },
  downloads: {
    heading: "Asilia kwenye kila kompyuta. Nyumbani kwenye simu yako.",
    lead: "Daima bure. Kila kisakinishi huja na checksum ya SHA-256 iliyochapishwa ili uweze kuthibitisha unachosakinisha.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian na Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK iliyotiwa saini",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Toleo",
    sizeLabel: "Ukubwa",
    webCard: {
      title: "Akaunti moja, katika mfumo wako wote",
      desc: "Programu za kompyuta za Windows na Linux na programu ya Android. Ukiwa umeingia, vyumba, vifaa, maonyesho na otomatiki zako husalia zimesawazishwa vizuri kwenye skrini zako zote.",
      cta: { label: "Pakua NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Kwenye Windows njia rahisi zaidi ni Microsoft Store: kifurushi kimetiwa saini na Microsoft na masasisho huja kupitia Store. .exe ya moja kwa moja haijatiwa saini, hivyo Windows inaweza kuonya kuhusu “mchapishaji asiyejulikana” — angalia checksums.",
  },
  faq: {
    heading: "Maswali muhimu, yamejibiwa.",
    items: [
      [
        "Je, NEXUS hufanya kazi kabisa kwenye mtandao wangu wa ndani?",
        "Ndiyo. NEXUS imejengwa juu ya usanifu madhubuti unaotanguliza mtandao wa ndani. Vifaa vyako, vyumba, maonyesho na telemetria ya vihisi huchakatwa moja kwa moja kwenye vifaa vya nyumbani kwako. Hata intaneti ikikatika, udhibiti wote wa ndani, taa na otomatiki huendelea kufanya kazi bila usumbufu na bila ucheleweshaji. Kuingia husawazisha mipangilio yako kwa usalama kwenye skrini zako zote.",
      ],
      [
        "Je, ninahitaji kusakinisha NEXUS, au inafanya kazi kwenye kivinjari?",
        "Sakinisha programu ya kompyuta (Windows au Linux) au programu ya Android. NEXUS haitolewi kama programu ya kivinjari. Amri za vifaa hupita kwenye mtandao wako wa ndani. Shelly, Philips Hue, ESPHome, Tasmota, WLED na Home Assistant hutumia HTTP ya ndani kwenye programu ya kompyuta na kwenye Android. TP-Link Kasa na Yeelight zinahitaji TCP ghafi, hivyo zinafanya kazi kwenye programu ya kompyuta. Tovuti hii ni ya akaunti, upakuaji na bili.",
      ],
      [
        "Mpango wa NEXUS+ unaongeza nini?",
        "Udhibiti msingi wa nyumba janja — vifaa vingi bila kikomo, vyumba, otomatiki zisizohitaji intaneti na dashibodi za ndani — ni bure. NEXUS+ inajumuisha kila kitu katika Bure, NEXUS AI kwa maonyesho na maswali kwa lugha ya kawaida, majibu 2,000 kwa mwezi, miunganisho ya hali ya juu ya kuongeza vifaa vya Home Assistant, na akaunti moja kwenye kila kifaa, pamoja na jaribio la siku 3 kwa mwezi au siku 7 kwa mwaka. Amri za vifaa bado hufanya kazi ndani. Majukumu ya kaya yamejumuishwa na nyumba yako bila gharama ya ziada.",
      ],
      [
        "Usajili wangu wa NEXUS+ unahusiana na akaunti gani?",
        "Anwani ya barua pepe iliyotumika wakati wa kulipa. Ingia kwenye tovuti hii au kwenye programu kabla ya kulipa: ukurasa wa malipo kisha hufunguka ukiwa na barua pepe ya akaunti yako tayari, na usajili huonekana kwenye kila kifaa unachoingia. NEXUS+ haiwezi kununuliwa bila akaunti. Ukilipa kwa barua pepe tofauti, usajili huhifadhiwa chini ya barua pepe hiyo na hautaonekana kwenye akaunti yako hadi uingie nayo.",
      ],
      [
        "Otomatiki na sheria zilizopangwa hufanya kazi vipi?",
        "Injini ya otomatiki ya NEXUS hutathmini ratiba na sheria zako za vihisi kwenye kifaa unachokiacha kikiwa kimewashwa — programu ya kompyuta hubaki kwenye trei ya mfumo na hufanya kazi saa zote, hivyo taratibu za taa, nishati na usalama hazisubiri wingu kamwe. Maonyesho na vipima muda vinavyoanzishwa kutoka kwenye simu yako hutumika papo hapo kupitia LAN yako. Matukio mapya hutumwa kwenye njia za arifa unazowasha kwenye ukurasa wa Arifa za Papo Hapo: utepe ulio ndani ya programu, arifa za mfumo, ntfy, Telegram, au webhook yako ya HTTPS.",
      ],
      [
        "Ni vifaa na mifumo gani inayotumika?",
        "NEXUS huzungumza itifaki ya ndani ya kila kifaa: Shelly (Gen1 na Gen2+), Tasmota, WLED, ESPHome, Philips Hue na Home Assistant kupitia HTTP ya ndani kwenye kila jukwaa, pamoja na TP-Link Kasa, Yeelight, WiZ, Sonoff (hali ya DIY) na Wake-on-LAN kupitia mtandao wa ndani kwenye programu ya kompyuta, bila akaunti wala ufunguo. Kila kitu kingine — vifaa vya Matter au Zigbee — huunganishwa kupitia seva yako mwenyewe ya Home Assistant, ambayo NEXUS huichukulia kama kitovu kimoja cha ndani. Ugunduzi wa IP ya ndani huoanisha vifaa papo hapo, bila wingu la mtengenezaji katikati.",
      ],
      [
        "Kamera za usalama na vihisi huunganishwaje?",
        "NEXUS huunganisha kamera zako za usalama, vigunduzi vya mwendo na vihisi vya mlango katika dashibodi moja ya usalama. Unaweza kuweka otomatiki za hali za faragha, kuwasha taratibu za ulinzi unapoondoka nyumbani, na kuona kila tukio la mwendo au mguso ndani ya programu — pamoja na kwenye njia za arifa unazowasha (arifa za mfumo, ntfy, Telegram, au webhook yako mwenyewe).",
      ],
      [
        "Naweza kughairi NEXUS+ wakati wowote?",
        "Ndiyo, bila usumbufu wowote na bila ahadi. Unaweza kughairi kwa kubofya mara moja wakati wowote: kutoka kwenye mipangilio ya Akaunti na Bili ndani ya programu, kupitia tovuti yetu, au moja kwa moja kutoka kwenye kiungo cha agizo kilicho kwenye risiti ya barua pepe ya bili yako. Manufaa yako ya premium hubaki hai hadi mwisho wa mzunguko wako wa bili, bila malipo yoyote ya baadaye.",
      ],
      [
        "Naweza kudhibiti nyumba yangu nikiwa mbali?",
        "Sio kupitia wingu la NEXUS: NEXUS huzungumza na vifaa vyako moja kwa moja kwenye mtandao wako wa nyumbani na haina kituo cha kupitisha. Ili kuufikia ukiwa nje, weka simu au kompyuta yako mpakato kwenye mtandao wa nyumbani kwa kutumia VPN kama Tailscale (subnet router) au WireGuard kwenye kipanga njia chako; NEXUS kisha hufanya kazi kama ilivyo nyumbani. NEXUS bado haina mpangilio wa anwani ya kitovu, hivyo VPN lazima ifanye safu ya anwani zako za ndani ipatikane, na kutafuta vifaa vipya kunafanya kazi kwenye mtandao wa nyumbani pekee. Kamwe usianike kifaa kwenye intaneti kwa kutumia port forwarding. Mwongozo wa hatua kwa hatua ni docs/REMOTE-ACCESS.md kwenye hazina ya msimbo.",
      ],
      [
        "Je, kuna toleo la iPhone?",
        "Hakuna programu ya App Store, kwa sababu NEXUS haitumii akaunti ya Apple Developer inayolipiwa. Ukiwa na Mac na Apple ID ya bure unaweza kuijenga kwa ajili ya iPhone yako mwenyewe (mwongozo: docs/IOS-BUILD.md), na toleo linaweza pia kuambatisha IPA isiyotiwa saini ambayo AltStore au Sideloadly zinaweza kuitia saini kwa ajili yako; njia hiyo bado haijathibitishwa kwenye iPhone halisi. Apple ID ya bure hufanya programu iishe muda baada ya siku 7, na arifa programu ikiwa imefungwa hazipatikani kwenye iOS. Kitovu cha nyumbani bado ni programu ya kompyuta; iPhone ni mteja.",
      ],
      [
        "Kifaa changu hakipo kwenye orodha. Naweza kufanya nini?",
        "NEXUS inasaidia vifaa vyenye itifaki ya ndani iliyoandikwa pekee; vifaa vya wingu pekee havitumiki kwa sababu NEXUS haizungumzi kamwe na wingu la mtengenezaji. Orodha ya utangamano (docs/COMPATIBILITY.md) pia inajumuisha Sonoff katika hali ya DIY, WiZ, LIFX, Govee (LAN) na Wake-on-LAN. Kila moja kati ya hizi ina majaribio ya kiotomatiki ya itifaki, lakini modeli huhesabiwa kuwa imethibitishwa pale tu mtu anaporipoti kwamba ilifanya kazi kwenye kifaa halisi. Tuandikie kupitia fomu ya mawasiliano kwenye tovuti hii (chagua “New Device / Connector Request”) au kwa barua pepe: chapa na modeli, ulichotarajia na kilichotokea. Kutuambia kwamba modeli ilifanya kazi kwenye kifaa chako halisi ndiko kunakoiweka alama ya kuthibitishwa; kamwe usijumuishe manenosiri, funguo za ndani au tokeni.",
      ],
      [
        "Je, ninahitaji akaunti? Nini hutokea seva ikiwa chini?",
        "Ndiyo: unaingia mara moja kwa akaunti ya barua pepe ya bure ili kufungua NEXUS. Baada ya hapo, kudhibiti vifaa na kuendesha otomatiki hufanyika kwenye mtandao wako mwenyewe na huendelea kufanya kazi bila intaneti. Akaunti huongeza usawazishaji kwenye vifaa vyako, Familia na msaidizi wa AI, vinavyotumia huduma za wingu za bure zenye mipaka. Moja ya hizo ikikosekana, kwa mfano pale mradi wa bure wa Supabase unaposimamishwa baada ya takriban wiki moja bila shughuli, skrini za wingu husema seva haipatikani badala ya kuonyesha kitu kama kilichohifadhiwa; vifaa, otomatiki na trei huendelea kufanya kazi. Kama kikomo cha AI au huduma kimeisha, msaidizi husema hakuweza kujibu.",
      ],
      [
        "Naweza kuhifadhi nakala ya mipangilio yangu na kuihamishia kifaa kingine?",
        "Ndiyo. Mipangilio ina sehemu ya nakala rudufu ambapo unaweza kuhamisha mipangilio na otomatiki zako kwenye faili ya JSON na kuiingiza kwenye kifaa kingine au baada ya kusakinisha upya. Manenosiri, tokeni na funguo za ndani huondolewa kwenye orodha ya vifaa vilivyooanishwa ndani ya faili, hivyo viweke tena baada ya kurejesha. Weka faili ya nakala rudufu kuwa siri.",
      ],
      [
        "Naweza kuhamisha data yangu ya nishati?",
        "Ndiyo. Ukurasa wa Nishati unaweza kuhamisha usomaji halisi wa hivi karibuni wa umeme kutoka kwenye vifaa vyako kama faili ya CSV au JSON. NEXUS ina data kwa vifaa vinavyoripoti umeme pekee; bila kifaa chochote kilichooanishwa, hakuna cha kuhamisha.",
      ],
      [
        "Kwa nini Windows hunionya ninapoendesha kisakinishi?",
        "Sakinisha kutoka Microsoft Store na hutaona onyo hili: Microsoft hutia saini kifurushi hicho wakati wa uthibitishaji na hutoa masasisho kupitia Store. Upakuaji wa moja kwa moja wa .exe bado haujatiwa saini kwa cheti cha kibiashara, hivyo SmartScreen inaweza kuonyesha “mchapishaji asiyejulikana”. Unaweza kulinganisha faili na checksums zilizoorodheshwa kwenye sehemu ya upakuaji kabla ya kuiendesha. Sera yetu ya kutia saini msimbo imeunganishwa kwenye kijachini cha tovuti.",
      ],
    ],
  },
  about: {
    title: "Kuhusu NEXUS",
    lead: "Jukwaa huru la nyumba janja linalotanguliza mtandao wa ndani, lililobuniwa kwa kasi, faragha kamili na umiliki halisi wa vifaa. Kwa kuzungumza moja kwa moja na vifaa vyako kupitia mtandao wako wa nyumbani, NEXUS huondoa kabisa kufungwa na wingu.",
    manifesto: {
      heading: "Kwa nini tulijenga NEXUS",
      text: "Sekta ya kisasa ya nyumba janja ilichukua njia isiyo sahihi. Mifumo funge ililazimisha wamiliki wa nyumba kuingia kwenye usajili wa lazima, ucheleweshaji unaotegemea wingu na ufuatiliaji vamizi wa telemetria. Intaneti yako ikikatika, swichi ya sebuleni mwako haipaswi kuacha kufanya kazi. Tulijenga NEXUS kwa sababu tunaamini nyumba yako ni kimbilio lako: mpangilio wa nyumba yako, hali za kamera zako na taratibu zako za kila siku za familia ni mali ya vifaa vyako mwenyewe pekee.",
    },
    pillars: [
      {
        title: "Kasi ya ndani kwanza",
        desc: "Kila otomatiki na amri hutekelezwa kupitia LAN yako ya ndani kwa milisekunde. Hakuna safari za kwenda kwenye seva za wingu za mbali, hakuna ucheleweshaji.",
      },
      {
        title: "Faragha bila maelewano",
        desc: "Hakuna telemetria ya uchanganuzi, hakuna uainishaji wa tabia, na hakuna kuuza taratibu zako za faragha. Akaunti inahitajika; mipangilio yako huhifadhiwa kwenye safu yako ya akaunti iliyolindwa kwa kiwango cha safu. Amri za vifaa bado hubaki kwenye LAN yako.",
      },
      {
        title: "Hakuna kufungwa na mtengenezaji",
        desc: "Itifaki wazi za ndani kwanza: Shelly, Philips Hue, ESPHome, Tasmota na WLED hujibu NEXUS moja kwa moja, na kingine chochote huunganishwa kupitia seva yako mwenyewe ya Home Assistant badala ya wingu la mtengenezaji.",
      },
      {
        title: "SaaS ya uaminifu na endelevu",
        desc: "Usimamizi msingi wa nyumba janja ni bure kabisa na bila kikomo milele. NEXUS+ ni mpango wa NEXUS AI na husaidia kugharamia matumizi hayo ya wingu.",
      },
    ],
    architecture: {
      heading: "Imejengwa kwa uaminifu",
      lead: "NEXUS huweka injini nyepesi ya kompyuta kwenye trei ya mfumo wako ili ratiba na sheria za vihisi ziendelee kutathminiwa kompyuta ikiwa imewashwa, na programu ya simu hufunguka moja kwa moja kwenye mtandao ule ule wa ndani.",
      items: [
        {
          icon: "layers",
          title: "Kompyuta",
          desc: "Programu za Windows, macOS na Linux hubaki kwenye trei ya mfumo na huendeleza ratiba za ndani na sheria za vihisi kompyuta ikiwa imewashwa. Windows na Linux huja kama visakinishi tayari; macOS hujengwa kutoka kwenye msimbo chanzo (haijatiwa saini: bofya kulia → Open).",
        },
        {
          icon: "wifi",
          title: "Simu",
          desc: "Programu za Android na iOS hufunguka kwenye mtandao ule ule wa ndani; amri za vifaa bado hupita kwenye LAN yako. Android huja kama APK iliyotiwa saini; iOS hujengwa kutoka kwenye msimbo chanzo kwa Xcode na Apple ID ya bure.",
        },
        {
          icon: "lock",
          title: "Akaunti",
          desc: "Akaunti inahitajika ili vyumba, vifaa na maonyesho vilingane kwenye kila skrini. Amri za vifaa haziondoki kwenye mtandao wako wa nyumbani.",
        },
      ],
    },
    linksTitle: "Viungo vya msaada",
  },
  footer: {
    tagline:
      "Dhibiti nyumba yako yote janja moja kwa moja kupitia mtandao wako wa ndani — bila kufungwa na mtengenezaji na bila kutegemea wingu. Hata intaneti ikikatika, nyumba yako haisimami kamwe.",
    product: "Bidhaa",
    productLinks: [
      ["Vipengele", "#features"],
      ["Bei", "#pricing"],
      ["Pakua", "#downloads"],
      ["Maswali", "#faq"],
      ["Kuhusu", "/about"],
    ],
    account: "Wateja na Msaada",
    accountLinks: [
      ["Mawasiliano na Msaada wa Kiufundi", "javascript:nxOpenContactModal('Technical Support')"],
      ["Maelezo ya Toleo na Jumuiya", RELEASES_URL],
      ["Pakua Programu", "#downloads"],
    ],
    legal: "Kisheria",
    legalLinks: [
      ["Faragha", "/privacy"],
      ["Masharti", "/terms"],
      ["Marejesho", "/refund"],
      ["Utiaji saini wa msimbo", "/code-signing"],
      ["Changia", "/contribute"],
    ],
    rights: "Haki zote zimehifadhiwa.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
