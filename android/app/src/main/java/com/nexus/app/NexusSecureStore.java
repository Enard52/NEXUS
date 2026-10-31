package com.nexus.app;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * NEXUS — Cihaz sırlarını (Tuya yerel anahtarı, Tapo parolası, MQTT girişi) Android Keystore'daki dışa verilemeyen
 * bir AES-GCM anahtarıyla şifreler. Web katmanında window.NexusSecure olarak görünür (lan-connectors.js okuyucusu
 * eşzamanlı olduğundan eşzamanlı JavascriptInterface). Anahtar telefondan çıkmaz; şifreli metin yalnız yerel
 * depoda durur. Şifreleme kullanılamazsa encrypt() null döner ve web katmanı düz kayda döner (UI bunu söyler).
 */
public class NexusSecureStore {
    private static final String ALIAS = "nexus_secrets_v1";
    private static final int IV_BYTES = 12;

    private SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (!ks.containsAlias(ALIAS)) {
            KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            kg.init(
                new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                    .build());
            kg.generateKey();
        }
        return (SecretKey) ks.getKey(ALIAS, null);
    }

    @JavascriptInterface
    public boolean available() {
        try {
            return key() != null;
        } catch (Exception e) {
            return false;
        }
    }

    @JavascriptInterface
    public String encrypt(String text) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key());
            byte[] iv = cipher.getIV();
            byte[] ct = cipher.doFinal(text.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            return Base64.encodeToString(out, Base64.NO_WRAP);
        } catch (Exception e) {
            return null;
        }
    }

    @JavascriptInterface
    public String decrypt(String b64) {
        try {
            byte[] in = Base64.decode(b64, Base64.NO_WRAP);
            if (in.length <= IV_BYTES) return null;
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Arrays.copyOfRange(in, 0, IV_BYTES)));
            return new String(cipher.doFinal(in, IV_BYTES, in.length - IV_BYTES), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
}
