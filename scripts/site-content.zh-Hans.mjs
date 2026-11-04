import { RELEASES_URL } from "./site-constants.mjs";

export const zh_Hans = {
  "title": "NEXUS — 在您自己的网络上管理智能家居",
  "ogImageAlt": "NEXUS 智能家居生态系统，适用于桌面和移动设备",
  "description": "NEXUS 是一个以本地优先的智能家居生态系统，支持 Windows、macOS、Linux、Android 和 iOS。在您自己的本地网络上直接控制设备，响应迅速的自动化，以及实时能耗统计。永久免费；可选择 NEXUS+ 计划。",
  "nav": [
    [
      "#features",
      "功能"
    ],
    [
      "#how",
      "工作原理"
    ],
    [
      "#integrations",
      "集成"
    ],
    [
      "#pricing",
      "价格"
    ],
    [
      "#downloads",
      "下载"
    ],
    [
      "#faq",
      "常见问题"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "本地优先智能家居",
    "h1a": "您的家。",
    "h1b": "静静地由您掌控。",
    "lead": "为您的灯光、气候、窗帘和传感器提供一个统一的生态系统——直接在您自己的本地网络上与设备通信。响应式自动化、实时功率测量，以及即使在互联网断开时仍能工作的控制。",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "最新版本",
    "shotAlt": "NEXUS 界面与控制中心",
    "trust": [
      "免费，无限制设备",
      "控制无需云端",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "强大的基础设施。轻松的控制。",
    "lead": "每个设备状态、功率指标和自动化场景都直接在本地网络上运行，无需外部云依赖。",
    "items": [
      [
        "zap",
        "响应式自动化",
        "基于时间和日落触发的情景直接在您的本地硬件上执行——在桌面端可靠地后台运行。"
      ],
      [
        "gauge",
        "实时能源读数",
        "直接从本地网络上支持的智能插座和开关读取实时瓦数和能耗。"
      ],
      [
        "wifi",
        "本地网络速度",
        "通过 HTTP、TCP 和 UDP 与集成列表中的品牌进行直接局域网通信。命令路径中无云端中转。"
      ],
      [
        "lock",
        "隐私设计",
        "您的家庭配置和设备遥测数据保留在本地硬件上。使用 NEXUS 需要账户；它会在行级访问控制下将您的设置存储在您自己的行中。设备命令仍然通过您的局域网发送。"
      ],
      [
        "sparkles",
        "NEXUS AI 智能",
        "本地智能家居命令即时执行，永久免费。可选的云 AI 助手在您需要指导时提供智能建议。"
      ],
      [
        "layers",
        "开放本地协议",
        "直接连接器在您的局域网内通信。Matter 和 Zigbee 通过您自己的 Home Assistant 服务器加入——集成部分列出了哪些是直接连接的，哪些是通过桥接的。"
      ]
    ]
  },
  "how": {
    "heading": "从下载到连接，仅需数分钟。",
    "steps": [
      [
        "1",
        "安装并打开",
        "下载适用于您平台（Windows、Linux 或 Android）的本地安装程序。然后登录——使用 NEXUS 需要一个账户，同时它还会在您的各个屏幕间同步设置。"
      ],
      [
        "2",
        "添加您的设备",
        "选择您的品牌，扫描本地网络或输入 IP。拥有直接连接器的品牌使用自己的协议——无需通过供应商云。"
      ],
      [
        "3",
        "体验您的智能家居",
        "场景、定时自动化和真实能源数据——在桌面和移动端实现统一控制。"
      ]
    ]
  },
  "integrations": {
    "heading": "与您已有的设备兼容。",
    "lead": "免费，本地协议优先。任何没有直接连接器的设备仍然可以通过 Home Assistant 桥接器工作。",
    "groups": [
      [
        "本地 HTTP — 支持所有平台",
        [
          "Shelly 第1代 & 第2代+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "飞利浦 Hue 桥接器",
          "Home Assistant"
        ]
      ],
      [
        "本地网络，无需账户或密钥 — 桌面应用",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff（DIY 模式）",
          "唤醒局域网（Wake-on-LAN）"
        ]
      ]
    ],
    "more": "有缺少的设备吗？请求一个连接器",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "免费使用。想要更多可使用 NEXUS+",
    "lead": "",
    "currencyNote": "价格以美元计",
    "plans": [
      {
        "name": "免费",
        "price": "$0",
        "period": "forever",
        "features": [
          "支持所有本地协议的无限设备和房间",
          "零云依赖：完全在您自己的局域网中运行",
          "每天 30 次 NEXUS AI 命令和设备操作",
          "计划本地自动化和自定义场景",
          "多设备账户同步（房间、设备、场景）",
          "100% 私密：无追踪，无数据收集"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "每月",
        "badge": "最受欢迎",
        "features": [
          "包含免费套餐中的所有功能，外加：",
          "每月 2,000 次 NEXUS AI 回复（而不是每天 30 次）",
          "让 NEXUS AI 设置场景并以自然语言回答",
          "一个账户，可在每台 NEXUS 设备上使用",
          "免费试用 — 每月 3 天，每年 7 天；期末可取消"
        ],
        "cta": {
          "label": "开始免费试用",
          "monthlyLabel": "开始 3 天免费试用",
          "yearlyLabel": "开始 7 天免费试用",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "家庭",
        "price": "免费",
        "period": "适合全家使用",
        "badge": "整个家庭",
        "features": [
          "具有基于角色访问的家庭成员——没有成员上限",
          "所有者、成员和访客角色",
          "按成员控制、邀请和设置权限",
          "场景和自动化在您的登录设备之间同步",
          "在整个生态系统中有效（桌面和移动端）",
          "随您的家庭完全免费"
        ],
        "cta": {
          "label": "从“家庭”开始",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "可随时通过应用内账单或本站账户取消。取消将在当前周期结束时生效。"
  },
  "downloads": {
    "heading": "每台桌面设备原生支持。在手机上也能使用。",
    "lead": "始终免费。每个安装程序都附带发布的 SHA-256 校验和，以便您验证安装内容。",
    "cards": [
      [
        "windows",
        "monitor",
        "Windows",
        "Windows 10/11 · 64位",
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
        "Android 8.0+ · 已签名 APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "版本",
    "sizeLabel": "大小",
    "webCard": {
      "title": "一个账户，贯穿您的整个生态系统",
      "desc": "Windows 和 Linux 桌面程序以及 Android 应用。登录后，您的房间、设备、场景和自动化将在各个屏幕间无缝同步。",
      "cta": {
        "label": "下载 NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "在 Windows 上，最简单的途径是通过 Microsoft 商店：该软件包由 Microsoft 签名，更新通过商店提供。直接的 .exe 文件未签名，因此 Windows 可能会提示“未知发布者”——请参阅校验和。"
  },
  "faq": {
    "heading": "重要的问题，已回答。",
    "items": [
      [
        "NEXUS 是否完全在我的本地网络上运行？",
        "是的。NEXUS 建立在严格的本地优先架构上。您的设备、房间、场景和传感器遥测数据都会直接在您自己的家庭硬件上处理。即使在网络中断期间，所有本地控制、照明和自动化功能仍能无缝运行，延迟为零。安全登录可将您的设置同步到所有屏幕。"
      ],
      [
        "我需要安装 NEXUS 吗，还是可以在浏览器中运行？",
        "安装桌面程序（Windows 或 Linux）或 Android 应用。NEXUS 不提供浏览器应用。设备命令通过您自己的本地网络传输。Shelly、Philips Hue、ESPHome、Tasmota、WLED 和 Home Assistant 在桌面程序和 Android 上使用本地 HTTP。TP-Link Kasa 和 Yeelight 需要原始 TCP，因此它们在桌面程序中运行。本网站用于账户、下载和账单。"
      ],
      [
        "NEXUS+ 计划增加了什么？",
        "基本的智能家居控制——无限设备、房间、离线自动化和本地仪表盘——是免费的。NEXUS+ 包含免费版的所有功能、用于场景和自然语言问题的 NEXUS AI、每月 2000 次回复、用于添加 Home Assistant 设备的高级连接，以及每台设备的一个账号，并提供每月 3 天或每年 7 天的试用。设备命令仍然在本地运行。家庭角色包含在您的家庭中，无需额外费用。"
      ],
      [
        "我的 NEXUS+ 订阅属于哪个账户？",
        "结账时使用的电子邮件地址。在付款前，请先在本网站或应用中登录：结账页面会自动填入您账户的电子邮件，订阅将显示在您登录的每台设备上。没有账户无法购买 NEXUS+。如果您使用其他电子邮件付款，订阅将存储在该电子邮件下，并且在您使用该电子邮件登录之前不会显示在您的账户中。"
      ],
      [
        "自动化和定时规则如何运行？",
        "NEXUS 自动化引擎会在你一直运行的设备上评估你的日程和传感器规则——桌面应用会驻留在系统托盘中并全天候运行，因此照明、能源和安全程序无需等待云端即可执行。从你的手机触发的场景和定时器会立即通过局域网生效。新的事件会分发到你在即时通知页面启用的通知渠道：应用内条、系统通知、ntfy、Telegram 或你自己的 HTTPS webhook。哪些设备和生态系统受到支持？"
      ],
      [
        "Which devices and ecosystems are supported?",
        "NEXUS 使用每个设备自己的本地协议：Shelly（第1代和第2代+）、Tasmota、WLED、ESPHome、飞利浦 Hue 和 Home Assistant，通过每个平台的本地 HTTP，以及 TP-Link Kasa、Yeelight、WiZ、Sonoff（DIY 模式）和 Wake-on-LAN，通过桌面应用在本地网络通信，无需账户或密钥。其他设备——包括 Matter 或 Zigbee 设备——通过你自己的 Home Assistant 服务器接入，NEXUS 将其视为单一本地集线器。通过本地 IP 发现功能，设备可以瞬间配对，中间不经过厂商云服务。"
      ],
      [
        "安全摄像头和传感器是如何集成的？",
        "NEXUS 将您的安全摄像头、运动探测器和入口传感器整合到一个集中管理的安全仪表板中。您可以自动化隐私模式、在离家时启动监控程序，并在应用中查看每一次移动或接触事件——以及在您启用的通知渠道上查看（系统通知、ntfy、Telegram 或您自己的 webhook）。"
      ],
      [
        "我可以随时取消 NEXUS+ 吗？",
        "是的，完全无忧且无需任何承诺。您可以随时一键取消：通过应用内的账户与账单设置、我们的网站，或直接通过账单邮件收据中的订单链接。您的高级会员权益将保持有效，直到账单周期结束，并且不会产生未来费用。"
      ],
      [
        "我在外出时可以控制我的家吗？",
        "不是通过 NEXUS 云：NEXUS 直接在您的家庭网络上与您的设备通信，没有中继。要从外部访问它，请将您的手机或笔记本电脑通过带有 VPN（如 Tailscale（子网路由器）或路由器上的 WireGuard）的家庭网络连接；然后 NEXUS 的工作方式与在家完全相同。NEXUS 还没有中心地址设置，因此 VPN 必须使您的本地地址范围可达，并且扫描新设备仅在家庭网络上有效。绝不要通过端口转发将设备暴露在互联网上。逐步指南在仓库中的 docs/REMOTE-ACCESS.md 文件。"
      ],
      [
        "有 iPhone 版本吗？",
        "没有 App Store 应用，因为 NEXUS 没有使用付费的 Apple 开发者账号。使用 Mac 和免费的 Apple ID，你可以为自己的 iPhone 构建应用（指南：docs/IOS-BUILD.md），发布版本也可能会附带一个未签名的 IPA 文件，AltStore 或 Sideloadly 可以帮你签名；这条路径尚未在真实 iPhone 上验证。免费 Apple ID 构建的应用在 7 天后会过期，并且在 iOS 上应用关闭时无法接收通知。家庭中心仍然是桌面应用；iPhone 是客户端。"
      ],
      [
        "我的设备不在列表中。我该怎么办？",
        "NEXUS 仅支持具有文档化本地协议的设备；云端设备不受支持，因为 NEXUS 从不与供应商云通信。兼容性列表（docs/COMPATIBILITY.md）还包括 DIY 模式下的 Sonoff、WiZ、LIFX、Govee（LAN）和 Wake-on-LAN。每种设备都有自动化协议测试，但只有当有人报告它在真实设备上工作时，某个型号才算被验证。请通过本网站的联系表格（选择“新设备/连接器请求”）或电子邮件与我们联系：提供品牌和型号、您的预期以及实际情况。告知我们某型号在您的真实设备上可用才表示它已验证；切勿提供密码、本地密钥或令牌。"
      ],
      [
        "我需要一个账户吗？如果服务器宕机，会发生什么？",
        "是的：你只需使用一个免费的电子邮件账户登录一次即可打开 NEXUS。之后，控制设备和运行自动化操作会在你自己的网络上进行，即使没有互联网也能继续工作。该账户可以在你的设备、家庭和 AI 助手之间进行同步，这些功能使用的是有限的免费云服务。当其中一个服务不可用时，例如当免费的 Supabase 项目在大约一周未活动后暂停，云端屏幕会显示服务器无法访问，而不是显示数据已保存；设备、自动化和托盘仍会正常工作。如果 AI 配额或服务耗尽，助手会提示无法回复。"
      ],
      [
        "我可以备份我的设置并将其移动到另一台设备吗？",
        "可以。在“设置”中有一个备份部分，您可以将设置和自动化导出为 JSON 文件，并在另一台设备上或重新安装后导入。文件中的已配对设备列表会去除密码、令牌和本地密钥，因此在恢复后需要重新输入它们。请保管好备份文件。"
      ],
      [
        "我可以导出我的能源数据吗？",
        "是的。“能量”页面可以将您的设备的最新实际功率读数导出为 CSV 或 JSON 文件。NEXUS 仅包含实际报告功率的设备的数据；如果没有配对设备，则没有可导出的内容。"
      ],
      [
        "为什么运行安装程序时 Windows 会发出警告？",
        "从 Microsoft Store 安装，您将不会看到此警告：Microsoft 在认证期间对该软件包进行签名，并通过 Store 提供更新。直接下载的 .exe 文件尚未使用商业证书签名，因此 SmartScreen 可能会显示“未知发布者”。在运行之前，您可以将该文件与下载部分列出的校验和进行比较。我们的网站底部链接了我们的代码签名政策。"
      ]
    ]
  },
  "about": {
    "title": "关于 NEXUS",
    "lead": "一个独立的、本地优先的智能家居平台，专为速度、绝对隐私和真正的硬件所有权而设计。通过在您自己的家庭网络上直接与设备通信，NEXUS 永久消除了对云的依赖。",
    "manifesto": {
      "heading": "我们为什么要打造 NEXUS",
      "text": "现代智能家居行业走上了错误的道路。专有生态系统迫使家庭用户订阅付费服务，依赖云端导致延迟，并进行侵入性的遥测追踪。当你的网络断开时，你的客厅开关不应该停止工作。我们创建了NEXUS，因为我们相信你的家是你的避风港：你的户型、你的摄像头状态以及你的日常家庭活动应严格存储在你自己的硬件上。"
    },
    "pillars": [
      {
        "title": "本地优先的速度",
        "desc": "每一个自动化操作和指令都在本地局域网中毫秒级执行。无需往返远程云服务器，零延迟。"
      },
      {
        "title": "毫不妥协的隐私",
        "desc": "无分析遥测，无行为分析，也不出售您的私人操作。需要账户；您的设置存储在您自己受行级保护的账户行中。设备命令仍然停留在您的局域网内。"
      },
      {
        "title": "无供应商锁定",
        "desc": "优先开放本地协议：Shelly、Philips Hue、ESPHome、Tasmota 和 WLED 可直接响应 NEXUS，其他设备则通过您自己的 Home Assistant 服务器而非供应商云接入。"
      },
      {
        "title": "诚信、可持续的 SaaS",
        "desc": "核心智能家居管理完全免费且永久无限制。NEXUS+ 是 NEXUS AI 计划的一部分，有助于覆盖云端使用费用。"
      }
    ],
    "architecture": {
      "heading": "可靠性设计",
      "lead": "NEXUS 在系统托盘中保持一个轻量级桌面引擎，因此在计算机开机时，日程和传感器规则会持续运行，移动应用直接打开即可连接到同一局域网。",
      "items": [
        {
          "icon": "layers",
          "title": "桌面端",
          "desc": "Windows、macOS 和 Linux 应用会保持在系统托盘中，并在计算机开机时持续运行本地日程和传感器规则。Windows 和 Linux 提供现成的安装程序；macOS 从源代码构建（未签名：右键点击 → 打开）。"
        },
        {
          "icon": "wifi",
          "title": "手机",
          "desc": "Android 和 iOS 应用程序在同一局域网上打开；设备命令仍通过您的局域网发送。Android 作为已签名的 APK 提供；iOS 使用 Xcode 和免费 Apple ID 从源码构建。"
        },
        {
          "icon": "lock",
          "title": "账户",
          "desc": "需要账户以确保每个屏幕上的房间、设备和场景保持一致。设备命令不会离开您的家庭网络。"
        }
      ]
    },
    "linksTitle": "实用链接"
  },
  "footer": {
    "tagline": "直接通过您的局域网控制整个智能家居——无需依赖供应商，也不依赖云服务。即使在互联网断线时，您的家也不会停止工作。",
    "product": "产品",
    "productLinks": [
      [
        "功能",
        "#features"
      ],
      [
        "价格",
        "#pricing"
      ],
      [
        "下载",
        "#downloads"
      ],
      [
        "常见问题",
        "#faq"
      ],
      [
        "关于",
        "/about"
      ]
    ],
    "account": "客户与支持",
    "accountLinks": [
      [
        "联系与技术支持",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "发行说明与社区",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "下载应用程序",
        "#downloads"
      ]
    ],
    "legal": "法律",
    "legalLinks": [
      [
        "隐私",
        "/privacy"
      ],
      [
        "条款",
        "/terms"
      ],
      [
        "退款",
        "/refund"
      ],
      [
        "代码签名",
        "/code-signing"
      ],
      [
        "贡献",
        "/contribute"
      ]
    ],
    "rights": "版权所有。",
    "langSwitchLabel": "土耳其语",
    "langSwitchHref": "/tr/"
  }
};
