import { RELEASES_URL } from "./site-constants.mjs";

export const id = {
  title: "NEXUS — Rumah pintar Anda, dikelola di jaringan Anda sendiri",
  ogImageAlt: "Ekosistem rumah pintar NEXUS di desktop dan seluler",
  description:
    "NEXUS adalah ekosistem rumah pintar berbasis lokal untuk Windows, macOS, Linux, Android, dan iOS. Kontrol perangkat langsung melalui jaringan lokal Anda sendiri, otomasi yang responsif, dan metrik energi langsung. Gratis selamanya; paket NEXUS+ bersifat opsional.",
  nav: [
    ["#features", "Fitur"],
    ["#how", "Cara kerja"],
    ["#integrations", "Integrasi"],
    ["#pricing", "Harga"],
    ["#downloads", "Unduh"],
    ["#faq", "FAQ"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Rumah pintar berbasis lokal",
    h1a: "Rumah Anda.",
    h1b: "Tenang dalam kendali Anda.",
    lead: "Satu ekosistem terpadu untuk lampu, pendingin ruangan, tirai, dan sensor Anda — berkomunikasi langsung dengan perangkat di jaringan lokal Anda sendiri. Otomasi yang responsif, pengukuran daya langsung, dan kendali yang tetap berfungsi saat internet mati.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Versi terbaru",
    shotAlt: "Antarmuka dan pusat kendali NEXUS",
    trust: [
      "Gratis, perangkat tanpa batas",
      "Tidak perlu cloud untuk kendali",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Infrastruktur andal. Kendali tanpa repot.",
    lead: "Setiap status perangkat, metrik daya, dan skenario otomatis berjalan langsung di jaringan lokal Anda tanpa ketergantungan pada cloud eksternal.",
    items: [
      [
        "zap",
        "Otomasi yang Responsif",
        "Skenario yang dipicu oleh waktu dan matahari terbenam dijalankan langsung di perangkat keras lokal Anda — terus berjalan dengan andal di latar belakang pada desktop.",
      ],
      [
        "gauge",
        "Pembacaan Energi Langsung",
        "Baca watt dan konsumsi daya secara real-time langsung dari smart plug dan sakelar yang didukung di jaringan lokal Anda.",
      ],
      [
        "wifi",
        "Kecepatan Jaringan Lokal",
        "Komunikasi LAN langsung melalui HTTP, TCP, dan UDP dengan merek yang tercantum di bagian Integrasi. Tanpa lompatan ke cloud pada jalur perintah.",
      ],
      [
        "lock",
        "Privasi Sejak Rancangan",
        "Konfigurasi rumah dan telemetri perangkat Anda tetap berada di perangkat keras lokal Anda. Akun diperlukan untuk menggunakan NEXUS; akun menyimpan pengaturan Anda di baris Anda sendiri dengan kontrol akses tingkat baris. Perintah perangkat tetap berjalan melalui LAN Anda.",
      ],
      [
        "sparkles",
        "Kecerdasan NEXUS AI",
        "Perintah rumah pintar lokal berjalan instan dan gratis selamanya. Asisten AI cloud opsional memberikan saran cerdas kapan pun Anda butuh panduan.",
      ],
      [
        "layers",
        "Protokol Lokal Terbuka",
        "Konektor langsung berkomunikasi di LAN Anda. Matter dan Zigbee terhubung melalui server Home Assistant Anda sendiri — bagian Integrasi menjelaskan mana yang langsung dan mana yang melalui jembatan.",
      ],
    ],
  },
  how: {
    heading: "Dari unduhan hingga terhubung dalam hitungan menit.",
    steps: [
      [
        "1",
        "Instal & buka",
        "Unduh penginstal native untuk platform Anda (Windows, Linux, atau Android). Lalu masuk — akun diperlukan untuk menggunakan NEXUS, dan juga menyinkronkan pengaturan di semua layar Anda.",
      ],
      [
        "2",
        "Tambahkan perangkat Anda",
        "Pilih merek Anda, pindai jaringan lokal, atau masukkan alamat IP. Merek dengan konektor langsung berbicara dengan protokolnya sendiri — tanpa cloud vendor di jalur itu.",
      ],
      [
        "3",
        "Nikmati rumah Anda",
        "Skenario, otomasi terjadwal, dan pembacaan energi nyata — kendali terpadu di desktop dan seluler.",
      ],
    ],
  },
  integrations: {
    heading: "Bekerja dengan apa yang sudah Anda miliki.",
    lead: "Protokol lokal gratis lebih dulu. Perangkat tanpa konektor langsung tetap berfungsi melalui jembatan Home Assistant.",
    groups: [
      [
        "HTTP lokal — di setiap platform",
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
        "Jaringan lokal, tanpa akun atau kunci — aplikasi desktop",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (mode DIY)", "Wake-on-LAN"],
      ],
    ],
    more: "Ada yang belum ada? Minta konektor",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratis digunakan. NEXUS+ bila Anda ingin lebih",
    lead: "",
    currencyNote: "Harga dalam USD",
    plans: [
      {
        name: "Gratis",
        price: "$0",
        period: "selamanya",
        features: [
          "Perangkat dan ruangan tanpa batas di semua protokol lokal yang didukung",
          "Tanpa ketergantungan cloud: berjalan secara lokal di LAN Anda sendiri",
          "30 perintah NEXUS AI & tindakan perangkat per hari",
          "Otomasi lokal terjadwal & skenario kustom",
          "Sinkronisasi akun multi-perangkat (ruangan, perangkat, skenario)",
          "100% privat: tanpa pelacakan, tanpa pengumpulan data",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "per bulan",
        badge: "Paling populer",
        features: [
          "Semua yang ada di paket Gratis, ditambah:",
          "2.000 balasan NEXUS AI per bulan, bukan 30 per hari",
          "Minta NEXUS AI mengatur skenario dan menjawab dengan bahasa sehari-hari",
          "Satu akun, berlaku di setiap perangkat NEXUS",
          "Uji coba gratis — 3 hari untuk bulanan, 7 hari untuk tahunan; batalkan di akhir periode",
        ],
        cta: {
          label: "Mulai uji coba gratis",
          monthlyLabel: "Mulai uji coba gratis 3 hari",
          yearlyLabel: "Mulai uji coba gratis 7 hari",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Keluarga",
        price: "Gratis",
        period: "untuk seluruh keluarga",
        badge: "Seluruh rumah",
        features: [
          "Anggota rumah tangga dengan akses berbasis peran — tanpa batas jumlah anggota",
          "Peran pemilik, anggota, dan tamu",
          "Izin kendali, undangan, dan pengaturan per anggota",
          "Skenario dan otomasi tersinkronisasi di perangkat Anda sendiri yang sudah masuk",
          "Aktif di seluruh ekosistem (desktop dan seluler)",
          "Sepenuhnya gratis bersama rumah Anda",
        ],
        cta: { label: "Mulai dengan Keluarga", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Batalkan kapan saja dari Penagihan di aplikasi atau dari akun Anda di situs ini. Pembatalan berlaku di akhir periode berjalan.",
  },
  downloads: {
    heading: "Native di setiap desktop. Nyaman di ponsel Anda.",
    lead: "Selalu gratis. Setiap penginstal dilengkapi checksum SHA-256 yang dipublikasikan sehingga Anda dapat memverifikasi apa yang Anda instal.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian dan Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK bertanda tangan",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versi",
    sizeLabel: "Ukuran",
    webCard: {
      title: "Satu akun, di seluruh ekosistem Anda",
      desc: "Program desktop Windows dan Linux serta aplikasi Android. Setelah masuk, ruangan, perangkat, skenario, dan otomasi Anda tetap tersinkronisasi dengan mulus di semua layar Anda.",
      cta: { label: "Unduh NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Di Windows, cara termudah adalah lewat Microsoft Store: paketnya ditandatangani oleh Microsoft dan pembaruan datang melalui Store. File .exe langsung tidak ditandatangani, sehingga Windows mungkin menampilkan peringatan “penerbit tidak dikenal” — lihat checksum.",
  },
  faq: {
    heading: "Pertanyaan penting, terjawab.",
    items: [
      [
        "Apakah NEXUS beroperasi sepenuhnya di jaringan lokal saya?",
        "Ya. NEXUS dibangun di atas arsitektur lokal-pertama yang ketat. Perangkat, ruangan, skenario, dan telemetri sensor Anda diproses langsung di perangkat keras rumah Anda sendiri. Bahkan saat internet mati, semua kendali lokal, pencahayaan, dan otomasi tetap berfungsi mulus tanpa latensi. Masuk akan menyinkronkan pengaturan Anda dengan aman di semua layar.",
      ],
      [
        "Apakah saya harus menginstal NEXUS, atau bisa berjalan di browser?",
        "Instal program desktop (Windows atau Linux) atau aplikasi Android. NEXUS tidak tersedia sebagai aplikasi browser. Perintah perangkat melewati jaringan lokal Anda sendiri. Shelly, Philips Hue, ESPHome, Tasmota, WLED, dan Home Assistant menggunakan HTTP lokal di program desktop dan di Android. TP-Link Kasa dan Yeelight memerlukan TCP mentah, jadi berjalan di program desktop. Situs ini untuk akun, unduhan, dan penagihan.",
      ],
      [
        "Apa yang ditambahkan paket NEXUS+?",
        "Kendali rumah pintar esensial—perangkat tanpa batas, ruangan, otomasi offline, dan dasbor lokal—gratis. NEXUS+ mencakup semua yang ada di paket Gratis, NEXUS AI untuk skenario dan pertanyaan dalam bahasa sehari-hari, 2.000 balasan per bulan, koneksi lanjutan untuk menambahkan perangkat Home Assistant, dan satu akun di setiap perangkat, dengan uji coba 3 hari untuk bulanan atau 7 hari untuk tahunan. Perintah perangkat tetap berjalan secara lokal. Peran rumah tangga disertakan bersama rumah Anda tanpa biaya tambahan.",
      ],
      [
        "Langganan NEXUS+ saya terkait dengan akun yang mana?",
        "Alamat email yang digunakan saat pembayaran. Masuklah di situs ini atau di aplikasi sebelum membayar: halaman pembayaran kemudian terbuka dengan email akun Anda sudah terisi, dan langganan muncul di setiap perangkat tempat Anda masuk. NEXUS+ tidak dapat dibeli tanpa akun. Jika Anda membayar dengan email lain, langganan disimpan di bawah email tersebut dan tidak akan muncul di akun Anda sampai Anda masuk dengan email itu.",
      ],
      [
        "Bagaimana otomasi dan aturan terjadwal dijalankan?",
        "Mesin otomasi NEXUS mengevaluasi jadwal dan aturan sensor Anda pada perangkat yang Anda biarkan menyala — aplikasi desktop tetap berada di system tray dan berjalan sepanjang waktu, sehingga rutinitas pencahayaan, energi, dan keamanan tidak pernah menunggu cloud. Skenario dan timer yang dipicu dari ponsel diterapkan seketika melalui LAN Anda. Peristiwa baru diteruskan ke saluran notifikasi yang Anda aktifkan di halaman Notifikasi Instan: bilah dalam aplikasi, notifikasi sistem, ntfy, Telegram, atau webhook HTTPS Anda sendiri.",
      ],
      [
        "Perangkat dan ekosistem apa yang didukung?",
        "NEXUS berbicara dengan protokol lokal masing-masing perangkat: Shelly (Gen1 dan Gen2+), Tasmota, WLED, ESPHome, Philips Hue, dan Home Assistant melalui HTTP lokal di setiap platform, ditambah TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode), dan Wake-on-LAN melalui jaringan lokal di aplikasi desktop, tanpa akun atau kunci. Semua yang lain — perangkat Matter atau Zigbee — terhubung melalui server Home Assistant Anda sendiri, yang diperlakukan NEXUS sebagai satu hub lokal. Penemuan IP lokal memasangkan perangkat secara instan, tanpa cloud vendor di antaranya.",
      ],
      [
        "Bagaimana kamera keamanan dan sensor diintegrasikan?",
        "NEXUS menggabungkan kamera keamanan, detektor gerak, dan sensor pintu Anda ke dalam satu dasbor keamanan terpusat. Anda dapat mengotomatiskan mode privasi, mengaktifkan rutinitas pengawasan saat meninggalkan rumah, dan melihat setiap peristiwa gerakan atau kontak di aplikasi — serta pada saluran notifikasi yang Anda aktifkan (notifikasi sistem, ntfy, Telegram, atau webhook Anda sendiri).",
      ],
      [
        "Bisakah saya membatalkan NEXUS+ kapan saja?",
        "Ya, sepenuhnya tanpa repot dan tanpa komitmen. Anda dapat membatalkan dengan satu klik kapan saja: dari pengaturan Akun & Penagihan di aplikasi, melalui situs web kami, atau langsung dari tautan pesanan di email tanda terima penagihan Anda. Manfaat premium Anda tetap aktif hingga akhir siklus penagihan tanpa tagihan lagi di masa depan.",
      ],
      [
        "Bisakah saya mengendalikan rumah saat sedang pergi?",
        "Tidak melalui cloud NEXUS: NEXUS berkomunikasi dengan perangkat Anda langsung di jaringan rumah dan tidak memiliki relay. Untuk menjangkaunya dari luar, hubungkan ponsel atau laptop Anda ke jaringan rumah dengan VPN seperti Tailscale (subnet router) atau WireGuard di router Anda; NEXUS kemudian bekerja persis seperti di rumah. NEXUS belum memiliki pengaturan alamat hub, sehingga VPN harus membuat rentang alamat lokal Anda dapat dijangkau, dan pemindaian perangkat baru hanya berfungsi di jaringan rumah. Jangan pernah membuka perangkat ke internet dengan penerusan port. Panduan langkah demi langkahnya ada di docs/REMOTE-ACCESS.md dalam repositori.",
      ],
      [
        "Apakah ada versi iPhone?",
        "Tidak ada aplikasi App Store, karena NEXUS tidak menggunakan akun Apple Developer berbayar. Dengan Mac dan Apple ID gratis, Anda dapat membangunnya untuk iPhone Anda sendiri (panduan: docs/IOS-BUILD.md), dan sebuah rilis juga dapat melampirkan IPA tidak bertanda tangan yang dapat ditandatangani oleh AltStore atau Sideloadly untuk Anda; jalur itu belum diverifikasi pada iPhone sungguhan. Apple ID gratis membuat aplikasi kedaluwarsa setelah 7 hari, dan notifikasi saat aplikasi ditutup tidak tersedia di iOS. Hub rumah tetap aplikasi desktop; iPhone adalah klien.",
      ],
      [
        "Perangkat saya tidak ada dalam daftar. Apa yang bisa saya lakukan?",
        "NEXUS hanya mendukung perangkat dengan protokol lokal yang terdokumentasi; perangkat khusus cloud tidak didukung karena NEXUS tidak pernah berkomunikasi dengan cloud vendor. Daftar kompatibilitas (docs/COMPATIBILITY.md) juga mencakup Sonoff dalam mode DIY, WiZ, LIFX, Govee (LAN), dan Wake-on-LAN. Masing-masing memiliki pengujian protokol otomatis, tetapi sebuah model dianggap terverifikasi hanya ketika seseorang melaporkan bahwa model itu berfungsi pada perangkat sungguhan. Tulis kepada kami melalui formulir kontak di situs ini (pilih “Permintaan Perangkat / Konektor Baru”) atau melalui email: merek dan model, apa yang Anda harapkan, dan apa yang terjadi. Laporan bahwa sebuah model berfungsi pada perangkat sungguhan Anda-lah yang menandainya sebagai terverifikasi; jangan pernah menyertakan kata sandi, kunci lokal, atau token.",
      ],
      [
        "Apakah saya perlu akun? Apa yang terjadi jika server mati?",
        "Ya: Anda masuk sekali dengan akun email gratis untuk membuka NEXUS. Setelah itu, mengendalikan perangkat dan menjalankan otomasi terjadi di jaringan Anda sendiri dan tetap berfungsi tanpa internet. Akun menambahkan sinkronisasi antar perangkat, Keluarga, dan asisten AI, yang menggunakan layanan cloud gratis dengan batasan. Ketika salah satunya tidak tersedia, misalnya saat proyek Supabase gratis dijeda setelah sekitar seminggu tanpa aktivitas, layar cloud menyatakan server tidak dapat dijangkau alih-alih menampilkan sesuatu sebagai tersimpan; perangkat, otomasi, dan tray tetap berfungsi. Jika kuota atau layanan AI habis, asisten menyatakan tidak dapat membalas.",
      ],
      [
        "Bisakah saya mencadangkan pengaturan dan memindahkannya ke perangkat lain?",
        "Ya. Pengaturan memiliki bagian cadangan tempat Anda dapat mengekspor pengaturan dan otomasi ke file JSON dan mengimpornya di perangkat lain atau setelah instal ulang. Kata sandi, token, dan kunci lokal dihapus dari daftar perangkat yang dipasangkan dalam file, jadi masukkan ulang setelah memulihkan. Jaga kerahasiaan file cadangan.",
      ],
      [
        "Bisakah saya mengekspor data energi saya?",
        "Ya. Halaman Energi dapat mengekspor pembacaan daya nyata terbaru dari perangkat Anda sebagai file CSV atau JSON. NEXUS hanya memiliki data untuk perangkat yang benar-benar melaporkan daya; jika tidak ada yang dipasangkan, tidak ada yang bisa diekspor.",
      ],
      [
        "Mengapa Windows memperingatkan saya saat menjalankan penginstal?",
        "Instal dari Microsoft Store dan Anda tidak akan melihat peringatan ini: Microsoft menandatangani paket itu selama sertifikasi dan mengirimkan pembaruan melalui Store. Unduhan .exe langsung belum ditandatangani dengan sertifikat komersial, sehingga SmartScreen mungkin menampilkan “penerbit tidak dikenal”. Anda dapat membandingkan file dengan checksum yang tercantum di bagian unduhan sebelum menjalankannya. Kebijakan penandatanganan kode kami ditautkan dari footer situs.",
      ],
    ],
  },
  about: {
    title: "Tentang NEXUS",
    lead: "Platform rumah pintar independen berbasis lokal yang dirancang untuk kecepatan, privasi mutlak, dan kepemilikan perangkat keras yang sesungguhnya. Dengan berbicara langsung ke perangkat Anda melalui jaringan rumah Anda sendiri, NEXUS menghapus ketergantungan pada cloud selamanya.",
    manifesto: {
      heading: "Mengapa Kami Membangun NEXUS",
      text: "Industri rumah pintar modern salah arah. Ekosistem berpemilik memaksa pemilik rumah masuk ke langganan wajib, lag yang bergantung pada cloud, dan pelacakan telemetri yang mengganggu. Ketika koneksi internet Anda putus, sakelar di ruang tamu tidak seharusnya ikut berhenti berfungsi. Kami membangun NEXUS karena kami percaya rumah Anda adalah tempat berlindung Anda: denah rumah, status kamera, dan rutinitas harian keluarga Anda sepenuhnya milik perangkat keras Anda sendiri.",
    },
    pillars: [
      {
        title: "Kecepatan Lokal-Pertama",
        desc: "Setiap otomasi dan perintah dijalankan melalui LAN lokal Anda dalam hitungan milidetik. Tanpa perjalanan pulang-pergi ke server cloud jauh, tanpa latensi.",
      },
      {
        title: "Privasi Tanpa Kompromi",
        desc: "Tanpa telemetri analitik, tanpa pembuatan profil perilaku, dan tanpa menjual rutinitas pribadi Anda. Akun diperlukan; pengaturan Anda disimpan di baris akun Anda sendiri yang dilindungi pada tingkat baris. Perintah perangkat tetap berada di LAN Anda.",
      },
      {
        title: "Tanpa Ketergantungan Vendor",
        desc: "Protokol lokal terbuka lebih dulu: Shelly, Philips Hue, ESPHome, Tasmota, dan WLED menjawab NEXUS secara langsung, dan yang lainnya terhubung melalui server Home Assistant Anda sendiri, bukan cloud vendor.",
      },
      {
        title: "SaaS yang Jujur dan Berkelanjutan",
        desc: "Pengelolaan rumah pintar inti sepenuhnya gratis dan tanpa batas selamanya. NEXUS+ adalah paket NEXUS AI dan membantu menutup biaya penggunaan cloud tersebut.",
      },
    ],
    architecture: {
      heading: "Dirancang untuk Keandalan",
      lead: "NEXUS menjalankan mesin desktop ringan di system tray Anda sehingga jadwal dan aturan sensor terus dievaluasi selama komputer Anda menyala, dan aplikasi seluler langsung terbuka di jaringan lokal yang sama.",
      items: [
        {
          icon: "layers",
          title: "Desktop",
          desc: "Aplikasi Windows, macOS, dan Linux tetap berada di system tray dan menjaga jadwal lokal serta aturan sensor tetap berjalan selama komputer menyala. Windows dan Linux tersedia sebagai penginstal siap pakai; macOS dibangun dari sumber (tidak bertanda tangan: klik kanan → Buka).",
        },
        {
          icon: "wifi",
          title: "Ponsel",
          desc: "Aplikasi Android dan iOS terbuka di jaringan lokal yang sama; perintah perangkat tetap melewati LAN Anda. Android tersedia sebagai APK bertanda tangan; iOS dibangun dari sumber dengan Xcode dan Apple ID gratis.",
        },
        {
          icon: "lock",
          title: "Akun",
          desc: "Akun diperlukan agar ruangan, perangkat, dan skenario sama di setiap layar. Perintah perangkat tidak keluar dari jaringan rumah Anda.",
        },
      ],
    },
    linksTitle: "Tautan praktis",
  },
  footer: {
    tagline:
      "Kendalikan seluruh rumah pintar Anda langsung melalui jaringan lokal — tanpa ketergantungan vendor dan tanpa cloud. Bahkan saat internet mati, rumah Anda tidak pernah berhenti.",
    product: "Produk",
    productLinks: [
      ["Fitur", "#features"],
      ["Harga", "#pricing"],
      ["Unduh", "#downloads"],
      ["FAQ", "#faq"],
      ["Tentang", "/about"],
    ],
    account: "Pelanggan & Dukungan",
    accountLinks: [
      ["Kontak & Dukungan Teknis", "javascript:nxOpenContactModal('Technical Support')"],
      ["Catatan Rilis & Komunitas", RELEASES_URL],
      ["Unduh Aplikasi", "#downloads"],
    ],
    legal: "Hukum",
    legalLinks: [
      ["Privasi", "/privacy"],
      ["Ketentuan", "/terms"],
      ["Pengembalian dana", "/refund"],
      ["Penandatanganan kode", "/code-signing"],
      ["Berkontribusi", "/contribute"],
    ],
    rights: "Hak cipta dilindungi.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
