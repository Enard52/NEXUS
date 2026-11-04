import { RELEASES_URL } from "./site-constants.mjs";

export const zh_Hant = {
  "title": "NEXUS — 您的智慧家庭，自行管理於您的本地網路",
  "ogImageAlt": "NEXUS 智慧家庭生態系統，支援桌面與行動裝置",
  "description": "NEXUS 是一個以本地為先的智慧家庭生態系統，支援 Windows、macOS、Linux、Android 與 iOS。透過您自己的本地網路直接控制設備，具備即時自動化反應與能源使用監測。永久免費；可選擇 NEXUS+ 計畫。",
  "nav": [
    [
      "#features",
      "功能"
    ],
    [
      "#how",
      "運作方式"
    ],
    [
      "#integrations",
      "整合"
    ],
    [
      "#pricing",
      "價格"
    ],
    [
      "#downloads",
      "下載"
    ],
    [
      "#faq",
      "常見問題"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "以本地為先的智慧家庭",
    "h1a": "您的家。",
    "h1b": "安靜地掌控於您手中。",
    "lead": "一個統一的生態系統，管理您的燈光、氣候、窗簾和感測器——直接與您本地網路上的設備通訊。即時自動化、實時電力計量，以及即使網際網路斷線仍能運作的控制。",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "最新版本",
    "shotAlt": "NEXUS 介面與控制中心",
    "trust": [
      "免費，設備無限",
      "控制不需要雲端",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "強大的基礎設施。輕鬆的控制。",
    "lead": "每個設備狀態、電力數據和自動化場景皆直接在您的本地網路中運作，無需依賴外部雲端。",
    "items": [
      [
        "zap",
        "即時自動化",
        "由時間和日落觸發的場景會直接在您的本地硬體上執行 — 在桌面上可靠地在背景持續運行。"
      ],
      [
        "gauge",
        "即時能量讀取",
        "直接從本地網路上支持的智能插座和開關讀取實時瓦特數和功耗。"
      ],
      [
        "wifi",
        "本地網路速度",
        "使用 HTTP、TCP 和 UDP 與整合列表中的品牌直接進行局域網通信。命令路徑中無雲端轉發。"
      ],
      [
        "lock",
        "隱私設計",
        "您的家庭配置和設備遙測資料將保留在本地硬體上。使用 NEXUS 需要帳號；它會在您自己的資料列下存儲您的設定，並受資料列級存取控制保護。設備指令仍然透過您的區域網路傳輸。"
      ],
      [
        "sparkles",
        "NEXUS AI 智慧",
        "本地智慧家庭指令即時執行且永遠免費。可選的雲端 AI 助手可在您需要指引時提供智慧建議。"
      ],
      [
        "layers",
        "開放本地協議",
        "直接連接器在您的區域網路上通訊。Matter 和 Zigbee 可透過您自己的 Home Assistant 伺服器加入——整合部分會列出哪些是直接連接，哪些是透過橋接。"
      ]
    ]
  },
  "how": {
    "heading": "從下載到連接僅需幾分鐘。",
    "steps": [
      [
        "1",
        "安裝並打開",
        "下載適用於您的平台（Windows、Linux 或 Android）的原生安裝程式。然後登入 — 使用 NEXUS 需要帳戶，且它也會同步您的設定到各個螢幕。"
      ],
      [
        "2",
        "添加您的設備",
        "選擇品牌，掃描本地網路或輸入 IP。具有直接連接器的品牌會使用自己的協議 — 這個過程中不經過供應商的雲端。"
      ],
      [
        "3",
        "體驗您的智慧家庭",
        "場景、自動化排程及實際能源讀數 — 在桌面和行動裝置間統一控制。"
      ]
    ]
  },
  "integrations": {
    "heading": "與您已有的設備相容。",
    "lead": "免費，優先使用本地協議。任何沒有直接連接器的設備仍可透過 Home Assistant 橋接器運作。",
    "groups": [
      [
        "本地 HTTP — 適用於所有平台",
        [
          "Shelly 第1代 & 第2代+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue 橋接器",
          "Home Assistant"
        ]
      ],
      [
        "本地網路，無需帳戶或金鑰 — 桌面應用",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff（DIY 模式）",
          "喚醒網路（Wake-on-LAN）"
        ]
      ]
    ],
    "more": "有遺漏的設備嗎？可申請連接器",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "免費使用。想要更多功能可選擇 NEXUS+",
    "lead": "",
    "currencyNote": "價格以美元計算",
    "plans": [
      {
        "name": "免費",
        "price": "$0",
        "period": "forever",
        "features": [
          "在所有支援的本地協議中無限設備及房間",
          "完全不依賴雲端：在您自己的 LAN 本地運行",
          "每日 30 次 NEXUS AI 指令及設備操作",
          "預定的本地自動化與自訂場景",
          "多設備帳號同步（房間、設備、場景）",
          "100% 私密：無追蹤，無資料收集"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "每月費用",
        "badge": "最受歡迎",
        "features": [
          "包含免費方案的所有功能，外加：",
          "每月 2,000 次 NEXUS AI 回覆（每日限制 30 次）",
          "可請 NEXUS AI 設定場景並以簡單語言回答",
          "一個帳號，可在所有 NEXUS 設備上使用",
          "免費試用 — 月方案 3 天，年方案 7 天；到期可取消"
        ],
        "cta": {
          "label": "開始免費試用",
          "monthlyLabel": "開始 3 天免費試用",
          "yearlyLabel": "開始 7 天免費試用",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "家庭方案",
        "price": "免費",
        "period": "適用全家使用",
        "badge": "整個家",
        "features": [
          "具有基於角色訪問的家庭成員 — 無成員上限",
          "擁有者、成員和訪客角色",
          "每個成員的控制、邀請和設置權限",
          "場景和自動化在您自己的已登入裝置間同步",
          "在整個生態系統中均可使用（桌面和移動端）",
          "與您的家庭完全免費"
        ],
        "cta": {
          "label": "從家庭開始",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "可隨時在應用程式的帳單或本網站的帳戶中取消。取消將在當前週期結束時生效。"
  },
  "downloads": {
    "heading": "每台桌面皆原生支援。手機上也能如家般使用。",
    "lead": "永遠免費。每個安裝程式均附有公佈的 SHA-256 校驗和，您可以驗證所安裝的內容。",
    "cards": [
      [
        "windows",
        "monitor",
        "Windows",
        "Windows 10/11 · 64 位元",
        "NEXUS-Setup.exe",
        ".exe"
      ],
      [
        "linux",
        "terminal",
        "Linux",
        "Debian 和 Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · 簽名 APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "版本",
    "sizeLabel": "大小",
    "webCard": {
      "title": "一個帳號，貫穿您的整個生態系統",
      "desc": "Windows 和 Linux 桌面程式以及 Android 應用程式。登入後，您的房間、設備、場景和自動化會在各個螢幕之間無縫同步。",
      "cta": {
        "label": "下載 NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "在 Windows 上最簡單的方式是使用 Microsoft 商店：該套件由 Microsoft 簽署，更新也通過商店提供。直接的 .exe 檔案未經簽署，因此 Windows 可能會警告「未知發行者」—請查看校驗和。"
  },
  "faq": {
    "heading": "重要問題，已回答。",
    "items": [
      [
        "NEXUS 是否完全在我的本地網路上運行？",
        "是的。NEXUS 建立在嚴格的本地優先架構上。您的設備、房間、場景以及傳感器數據會直接在您自己的家庭硬體上處理。即使在網路中斷期間，所有本地控制、照明和自動化仍會無縫運作且零延遲。安全登入後可將您的設定同步到所有螢幕上。"
      ],
      [
        "我需要安裝 NEXUS 嗎，還是它可以在瀏覽器中運行？",
        "安裝桌面程式（Windows 或 Linux）或 Android 應用程式。NEXUS 不提供瀏覽器應用程式。裝置指令會在您自己的本地網路中傳送。Shelly、Philips Hue、ESPHome、Tasmota、WLED 和 Home Assistant 在桌面程式和 Android 上使用本地 HTTP。TP-Link Kasa 和 Yeelight 需要原始 TCP，因此它們在桌面程式中運行。本網站用於帳號、下載和計費。"
      ],
      [
        "NEXUS+ 計劃增加了什麼？",
        "基本智慧家庭控制——無限制的設備、房間、離線自動化和本地儀表板——是免費的。NEXUS+ 包含免費方案中的所有內容、用於場景和自然語言問題的 NEXUS AI、每月 2,000 次回覆、用於添加 Home Assistant 設備的高級連接，以及每個設備上的一個帳戶，並提供每月 3 天或每年 7 天的試用。設備命令仍然在本地運行。家庭角色包含在您的家中，無需額外費用。 我的 NEXUS+ 訂閱屬於哪個帳戶？"
      ],
      [
        "我的 NEXUS+ 訂閱屬於哪個帳號？",
        "結帳時使用的電子郵件地址。在付款前請先在此網站或應用程式中登入：結帳頁面將自動填入您帳戶的電子郵件，訂閱也會顯示在您登入的每個裝置上。沒有帳戶無法購買 NEXUS+。如果您使用不同的電子郵件付款，訂閱將會存儲在該電子郵件下，直到您使用該電子郵件登入才會出現在您的帳戶上。"
      ],
      [
        "自動化和排程規則如何運行？",
        "NEXUS 自動化引擎會在您持續運行的裝置上評估您的排程和感應器規則 — 桌面應用程式會保持在系統工具列中並全天運行，因此照明、能源和安全例行程序從不需要等待雲端。從您的手機觸發的場景和計時器會立即在您的局域網上生效。新的事件會傳播到您在即時通知頁面啟用的通知頻道：應用內訊息列、系統通知、ntfy、Telegram 或您自己的 HTTPS webhook。"
      ],
      [
        "支援哪些裝置和生態系統？",
        "NEXUS 支援每個裝置自有的本地協議：Shelly（第一代和第二代+）、Tasmota、WLED、ESPHome、Philips Hue 以及 Home Assistant，透過各平台的本地 HTTP；此外，桌面應用程式還支援 TP-Link Kasa、Yeelight、WiZ、Sonoff（DIY 模式）以及網路喚醒（Wake-on-LAN），無需帳號或金鑰。其他裝置 — 無論是 Matter 或 Zigbee 設備 — 都可透過您自己的 Home Assistant 伺服器加入，NEXUS 將其視為單一本地集線器。本地 IP 探測可立即配對裝置，中間不經任何廠商雲端。安全攝像頭和感應器如何整合？"
      ],
      [
        "監控攝影機和感測器如何整合？",
        "NEXUS 將您的安全攝像頭、動作探測器和門禁感應器整合到一個中央安全儀表板中。您可以自動化隱私模式、在離家時啟動監控程序，並在應用程式中查看每一次動作或接觸事件——還可以通過您啟用的通知渠道（系統通知、ntfy、Telegram 或您自己的 webhook）接收通知。"
      ],
      [
        "我可以隨時取消 NEXUS+ 嗎？",
        "是的，完全無煩惱且零承諾。您可以隨時單擊一下即可取消：可以從應用內的帳戶與付款設置、我們的網站，或直接從電子郵件收據中的訂單連結取消。您的高級權益將在帳單週期結束前保持有效，且不會有未來費用。"
      ],
      [
        "我離開家時可以控制我的家嗎？",
        "不是透過 NEXUS 雲端：NEXUS 直接與你家中的設備通訊，沒有中繼。要從外部連接，請將你的手機或筆記型電腦透過 VPN（如 Tailscale（子網路路由器）或 Router 上的 WireGuard）連到家用網路；此時 NEXUS 的運作方式與在家中完全相同。NEXUS 尚未有集線器位址設定，因此 VPN 必須使你的本地位址範圍可達，而且掃描新設備僅能在家用網路上進行。切勿透過埠轉發將設備暴露到網際網路。逐步指南請參見倉庫中的 docs/REMOTE-ACCESS.md。"
      ],
      [
        "有 iPhone 版本嗎？",
        "目前沒有 App Store 的應用程式，因為 NEXUS 並沒有使用付費的 Apple 開發者帳號。使用 Mac 和免費的 Apple ID，你可以為自己的 iPhone 建置它（指南：docs/IOS-BUILD.md），發行版本也可能附上一個未簽名的 IPA，AltStore 或 Sideloadly 可以幫你簽名；不過這個方式尚未在真實的 iPhone 上驗證過。免費的 Apple ID 會在 7 天後使應用程式過期，且在 iOS 上應用程式關閉時無法收到通知。家庭中心仍然是桌面應用程式；iPhone 只是用戶端。"
      ],
      [
        "我的設備不在清單上。我該怎麼辦？",
        "NEXUS 僅支援具有文件化本地協議的設備；僅雲端設備不支援，因為 NEXUS 從不與供應商雲端通訊。兼容性列表（docs/COMPATIBILITY.md）也包括 Sonoff DIY 模式、WiZ、LIFX、Govee（LAN）及 Wake-on-LAN。每個設備都有自動化協議測試，但只有當有人報告它在真實設備上運作時，該型號才算是已驗證。請透過本站的聯絡表單與我們聯繫（選擇「新設備/連接器請求」）或透過電子郵件：提供品牌和型號、您的預期以及實際情況。告訴我們某型號在您的真實設備上可用，這就是它被認證的標誌；切勿包含密碼、本地金鑰或代幣。"
      ],
      [
        "我需要帳號嗎？如果伺服器當掉會怎樣？",
        "是的：您只需使用免費電子郵件帳號登入一次即可開啟 NEXUS。之後，控制裝置和執行自動化都是在您自己的網路上進行，並且即使沒有網路也能持續運作。該帳號可在您的裝置、家庭及 AI 助理之間同步，這些同步使用有限的免費雲端服務。當其中之一無法使用時，例如當免費的 Supabase 專案在約一週沒有活動後暫停，雲端畫面會顯示伺服器無法連線，而不是顯示某些資料已儲存；裝置、自動化和工具列仍會正常運作。如果 AI 配額或服務用盡，助理會說無法回覆。"
      ],
      [
        "我可以備份我的設定並將其移至另一個裝置嗎？",
        "可以。設定中有一個備份部分，您可以將您的設定和自動化匯出到 JSON 檔案，並在另一個裝置或重新安裝後匯入。配對裝置清單中的密碼、憑證和本地金鑰會從檔案中刪除，因此在恢復後需要重新輸入。請妥善保管備份檔案。"
      ],
      [
        "我可以匯出我的能源數據嗎？",
        "是的。能量頁面可以將您設備的最新實際功率讀數匯出為 CSV 或 JSON 文件。NEXUS 僅擁有實際回報功率的設備資料；如果沒有配對設備，就沒有任何資料可匯出。"
      ],
      [
        "為什麼我在運行安裝程式時，Windows 會發出警告？",
        "從 Microsoft Store 安裝，您將不會看到此警告：Microsoft 在認證過程中對該軟體包進行簽名，並通過商店提供更新。直接下載的 .exe 尚未使用商業證書簽名，因此 SmartScreen 可能會顯示“未知發行者”。您可以在運行前將檔案與下載區域列出的校驗碼進行比較。我們的代碼簽名政策可從網站頁腳連結查看。"
      ]
    ]
  },
  "about": {
    "title": "關於 NEXUS",
    "lead": "一個獨立的、以本地為先的智能家居平台，專為速度、絕對隱私和真正的硬體擁有權而設計。透過直接在您自己的家庭網路上與您的設備通訊，NEXUS 永久消除了雲端鎖定。",
    "manifesto": {
      "heading": "我們為什麼要建立 NEXUS",
      "text": "現代智慧家庭產業走錯了方向。封閉的生態系統迫使屋主訂閱付費服務，依賴雲端造成延遲，並進行侵入性的遙測追蹤。當你的網際網路連線中斷時，你的客廳開關不應該停止運作。我們打造 NEXUS，是因為我們相信你的家就是你的避風港：你的平面圖、你的攝影機狀態以及你的日常家庭例行，應該完全存放在你自己的硬體上。"
    },
    "pillars": [
      {
        "title": "本地優先的速度",
        "desc": "每個自動化與指令都在你的本地區域網路中以毫秒級執行。無需與遠端雲端伺服器往返，零延遲。"
      },
      {
        "title": "絕對隱私",
        "desc": "沒有分析遙測、沒有行為分析，也不會販售你的私人習慣。需要帳號；你的設置會儲存在你自己擁有的行級保護帳號中。裝置指令仍然保留在你的區域網路內。"
      },
      {
        "title": "不綁定供應商",
        "desc": "優先開放本地協議：Shelly、Philips Hue、ESPHome、Tasmota 和 WLED 直接回應 NEXUS，其他任何裝置則透過你自己的 Home Assistant 伺服器加入，而不是透過供應商雲端。"
      },
      {
        "title": "誠實、永續的 SaaS",
        "desc": "核心智能家居管理完全免費且永遠無限制。NEXUS+ 是 NEXUS AI 計劃的一部分，幫助覆蓋雲端使用費用。"
      }
    ],
    "architecture": {
      "heading": "專為可靠性設計",
      "lead": "NEXUS 在您的系統托盤中保持一個輕量級桌面引擎，因此在電腦開啟時，時間表和感應器規則會持續運行，並且移動應用可以直接打開至相同的本地網絡。",
      "items": [
        {
          "icon": "layers",
          "title": "桌面",
          "desc": "Windows、macOS 和 Linux 應用保持在系統托盤中，在電腦開啟時持續運行本地時間表和感應器規則。Windows 和 Linux 提供即裝即用的安裝程式；macOS 則由源碼構建（未簽名：右鍵點擊 → 打開）。"
        },
        {
          "icon": "wifi",
          "title": "手機",
          "desc": "Android 和 iOS 應用程式都能在相同的本地網路上開啟；設備指令仍然透過您的 LAN 傳送。Android 以簽名 APK 形式發行；iOS 則使用 Xcode 由原始碼編譯並使用免費 Apple ID。"
        },
        {
          "icon": "lock",
          "title": "帳號",
          "desc": "需要帳號以便在每個螢幕上同步房間、設備和場景。設備指令不會離開您的家庭網路。"
        }
      ]
    },
    "linksTitle": "實用連結"
  },
  "footer": {
    "tagline": "直接透過本地網路控制整個智慧家庭 — 無需依賴任何廠商，也不依賴雲端。即使網路中斷，您的家庭也不會停止運作。",
    "product": "產品",
    "productLinks": [
      [
        "功能",
        "#features"
      ],
      [
        "價格",
        "#pricing"
      ],
      [
        "下載",
        "#downloads"
      ],
      [
        "常見問題",
        "#faq"
      ],
      [
        "關於",
        "/about"
      ]
    ],
    "account": "客戶與支援",
    "accountLinks": [
      [
        "聯絡與技術支援",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "發行說明與社群",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "下載應用程式",
        "#downloads"
      ]
    ],
    "legal": "法律",
    "legalLinks": [
      [
        "隱私權",
        "/privacy"
      ],
      [
        "條款",
        "/terms"
      ],
      [
        "退款",
        "/refund"
      ],
      [
        "程式碼簽署",
        "/code-signing"
      ],
      [
        "貢獻",
        "/contribute"
      ]
    ],
    "rights": "版權所有",
    "langSwitchLabel": "土耳其語",
    "langSwitchHref": "/tr/"
  }
};
