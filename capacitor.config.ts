import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexus.app',
  appName: 'NEXUS',
  webDir: 'www',
  plugins: {
    // Yerel ağ cihazlarına istekler WebView yerine telefonun ağ yığınından gider
    // (mixed-content / CORS engeline takılmaz). Ek paket gerektirmez: Capacitor çekirdeğinde.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
