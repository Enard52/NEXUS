import { RELEASES_URL } from "./site-constants.mjs";

export const vi = {
  title: "NEXUS — Ngôi nhà thông minh của bạn, quản lý ngay trên mạng riêng",
  ogImageAlt: "Hệ sinh thái nhà thông minh NEXUS trên máy tính và thiết bị di động",
  description:
    "NEXUS là hệ sinh thái nhà thông minh ưu tiên cục bộ cho Windows, macOS, Linux, Android và iOS. Điều khiển thiết bị trực tiếp qua mạng cục bộ của bạn, tự động hóa nhạy bén và số liệu năng lượng theo thời gian thực. Miễn phí mãi mãi; có gói NEXUS+ tùy chọn.",
  nav: [
    ["#features", "Tính năng"],
    ["#how", "Cách hoạt động"],
    ["#integrations", "Tích hợp"],
    ["#pricing", "Giá"],
    ["#downloads", "Tải xuống"],
    ["#faq", "Câu hỏi thường gặp"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Nhà thông minh ưu tiên cục bộ",
    h1a: "Ngôi nhà của bạn.",
    h1b: "Lặng lẽ trong tầm kiểm soát.",
    lead: "Một hệ sinh thái thống nhất cho đèn, điều hòa, rèm cửa và cảm biến — giao tiếp trực tiếp với các thiết bị trên mạng cục bộ của bạn. Tự động hóa nhạy bén, đo công suất theo thời gian thực và khả năng điều khiển vẫn hoạt động khi mất internet.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Phiên bản mới nhất",
    shotAlt: "Giao diện và trung tâm điều khiển NEXUS",
    trust: [
      "Miễn phí, không giới hạn thiết bị",
      "Điều khiển không cần đám mây",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Hạ tầng mạnh mẽ. Điều khiển dễ dàng.",
    lead: "Mọi trạng thái thiết bị, số liệu điện năng và kịch bản tự động đều chạy trực tiếp trên mạng cục bộ của bạn, không phụ thuộc vào đám mây bên ngoài.",
    items: [
      [
        "zap",
        "Tự động hóa nhạy bén",
        "Các kịch bản kích hoạt theo giờ và theo hoàng hôn chạy trực tiếp trên phần cứng cục bộ của bạn — tiếp tục hoạt động ổn định ở chế độ nền trên máy tính.",
      ],
      [
        "gauge",
        "Số liệu năng lượng trực tiếp",
        "Đọc công suất và mức tiêu thụ điện theo thời gian thực trực tiếp từ các ổ cắm và công tắc thông minh được hỗ trợ trên mạng cục bộ của bạn.",
      ],
      [
        "wifi",
        "Tốc độ mạng cục bộ",
        "Giao tiếp LAN trực tiếp qua HTTP, TCP và UDP với các thương hiệu được liệt kê trong mục Tích hợp. Không có chặng đám mây nào trên đường truyền lệnh.",
      ],
      [
        "lock",
        "Riêng tư từ thiết kế",
        "Cấu hình ngôi nhà và dữ liệu đo từ xa của thiết bị luôn nằm trên phần cứng cục bộ của bạn. Cần có tài khoản để dùng NEXUS; tài khoản lưu thiết lập của bạn trong hàng dữ liệu riêng với kiểm soát truy cập theo hàng. Lệnh điều khiển thiết bị vẫn đi qua mạng LAN của bạn.",
      ],
      [
        "sparkles",
        "Trí tuệ NEXUS AI",
        "Lệnh nhà thông minh cục bộ tức thì và miễn phí mãi mãi. Trợ lý AI đám mây tùy chọn đưa ra gợi ý thông minh mỗi khi bạn cần hướng dẫn.",
      ],
      [
        "layers",
        "Giao thức cục bộ mở",
        "Các trình kết nối trực tiếp giao tiếp trên mạng LAN của bạn. Matter và Zigbee tham gia thông qua máy chủ Home Assistant của chính bạn — mục Tích hợp liệt kê phần nào kết nối trực tiếp, phần nào qua cầu nối.",
      ],
    ],
  },
  how: {
    heading: "Từ tải về đến kết nối chỉ trong vài phút.",
    steps: [
      [
        "1",
        "Cài đặt và mở",
        "Tải trình cài đặt gốc cho nền tảng của bạn (Windows, Linux hoặc Android). Sau đó đăng nhập — cần có tài khoản để dùng NEXUS, và tài khoản cũng đồng bộ thiết lập giữa các màn hình của bạn.",
      ],
      [
        "2",
        "Thêm thiết bị",
        "Chọn thương hiệu, quét mạng cục bộ hoặc nhập địa chỉ IP. Các thương hiệu có trình kết nối trực tiếp dùng giao thức riêng của chúng — không có đám mây của nhà sản xuất trên đường đi đó.",
      ],
      [
        "3",
        "Sống trong ngôi nhà của bạn",
        "Cảnh, tự động hóa theo lịch và số liệu năng lượng thực — điều khiển thống nhất trên máy tính và thiết bị di động.",
      ],
    ],
  },
  integrations: {
    heading: "Hoạt động với những gì bạn đã có.",
    lead: "Ưu tiên các giao thức cục bộ miễn phí. Mọi thiết bị chưa có trình kết nối trực tiếp vẫn hoạt động qua cầu nối Home Assistant.",
    groups: [
      [
        "HTTP cục bộ — trên mọi nền tảng",
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
        "Mạng cục bộ, không cần tài khoản hay khóa — ứng dụng máy tính",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY mode)", "Wake-on-LAN"],
      ],
    ],
    more: "Thiếu thiết bị nào? Hãy yêu cầu một trình kết nối",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Dùng miễn phí. NEXUS+ khi bạn cần nhiều hơn",
    lead: "",
    currencyNote: "Giá tính bằng USD",
    plans: [
      {
        name: "Free",
        price: "$0",
        period: "mãi mãi",
        features: [
          "Không giới hạn thiết bị và phòng trên mọi giao thức cục bộ được hỗ trợ",
          "Không phụ thuộc đám mây: chạy cục bộ trên mạng LAN của bạn",
          "30 lệnh NEXUS AI và thao tác thiết bị mỗi ngày",
          "Tự động hóa cục bộ theo lịch và cảnh tùy chỉnh",
          "Đồng bộ tài khoản đa thiết bị (phòng, thiết bị, cảnh)",
          "Riêng tư 100%: không theo dõi, không thu thập dữ liệu",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "mỗi tháng",
        badge: "Phổ biến nhất",
        features: [
          "Mọi thứ trong gói Free, cộng thêm:",
          "2.000 phản hồi NEXUS AI mỗi tháng thay vì 30 mỗi ngày",
          "Nhờ NEXUS AI thiết lập cảnh và trả lời bằng ngôn ngữ thường ngày",
          "Một tài khoản, dùng được trên mọi thiết bị NEXUS",
          "Dùng thử miễn phí — 3 ngày với gói tháng, 7 ngày với gói năm; hủy vào cuối kỳ",
        ],
        cta: {
          label: "Bắt đầu dùng thử miễn phí",
          monthlyLabel: "Bắt đầu dùng thử miễn phí 3 ngày",
          yearlyLabel: "Bắt đầu dùng thử miễn phí 7 ngày",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Family",
        price: "Miễn phí",
        period: "cho cả gia đình",
        badge: "Cả ngôi nhà",
        features: [
          "Thành viên trong hộ gia đình với quyền truy cập theo vai trò — không giới hạn số thành viên",
          "Vai trò chủ nhà, thành viên và khách",
          "Quyền điều khiển, mời và cài đặt riêng cho từng thành viên",
          "Cảnh và tự động hóa đồng bộ giữa các thiết bị đã đăng nhập của bạn",
          "Hoạt động trên toàn hệ sinh thái (máy tính và di động)",
          "Hoàn toàn miễn phí cùng ngôi nhà của bạn",
        ],
        cta: { label: "Bắt đầu với Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Hủy bất cứ lúc nào từ mục Thanh toán trong ứng dụng hoặc từ tài khoản của bạn trên trang này. Việc hủy có hiệu lực vào cuối kỳ hiện tại.",
  },
  downloads: {
    heading: "Ứng dụng gốc trên mọi máy tính. Tiện lợi trên điện thoại.",
    lead: "Luôn miễn phí. Mọi trình cài đặt đều đi kèm mã kiểm tra SHA-256 được công bố để bạn xác minh những gì mình cài.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian và Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK đã ký",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Phiên bản",
    sizeLabel: "Dung lượng",
    webCard: {
      title: "Một tài khoản, trên toàn bộ hệ sinh thái của bạn",
      desc: "Chương trình máy tính Windows và Linux cùng ứng dụng Android. Khi đã đăng nhập, phòng, thiết bị, cảnh và tự động hóa của bạn được đồng bộ liền mạch giữa các màn hình.",
      cta: { label: "Tải NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Trên Windows, cách dễ nhất là Microsoft Store: gói được Microsoft ký và bản cập nhật đến qua Store. Tệp .exe tải trực tiếp chưa được ký, nên Windows có thể cảnh báo “nhà phát hành không xác định” — xem mã kiểm tra.",
  },
  faq: {
    heading: "Giải đáp những câu hỏi quan trọng.",
    items: [
      [
        "NEXUS có hoạt động hoàn toàn trên mạng cục bộ của tôi không?",
        "Có. NEXUS được xây dựng trên kiến trúc ưu tiên cục bộ nghiêm ngặt. Thiết bị, phòng, cảnh và dữ liệu cảm biến của bạn được xử lý trực tiếp trên phần cứng trong nhà. Ngay cả khi mất internet, mọi điều khiển cục bộ, chiếu sáng và tự động hóa vẫn hoạt động liền mạch với độ trễ bằng không. Đăng nhập sẽ đồng bộ an toàn các thiết lập của bạn giữa mọi màn hình.",
      ],
      [
        "Tôi cần cài NEXUS hay nó chạy trong trình duyệt?",
        "Hãy cài chương trình máy tính (Windows hoặc Linux) hoặc ứng dụng Android. NEXUS không được cung cấp dưới dạng ứng dụng trình duyệt. Lệnh điều khiển thiết bị đi qua mạng cục bộ của chính bạn. Shelly, Philips Hue, ESPHome, Tasmota, WLED và Home Assistant dùng HTTP cục bộ trong chương trình máy tính và trên Android. TP-Link Kasa và Yeelight cần TCP thô nên chạy trong chương trình máy tính. Trang này dành cho tài khoản, tải xuống và thanh toán.",
      ],
      [
        "Gói NEXUS+ bổ sung những gì?",
        "Điều khiển nhà thông minh thiết yếu — không giới hạn thiết bị, phòng, tự động hóa ngoại tuyến và bảng điều khiển cục bộ — là miễn phí. NEXUS+ bao gồm mọi thứ trong Free, NEXUS AI cho cảnh và câu hỏi bằng ngôn ngữ thường ngày, 2.000 phản hồi mỗi tháng, kết nối nâng cao để thêm thiết bị Home Assistant, và một tài khoản trên mọi thiết bị, kèm dùng thử 3 ngày với gói tháng hoặc 7 ngày với gói năm. Lệnh điều khiển thiết bị vẫn chạy cục bộ. Vai trò thành viên hộ gia đình được tính kèm ngôi nhà của bạn, không tốn thêm phí.",
      ],
      [
        "Gói đăng ký NEXUS+ của tôi thuộc về tài khoản nào?",
        "Thuộc về địa chỉ email dùng khi thanh toán. Hãy đăng nhập trên trang này hoặc trong ứng dụng trước khi trả tiền: khi đó trang thanh toán mở ra với email tài khoản của bạn đã điền sẵn, và gói đăng ký xuất hiện trên mọi thiết bị bạn đăng nhập. Không thể mua NEXUS+ nếu không có tài khoản. Nếu bạn thanh toán bằng một email khác, gói đăng ký sẽ được lưu dưới email đó và sẽ không hiện trên tài khoản của bạn cho đến khi bạn đăng nhập bằng email ấy.",
      ],
      [
        "Tự động hóa và các quy tắc theo lịch chạy như thế nào?",
        "Bộ máy tự động hóa NEXUS đánh giá lịch và quy tắc cảm biến của bạn trên thiết bị mà bạn để chạy — ứng dụng máy tính nằm trong khay hệ thống và hoạt động suốt ngày đêm, nên các quy trình chiếu sáng, năng lượng và an ninh không bao giờ phải chờ đám mây. Cảnh và bộ hẹn giờ kích hoạt từ điện thoại được áp dụng tức thì qua mạng LAN của bạn. Sự kiện mới được gửi tới các kênh thông báo bạn bật trên trang Thông báo tức thì: thanh trong ứng dụng, thông báo hệ thống, ntfy, Telegram hoặc webhook HTTPS của riêng bạn.",
      ],
      [
        "Hỗ trợ những thiết bị và hệ sinh thái nào?",
        "NEXUS nói chuyện bằng giao thức cục bộ riêng của từng thiết bị: Shelly (Gen1 và Gen2+), Tasmota, WLED, ESPHome, Philips Hue và Home Assistant qua HTTP cục bộ trên mọi nền tảng, cùng TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode) và Wake-on-LAN qua mạng cục bộ trong ứng dụng máy tính, không cần tài khoản hay khóa. Mọi thứ còn lại — thiết bị Matter hoặc Zigbee — tham gia qua máy chủ Home Assistant của chính bạn, mà NEXUS coi như một trung tâm cục bộ duy nhất. Tính năng phát hiện IP cục bộ ghép đôi thiết bị tức thì, không có đám mây của nhà sản xuất ở giữa.",
      ],
      [
        "Camera an ninh và cảm biến được tích hợp như thế nào?",
        "NEXUS gom camera an ninh, cảm biến chuyển động và cảm biến cửa vào một bảng điều khiển an ninh tập trung. Bạn có thể tự động hóa chế độ riêng tư, kích hoạt các quy trình giám sát khi ra khỏi nhà và xem mọi sự kiện chuyển động hoặc tiếp xúc trong ứng dụng — cũng như trên các kênh thông báo bạn bật (thông báo hệ thống, ntfy, Telegram hoặc webhook của riêng bạn).",
      ],
      [
        "Tôi có thể hủy NEXUS+ bất cứ lúc nào không?",
        "Có, hoàn toàn nhẹ nhàng và không ràng buộc. Bạn có thể hủy chỉ với một cú nhấp bất cứ lúc nào: trong mục Tài khoản & Thanh toán của ứng dụng, qua trang web của chúng tôi, hoặc trực tiếp từ liên kết đơn hàng trong email biên nhận thanh toán. Quyền lợi cao cấp của bạn vẫn có hiệu lực đến hết chu kỳ thanh toán và sẽ không phát sinh khoản phí nào sau đó.",
      ],
      [
        "Tôi có thể điều khiển nhà khi vắng nhà không?",
        "Không thông qua đám mây NEXUS: NEXUS giao tiếp trực tiếp với thiết bị trên mạng gia đình của bạn và không có máy chủ chuyển tiếp. Để truy cập từ bên ngoài, hãy đưa điện thoại hoặc laptop vào mạng gia đình bằng VPN như Tailscale (subnet router) hoặc WireGuard trên router; khi đó NEXUS hoạt động y như ở nhà. NEXUS chưa có cài đặt địa chỉ trung tâm, nên VPN phải cho phép truy cập dải địa chỉ cục bộ của bạn, và việc quét thiết bị mới chỉ hoạt động trên mạng gia đình. Đừng bao giờ mở thiết bị ra internet bằng chuyển tiếp cổng. Hướng dẫn từng bước là docs/REMOTE-ACCESS.md trong kho mã.",
      ],
      [
        "Có phiên bản cho iPhone không?",
        "Không có ứng dụng trên App Store, vì NEXUS không dùng tài khoản Apple Developer trả phí. Với một chiếc Mac và Apple ID miễn phí, bạn có thể tự biên dịch cho iPhone của mình (hướng dẫn: docs/IOS-BUILD.md), và một bản phát hành cũng có thể đính kèm tệp IPA chưa ký mà AltStore hoặc Sideloadly có thể ký giúp bạn; con đường này chưa được xác minh trên iPhone thật. Apple ID miễn phí khiến ứng dụng hết hạn sau 7 ngày, và thông báo khi ứng dụng đã đóng không khả dụng trên iOS. Trung tâm nhà vẫn là ứng dụng máy tính; iPhone là máy khách.",
      ],
      [
        "Thiết bị của tôi không có trong danh sách. Tôi nên làm gì?",
        "NEXUS chỉ hỗ trợ thiết bị có giao thức cục bộ được tài liệu hóa; thiết bị chỉ dùng đám mây không được hỗ trợ vì NEXUS không bao giờ nói chuyện với đám mây của nhà sản xuất. Danh sách tương thích (docs/COMPATIBILITY.md) còn gồm Sonoff ở chế độ DIY, WiZ, LIFX, Govee (LAN) và Wake-on-LAN. Mỗi loại đều có kiểm thử giao thức tự động, nhưng một mẫu chỉ được tính là đã xác minh khi có người báo rằng nó hoạt động trên thiết bị thật. Hãy viết cho chúng tôi qua biểu mẫu liên hệ trên trang này (chọn “New Device / Connector Request”) hoặc qua e-mail: thương hiệu và mẫu máy, điều bạn mong đợi và điều đã xảy ra. Việc bạn báo rằng một mẫu hoạt động trên thiết bị thật của bạn là điều đánh dấu nó đã được xác minh; tuyệt đối đừng gửi kèm mật khẩu, khóa cục bộ hay token.",
      ],
      [
        "Tôi có cần tài khoản không? Điều gì xảy ra nếu máy chủ ngừng hoạt động?",
        "Có: bạn đăng nhập một lần bằng tài khoản email miễn phí để mở NEXUS. Sau đó, việc điều khiển thiết bị và chạy tự động hóa diễn ra trên mạng của chính bạn và tiếp tục hoạt động khi không có internet. Tài khoản bổ sung đồng bộ giữa các thiết bị, Family và trợ lý AI, vốn dùng các dịch vụ đám mây miễn phí có giới hạn. Khi một trong số đó không khả dụng, chẳng hạn khi dự án Supabase miễn phí bị tạm dừng sau khoảng một tuần không hoạt động, các màn hình đám mây sẽ báo không kết nối được máy chủ thay vì hiển thị điều gì đó như đã lưu; thiết bị, tự động hóa và khay hệ thống vẫn hoạt động. Nếu hạn mức hoặc dịch vụ AI cạn kiệt, trợ lý sẽ báo rằng nó không thể trả lời.",
      ],
      [
        "Tôi có thể sao lưu thiết lập và chuyển sang thiết bị khác không?",
        "Có. Trong Cài đặt có mục sao lưu để bạn xuất thiết lập và tự động hóa ra tệp JSON rồi nhập vào thiết bị khác hoặc sau khi cài lại. Mật khẩu, token và khóa cục bộ bị loại khỏi danh sách thiết bị đã ghép đôi trong tệp, vì vậy hãy nhập lại sau khi khôi phục. Hãy giữ tệp sao lưu ở chế độ riêng tư.",
      ],
      [
        "Tôi có thể xuất dữ liệu năng lượng không?",
        "Có. Trang Năng lượng có thể xuất các số đo công suất thực mới nhất từ thiết bị của bạn thành tệp CSV hoặc JSON. NEXUS chỉ có dữ liệu của những thiết bị thực sự báo công suất; nếu chưa ghép đôi thiết bị nào thì không có gì để xuất.",
      ],
      [
        "Vì sao Windows cảnh báo khi tôi chạy trình cài đặt?",
        "Hãy cài từ Microsoft Store và bạn sẽ không thấy cảnh báo này: Microsoft ký gói đó trong quá trình chứng nhận và phân phối bản cập nhật qua Store. Tệp .exe tải trực tiếp chưa được ký bằng chứng chỉ thương mại, nên SmartScreen có thể hiển thị “nhà phát hành không xác định”. Bạn có thể so sánh tệp với mã kiểm tra được liệt kê trong phần tải xuống trước khi chạy. Chính sách ký mã của chúng tôi có liên kết ở chân trang.",
      ],
    ],
  },
  about: {
    title: "Về NEXUS",
    lead: "Một nền tảng nhà thông minh độc lập, ưu tiên cục bộ, được thiết kế cho tốc độ, quyền riêng tư tuyệt đối và quyền sở hữu phần cứng thực sự. Bằng cách giao tiếp trực tiếp với thiết bị qua mạng gia đình của bạn, NEXUS xóa bỏ sự phụ thuộc vào đám mây mãi mãi.",
    manifesto: {
      heading: "Vì sao chúng tôi xây dựng NEXUS",
      text: "Ngành nhà thông minh hiện đại đã rẽ nhầm hướng. Các hệ sinh thái đóng buộc chủ nhà phải chịu thuê bao bắt buộc, độ trễ do đám mây và việc theo dõi bằng dữ liệu đo từ xa xâm phạm. Khi mạng internet mất, công tắc trong phòng khách của bạn không nên ngừng hoạt động. Chúng tôi xây dựng NEXUS vì tin rằng ngôi nhà là nơi trú ẩn của bạn: sơ đồ nhà, trạng thái camera và thói quen hằng ngày của gia đình bạn chỉ thuộc về phần cứng của chính bạn.",
    },
    pillars: [
      {
        title: "Tốc độ ưu tiên cục bộ",
        desc: "Mọi tự động hóa và lệnh đều chạy qua mạng LAN cục bộ của bạn trong vài mili giây. Không đi vòng đến máy chủ đám mây từ xa, độ trễ bằng không.",
      },
      {
        title: "Riêng tư không thỏa hiệp",
        desc: "Không dữ liệu phân tích, không lập hồ sơ hành vi và không bán thói quen riêng tư của bạn. Cần có tài khoản; thiết lập của bạn được lưu trong hàng tài khoản riêng được bảo vệ theo hàng. Lệnh điều khiển thiết bị vẫn ở trong mạng LAN của bạn.",
      },
      {
        title: "Không bị khóa vào nhà cung cấp",
        desc: "Ưu tiên các giao thức cục bộ mở: Shelly, Philips Hue, ESPHome, Tasmota và WLED phản hồi trực tiếp với NEXUS, còn mọi thứ khác tham gia qua máy chủ Home Assistant của chính bạn thay vì đám mây của nhà sản xuất.",
      },
      {
        title: "SaaS trung thực, bền vững",
        desc: "Quản lý nhà thông minh cốt lõi hoàn toàn miễn phí và không giới hạn mãi mãi. NEXUS+ là gói NEXUS AI và giúp trang trải chi phí sử dụng đám mây đó.",
      },
    ],
    architecture: {
      heading: "Thiết kế để đáng tin cậy",
      lead: "NEXUS giữ một bộ máy máy tính nhẹ trong khay hệ thống để lịch và quy tắc cảm biến tiếp tục được đánh giá khi máy tính của bạn đang bật, và ứng dụng di động mở thẳng vào cùng mạng cục bộ đó.",
      items: [
        {
          icon: "layers",
          title: "Máy tính",
          desc: "Các ứng dụng Windows, macOS và Linux nằm trong khay hệ thống và duy trì lịch cục bộ cùng quy tắc cảm biến chạy khi máy tính đang bật. Windows và Linux có sẵn trình cài đặt; macOS được biên dịch từ mã nguồn (chưa ký: nhấp chuột phải → Mở).",
        },
        {
          icon: "wifi",
          title: "Điện thoại",
          desc: "Ứng dụng Android và iOS mở vào cùng mạng cục bộ; lệnh điều khiển thiết bị vẫn đi qua mạng LAN của bạn. Android có APK đã ký; iOS được biên dịch từ mã nguồn bằng Xcode và Apple ID miễn phí.",
        },
        {
          icon: "lock",
          title: "Tài khoản",
          desc: "Cần có tài khoản để phòng, thiết bị và cảnh khớp nhau trên mọi màn hình. Lệnh điều khiển thiết bị không rời khỏi mạng gia đình của bạn.",
        },
      ],
    },
    linksTitle: "Liên kết hữu ích",
  },
  footer: {
    tagline:
      "Điều khiển toàn bộ ngôi nhà thông minh trực tiếp qua mạng cục bộ — không bị khóa vào nhà cung cấp và không phụ thuộc đám mây. Ngay cả khi mất internet, ngôi nhà của bạn không bao giờ dừng lại.",
    product: "Sản phẩm",
    productLinks: [
      ["Tính năng", "#features"],
      ["Giá", "#pricing"],
      ["Tải xuống", "#downloads"],
      ["Câu hỏi thường gặp", "#faq"],
      ["Giới thiệu", "/about"],
    ],
    account: "Khách hàng & Hỗ trợ",
    accountLinks: [
      ["Liên hệ & Hỗ trợ kỹ thuật", "javascript:nxOpenContactModal('Technical Support')"],
      ["Ghi chú phát hành & Cộng đồng", RELEASES_URL],
      ["Tải ứng dụng", "#downloads"],
    ],
    legal: "Pháp lý",
    legalLinks: [
      ["Quyền riêng tư", "/privacy"],
      ["Điều khoản", "/terms"],
      ["Hoàn tiền", "/refund"],
      ["Ký mã", "/code-signing"],
      ["Đóng góp", "/contribute"],
    ],
    rights: "Bảo lưu mọi quyền.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
