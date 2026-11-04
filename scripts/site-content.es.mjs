import { RELEASES_URL } from "./site-constants.mjs";

export const es = {
  "title": "NEXUS — Tu hogar inteligente, gestionado en tu propia red",
  "ogImageAlt": "Ecosistema de hogar inteligente NEXUS en escritorio y móvil",
  "description": "NEXUS es un ecosistema de hogar inteligente local primero para Windows, macOS, Linux, Android e iOS. Control directo de dispositivos a través de tu propia red local, automatizaciones rápidas y métricas de energía en tiempo real. Gratis para siempre; plan opcional NEXUS+.",
  "nav": [
    [
      "#features",
      "Características"
    ],
    [
      "#how",
      "Cómo funciona"
    ],
    [
      "#integrations",
      "Integraciones"
    ],
    [
      "#pricing",
      "Precios"
    ],
    [
      "#downloads",
      "Descargar"
    ],
    [
      "#faq",
      "Preguntas frecuentes"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Hogar inteligente local primero",
    "h1a": "Tu hogar.",
    "h1b": "Silenciosamente bajo tu control.",
    "lead": "Un ecosistema unificado para tus luces, clima, coberturas y sensores — comunicándose directamente con los dispositivos en tu propia red local. Automatizaciones receptivas, medición de energía en tiempo real y control que sigue funcionando cuando Internet se cae.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Última versión",
    "shotAlt": "Interfaz NEXUS y centro de control",
    "trust": [
      "Dispositivos ilimitados y gratuitos",
      "No se requiere la nube para el control",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Infraestructura poderosa. Control sin esfuerzo.",
    "lead": "Cada estado de dispositivo, métrica de energía y escena automatizada funciona directamente a través de tu red local sin dependencias externas de la nube.",
    "items": [
      [
        "zap",
        "Automatizaciones receptivas",
        "Los escenarios activados por tiempo y puesta de sol se ejecutan directamente en su hardware local, continuando de manera confiable en segundo plano en el escritorio."
      ],
      [
        "gauge",
        "Lecturas de Energía en Vivo",
        "Lea el consumo de vatios y energía en tiempo real directamente desde los enchufes y interruptores inteligentes compatibles en su red local."
      ],
      [
        "wifi",
        "Velocidad de la Red Local",
        "Comunicación directa LAN a través de HTTP, TCP y UDP con las marcas listadas bajo Integraciones. Sin salto a la nube en la ruta de comandos."
      ],
      [
        "lock",
        "Privacidad por Diseño",
        "La configuración de tu hogar y la telemetría del dispositivo se mantienen en tu hardware local. Se requiere una cuenta para usar NEXUS; esta almacena tu configuración en tu propia fila bajo control de acceso a nivel de fila. Los comandos de los dispositivos todavía se envían a través de tu LAN."
      ],
      [
        "sparkles",
        "Inteligencia AI de NEXUS",
        "Los comandos locales de hogar inteligente son instantáneos y gratuitos para siempre. El asistente de AI en la nube opcional proporciona sugerencias inteligentes cada vez que necesites orientación."
      ],
      [
        "layers",
        "Protocolos Locales Abiertos",
        "Los conectores directos se comunican a través de tu LAN. Matter y Zigbee se integran a través de tu propio servidor Home Assistant: la sección de Integraciones lista lo que es directo versus lo que está conectado mediante un puente."
      ]
    ]
  },
  "how": {
    "heading": "De la descarga a estar conectado en minutos.",
    "steps": [
      [
        "1",
        "Instalar y abrir",
        "Descarga el instalador nativo para tu plataforma (Windows, Linux o Android). Luego inicia sesión: se requiere una cuenta para usar NEXUS, y también sincroniza la configuración entre tus pantallas."
      ],
      [
        "2",
        "Agrega tus dispositivos",
        "Elige tu marca, escanea la red local o ingresa una IP. Las marcas con un conector directo usan su propio protocolo — sin nube del proveedor en ese camino."
      ],
      [
        "3",
        "Vive tu hogar",
        "Escenas, automatizaciones programadas y lecturas reales de energía — control unificado en escritorio y móvil."
      ]
    ]
  },
  "integrations": {
    "heading": "Funciona con lo que ya tienes.",
    "lead": "Protocolos locales y gratuitos primero. Todo lo que no tenga un conector directo todavía funciona a través del puente de Home Assistant.",
    "groups": [
      [
        "HTTP local — en todas las plataformas",
        [
          "Shelly Gen1 y Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Puente Philips Hue",
          "Home Assistant"
        ]
      ],
      [
        "Red local, sin cuenta ni clave — aplicación de escritorio",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (modo DIY)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "¿Falta algo? Solicita un conector",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Gratis para usar. NEXUS+ cuando quieras más",
    "lead": "",
    "currencyNote": "Precios en USD",
    "plans": [
      {
        "name": "Gratis",
        "price": "$0",
        "period": "forever",
        "features": [
          "Dispositivos y habitaciones ilimitados en todos los protocolos locales soportados",
          "Dependencia cero de la nube: funciona localmente en tu propia LAN",
          "30 comandos diarios de NEXUS AI y acciones de dispositivos",
          "Automatizaciones locales programadas y escenas personalizadas",
          "Sincronización de cuentas de múltiples dispositivos (habitaciones, dispositivos, escenas)",
          "100% privado: sin seguimiento, sin recolección de datos"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "por mes",
        "badge": "Más popular",
        "features": [
          "Todo lo del nivel gratuito, más:",
          "2,000 respuestas de NEXUS AI al mes en lugar de 30 al día",
          "Pide a NEXUS AI que configure escenas y responda en lenguaje sencillo",
          "Una cuenta, válida en todos los dispositivos NEXUS",
          "Prueba gratuita — 3 días mensual, 7 días anual; cancela al final del periodo"
        ],
        "cta": {
          "label": "Comienza tu prueba gratuita",
          "monthlyLabel": "Comienza la prueba gratuita de 3 días",
          "yearlyLabel": "Comienza la prueba gratuita de 7 días",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Familiar",
        "price": "Gratis",
        "period": "para toda la familia",
        "badge": "Toda la casa",
        "features": [
          "Miembros del hogar con acceso basado en roles — sin límite de miembros",
          "Roles de propietario, miembro e invitado",
          "Control, invitación y permisos de configuración por miembro",
          "Las escenas y automatizaciones se sincronizan en todos tus dispositivos con sesión iniciada",
          "Activo en todo el ecosistema (escritorio y móvil)",
          "Completamente gratis con tu hogar"
        ],
        "cta": {
          "label": "Comienza con Familia",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Cancela en cualquier momento desde Facturación en la aplicación o desde tu cuenta en este sitio. La cancelación entra en vigor al final del período actual."
  },
  "downloads": {
    "heading": "Nativo en todos los escritorios. En casa en tu teléfono.",
    "lead": "Siempre gratis. Cada instalador se envía con un checksum SHA-256 publicado para que puedas verificar lo que instalas.",
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
        "Debian y Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK firmado",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Versión",
    "sizeLabel": "Tamaño",
    "webCard": {
      "title": "Una cuenta, en todo tu ecosistema",
      "desc": "Programas de escritorio para Windows y Linux y la aplicación para Android. Al iniciar sesión, tus salas, dispositivos, escenas y automatizaciones permanecen sincronizados sin problemas en todas tus pantallas.",
      "cta": {
        "label": "Descargar NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "En Windows, la ruta más sencilla es la Microsoft Store: el paquete está firmado por Microsoft y las actualizaciones llegan a través de la Store. El .exe directo no está firmado, por lo que Windows puede advertir sobre un “editor desconocido”: vea las sumas de verificación."
  },
  "faq": {
    "heading": "Las preguntas importantes, respondidas.",
    "items": [
      [
        "¿Funciona NEXUS completamente en mi red local?",
        "Sí. NEXUS está construido sobre una arquitectura estrictamente local. Tus dispositivos, habitaciones, escenas y telemetría de sensores se procesan directamente en tu propio hardware doméstico. Incluso durante cortes de internet, todos los controles locales, la iluminación y las automatizaciones continúan funcionando sin problemas y sin latencia. Iniciar sesión de forma segura sincroniza tus configuraciones en todas tus pantallas. ¿Necesito instalar NEXUS o se ejecuta en el navegador?"
      ],
      [
        "Do I need to install NEXUS, or does it run in the browser?",
        "Instale el programa de escritorio (Windows o Linux) o la aplicación de Android. NEXUS no se ofrece como aplicación de navegador. Los comandos del dispositivo se envían a través de su propia red local. Shelly, Philips Hue, ESPHome, Tasmota, WLED y Home Assistant utilizan HTTP local en el programa de escritorio y en Android. TP-Link Kasa y Yeelight necesitan TCP directo, por lo que funcionan en el programa de escritorio. Este sitio es para la cuenta, descargas y facturación."
      ],
      [
        "¿Qué agrega el plan NEXUS+?",
        "El control esencial del hogar inteligente—dispositivos ilimitados, habitaciones, automatizaciones sin conexión y paneles locales—es gratis. NEXUS+ incluye todo en la versión Gratis, NEXUS AI para escenas y preguntas en lenguaje natural, 2,000 respuestas al mes, conexiones avanzadas para agregar dispositivos de Home Assistant, y una cuenta en cada dispositivo, con una prueba de 3 días mensual o 7 días anual. Los comandos de los dispositivos aún se ejecutan localmente. Los roles del hogar están incluidos con tu hogar sin costo adicional."
      ],
      [
        "¿A qué cuenta pertenece mi suscripción NEXUS+?",
        "La dirección de correo electrónico utilizada en la caja. Inicia sesión en este sitio o en la aplicación antes de pagar: la caja se abrirá con el correo electrónico de tu cuenta completado, y la suscripción aparecerá en todos los dispositivos en los que inicies sesión. NEXUS+ no se puede comprar sin una cuenta. Si pagas con un correo electrónico diferente, la suscripción se almacenará bajo ese correo y no aparecerá en tu cuenta hasta que inicies sesión con él."
      ],
      [
        "¿Cómo funcionan las automatizaciones y las reglas programadas?",
        "El motor de automatización NEXUS evalúa tus horarios y reglas de sensores en el dispositivo que mantienes en funcionamiento: la aplicación de escritorio se mantiene en la bandeja del sistema y se ejecuta las 24 horas, por lo que las rutinas de iluminación, energía y seguridad nunca dependen de la nube. Las escenas y temporizadores activados desde tu teléfono se aplican al instante a través de tu LAN. Los nuevos eventos se distribuyen a los canales de notificación que habilites en la página de Notificaciones Instantáneas: la barra en la aplicación, notificaciones del sistema, ntfy, Telegram o tu propio webhook HTTPS."
      ],
      [
        "¿Qué dispositivos y ecosistemas son compatibles?",
        "NEXUS habla el protocolo local de cada dispositivo: Shelly (Gen1 y Gen2+), Tasmota, WLED, ESPHome, Philips Hue y Home Assistant a través de HTTP local en todas las plataformas, además de TP-Link Kasa, Yeelight, WiZ, Sonoff (modo DIY) y Wake-on-LAN a través de la red local en la aplicación de escritorio, sin necesidad de cuenta o clave. Todo lo demás — dispositivos Matter o Zigbee — se conecta a través de tu propio servidor de Home Assistant, que NEXUS trata como un único hub local. El descubrimiento de IP local empareja los dispositivos al instante, sin ningún servicio en la nube del proveedor de por medio."
      ],
      [
        "¿Cómo se integran las cámaras de seguridad y los sensores?",
        "NEXUS consolida tus cámaras de seguridad, detectores de movimiento y sensores de entrada en un panel de seguridad centralizado. Puedes automatizar los modos de privacidad, activar rutinas de vigilancia al salir de casa y ver cada movimiento o evento de contacto en la aplicación, además de en los canales de notificación que habilites (notificaciones del sistema, ntfy, Telegram o tu propio webhook)."
      ],
      [
        "¿Puedo cancelar NEXUS+ en cualquier momento?",
        "Sí, completamente sin complicaciones y sin compromisos. Puedes cancelar con un solo clic en cualquier momento: desde la configuración de Cuenta y Facturación en la aplicación, a través de nuestro sitio web, o directamente desde el enlace del pedido en tu recibo de correo electrónico de facturación. Tus beneficios premium permanecen activos hasta el final de tu ciclo de facturación sin cargos futuros. ¿Puedo controlar mi hogar cuando estoy fuera?"
      ],
      [
        "Can I control my home when I am away?",
        "No a través de una nube NEXUS: NEXUS se comunica directamente con tus dispositivos en tu red doméstica y no tiene un relé. Para acceder desde fuera, conecta tu teléfono o portátil a la red doméstica usando una VPN como Tailscale (router de subred) o WireGuard en tu router; NEXUS entonces funciona exactamente como en casa. NEXUS aún no tiene una configuración de dirección de hub, por lo que la VPN debe hacer que tu rango de direcciones local sea accesible, y la búsqueda de nuevos dispositivos solo funciona en la red doméstica. Nunca expongas un dispositivo a internet mediante el reenvío de puertos. La guía paso a paso está en docs/REMOTE-ACCESS.md en el repositorio."
      ],
      [
        "¿Hay una versión para iPhone?",
        "No hay una aplicación en la App Store, porque NEXUS no utiliza una cuenta de desarrollador de Apple de pago. Con una Mac y un Apple ID gratuito puedes compilarla para tu propio iPhone (guía: docs/IOS-BUILD.md), y una versión de lanzamiento también puede incluir un IPA no firmado que AltStore o Sideloadly puedan firmar por ti; ese método aún no ha sido verificado en un iPhone real. Un Apple ID gratuito hace que la aplicación caduque después de 7 días, y las notificaciones mientras la aplicación está cerrada no están disponibles en iOS. El hub principal sigue siendo la aplicación de escritorio; el iPhone es un cliente."
      ],
      [
        "Mi dispositivo no está en la lista. ¿Qué puedo hacer?",
        "NEXUS solo admite dispositivos con un protocolo local documentado; los dispositivos que solo funcionan en la nube no son compatibles porque NEXUS nunca se comunica con la nube de un fabricante. La lista de compatibilidad (docs/COMPATIBILITY.md) también incluye Sonoff en modo DIY, WiZ, LIFX, Govee (LAN) y Wake-on-LAN. Cada uno de estos tiene pruebas automatizadas de protocolo, pero un modelo se considera verificado solo cuando alguien informa que funcionó en un dispositivo real. Escríbanos a través del formulario de contacto en este sitio (elija \"Solicitud de Nuevo Dispositivo / Conector\") o por correo electrónico: la marca y el modelo, lo que esperaba y lo que sucedió. Informarnos que un modelo funcionó en su dispositivo real es lo que lo marca como verificado; nunca incluya contraseñas, claves locales o tokens."
      ],
      [
        "¿Necesito una cuenta? ¿Qué pasa si el servidor está caído?",
        "Sí: inicias sesión una vez con una cuenta de correo electrónico gratuita para abrir NEXUS. Después de eso, el control de dispositivos y la ejecución de automatizaciones ocurre en tu propia red y sigue funcionando sin internet. La cuenta añade sincronización entre tus dispositivos, la Familia y el asistente de IA, que utilizan servicios en la nube gratuitos con límites. Cuando uno de esos no está disponible, por ejemplo, cuando el proyecto gratuito de Supabase se ha pausado después de aproximadamente una semana sin actividad, las pantallas en la nube indican que el servidor no es accesible en lugar de mostrar algo como guardado; los dispositivos, las automatizaciones y la bandeja siguen funcionando. Si la cuota o el servicio de la IA se agota, el asistente dice que no pudo responder."
      ],
      [
        "¿Puedo hacer una copia de seguridad de mis configuraciones y trasladarlas a otro dispositivo? Sí. Configuraciones tiene una sección de copia de seguridad donde puedes exportar tus configuraciones y automatizaciones a un archivo JSON e importarlo en otro dispositivo o después de una reinstalación. Las contraseñas, tokens y claves locales se eliminan de la lista de dispositivos emparejados en el archivo, así que vuelve a ingresarlos después de restaurar. Mantén el archivo de copia de seguridad privado. ¿Puedo exportar mis datos de energía?",
        "Yes. Settings has a backup section where you can export your settings and automations to a JSON file and import it on another device or after a reinstall. Passwords, tokens and local keys are stripped from the paired device list in the file, so re-enter them after restoring. Keep the backup file private."
      ],
      [
        "Can I export my energy data?",
        "Sí. La página de Energía puede exportar las últimas lecturas de energía real de sus dispositivos como un archivo CSV o JSON. NEXUS solo tiene datos de dispositivos que realmente reportan energía; sin ninguno emparejado, no hay nada que exportar."
      ],
      [
        "¿Por qué Windows me advierte cuando ejecuto el instalador?",
        "Instale desde Microsoft Store y no verá esta advertencia: Microsoft firma ese paquete durante la certificación y entrega actualizaciones a través de la Store. La descarga directa del .exe aún no está firmada con un certificado comercial, por lo que SmartScreen puede mostrar “editor desconocido”. Puede comparar el archivo con los sumas de verificación listadas en la sección de descargas antes de ejecutarlo. Nuestra política de firma de código está vinculada desde el pie de página del sitio."
      ]
    ]
  },
  "about": {
    "title": "Acerca de NEXUS",
    "lead": "Una plataforma de hogar inteligente independiente, con prioridad local, diseñada para la velocidad, la privacidad absoluta y la verdadera propiedad del hardware. Al comunicarse directamente con tus dispositivos a través de tu propia red doméstica, NEXUS elimina para siempre la dependencia de la nube.",
    "manifesto": {
      "heading": "Por qué construimos NEXUS",
      "text": "La moderna industria de hogares inteligentes tomó un rumbo equivocado. Los ecosistemas propietarios obligaron a los propietarios a suscripciones obligatorias, retrasos dependientes de la nube y seguimiento invasivo de telemetría. Cuando tu conexión a Internet se cae, el interruptor de tu sala de estar no debería dejar de funcionar. Creamos NEXUS porque creemos que tu hogar es tu santuario: tu plano de planta, el estado de tus cámaras y tus rutinas familiares diarias pertenecen estrictamente a tu propio hardware."
    },
    "pillars": [
      {
        "title": "Velocidad Local-Primero",
        "desc": "Cada automatización y comando se ejecuta a través de tu LAN local en milisegundos. Sin viajes de ida y vuelta a servidores en la nube remotos, cero latencia."
      },
      {
        "title": "Privacidad Intransigente",
        "desc": "Sin telemetría de análisis, sin perfilado de comportamiento y sin vender tus rutinas privadas. Se requiere una cuenta; tu configuración se almacena en tu propia fila de cuenta protegida a nivel de fila. Los comandos del dispositivo permanecen en tu LAN."
      },
      {
        "title": "Sin Dependencia de Proveedores",
        "desc": "Protocolos locales abiertos primero: Shelly, Philips Hue, ESPHome, Tasmota y WLED responden directamente a NEXUS, y cualquier otra cosa se une a través de tu propio servidor de Home Assistant en lugar de una nube de proveedor."
      },
      {
        "title": "SaaS Honesto y Sostenible",
        "desc": "La gestión central de hogar inteligente es completamente gratuita e ilimitada para siempre. NEXUS+ es el plan NEXUS AI y ayuda a cubrir ese uso de la nube."
      }
    ],
    "architecture": {
      "heading": "Diseñado para la Fiabilidad",
      "lead": "NEXUS mantiene un motor ligero de escritorio en la bandeja del sistema, de modo que los horarios y las reglas de los sensores continúan evaluándose mientras tu computadora esté encendida, y la aplicación móvil se abre directamente en la misma red local.",
      "items": [
        {
          "icon": "layers",
          "title": "Escritorio",
          "desc": "Las aplicaciones para Windows, macOS y Linux permanecen en la bandeja del sistema y mantienen los horarios y las reglas de sensores locales funcionando mientras la computadora esté encendida. Windows y Linux se distribuyen como instaladores listos; macOS se construye desde el código fuente (no firmado: clic derecho → Abrir)."
        },
        {
          "icon": "wifi",
          "title": "Teléfono",
          "desc": "Las aplicaciones de Android y iOS se abren en la misma red local; los comandos del dispositivo todavía se envían a través de tu LAN. Android se distribuye como un APK firmado; iOS se construye desde el código fuente con Xcode y un Apple ID gratuito."
        },
        {
          "icon": "lock",
          "title": "Cuenta",
          "desc": "Se requiere una cuenta para que las habitaciones, dispositivos y escenas coincidan en cada pantalla. Los comandos del dispositivo no salen de tu red doméstica."
        }
      ]
    },
    "linksTitle": "Enlaces prácticos"
  },
  "footer": {
    "tagline": "Controla toda tu casa inteligente directamente a través de tu red local, sin dependencia de proveedores ni de la nube. Incluso cuando Internet se cae, tu hogar nunca se detiene.",
    "product": "Producto",
    "productLinks": [
      [
        "Funciones",
        "#features"
      ],
      [
        "Precios",
        "#pricing"
      ],
      [
        "Descargar",
        "#downloads"
      ],
      [
        "Preguntas frecuentes",
        "#faq"
      ],
      [
        "Acerca de",
        "/about"
      ]
    ],
    "account": "Cliente y Soporte",
    "accountLinks": [
      [
        "Contacto y Soporte Técnico",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Notas de la Versión y Comunidad",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Descargar Aplicaciones",
        "#downloads"
      ]
    ],
    "legal": "Legal",
    "legalLinks": [
      [
        "Privacidad",
        "/privacy"
      ],
      [
        "Términos",
        "/terms"
      ],
      [
        "Reembolsos",
        "/refund"
      ],
      [
        "Firma de Código",
        "/code-signing"
      ],
      [
        "Contribuir",
        "/contribute"
      ]
    ],
    "rights": "Todos los derechos reservados.",
    "langSwitchLabel": "Turco",
    "langSwitchHref": "/tr/"
  }
};
