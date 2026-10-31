/* NEXUS — Sesli giriş (sohbet): tarayıcı tanıması + MediaRecorder/Whisper yolu.
   nexus-chat.html bu dosyayı yükler; nxVoiceToggle global kalır (mikrofon düğmesi onclick).
   Otomatik durdurma: kayıt yolunda mikrofon seviyesi izlenir, konuşma bittikten ~1,6 sn
   sonra kendiliğinden durur; tarayıcı yolunda 2,5 sn sonuç akmazsa güvenlik durağı devrede. */
var nxVoiceRec = null;
var nxVoiceStopper = null;
var nxVoiceTimer = null;
var nxVoiceToastEl = null;
var nxVoiceToastTimer = null;

function nxVoiceIsTr() {
  return (document.documentElement.lang || 'tr').slice(0, 2) === 'tr';
}
function nxSpeechSupported() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}
function nxRecorderSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}
// Electron'da SpeechRecognition nesnesi vardır ama Google konuşma servisi anahtarı
// olmadığı için "network" hatası verir; doğrudan Worker yolunu kullan.
function nxSkipBrowserSpeech() {
  try {
    if (window.nexusDesktop || location.protocol === 'nexus:') return true;
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) return true;
    if (/Electron/i.test(navigator.userAgent || '')) return true;
  } catch (e) {}
  return false;
}
function nxVoicePressed(on) {
  var btn = document.getElementById('chat-mic');
  if (!btn) return;
  // Kayıt göstergesi: düz opacity yanıp sönme (animate-pulse) yerine marka
  // kırmızısı + yayılan halka + ikon nefesi (css/nexus-ui.css → #chat-mic.nx-rec).
  btn.classList.toggle('nx-rec', !!on);
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.setAttribute('aria-label', on ? (nxVoiceIsTr() ? 'Kaydı bitir' : 'Stop recording') : (nxVoiceIsTr() ? 'Sesle yaz' : 'Voice input'));
}
function nxVoiceToggle() {
  if (nxVoiceRec) { try { nxVoiceRec.stop(); } catch (e) {} return; }
  if (nxVoiceStopper) { nxVoiceStopper(); return; }
  // Kayıt başlangıcı: kısa tek tık (mikrofonun açıldığını duyurur)
  if (window.nexusFeedback) window.nexusFeedback.play('copy');
  if (!nxSkipBrowserSpeech() && nxSpeechSupported()) { nxStartBrowserSpeech(); return; }
  nxStartRecorder();
}

function nxStartBrowserSpeech() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var input = document.getElementById('chat-input');
  var startText = input.value;
  var networkFailed = false;
  var rec = new SR();
  nxVoiceRec = rec;
  rec.lang = nxVoiceIsTr() ? 'tr-TR' : 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  // Güvenlik ağı: continuous=false ile tarayıcı konuşma sonunda kendisi durur; ama
  // bazı tarayıcılarda sonlanma gecikebilir. Sonuç akmadığı 2,5 sn'yi geçince biz durdururuz.
  var lastResultAt = 0, watchdog = null;
  nxVoicePressed(true);
  rec.onresult = function (e) {
    var text = '';
    for (var i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
    input.value = (startText ? startText + ' ' : '') + text.trim();
    input.focus();
    lastResultAt = Date.now();
  };
  rec.onerror = function (e) {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      nxVoiceToast(nxVoiceIsTr() ? 'Mikrofon izni verilmedi. Tarayıcı ayarlarından izin ver.' : 'Microphone permission denied. Allow it in your browser settings.');
    } else if (e.error === 'network') {
      networkFailed = true;
    } else if (e.error !== 'aborted') {
      nxVoiceToast(nxVoiceIsTr() ? 'Ses tanınamadı, tekrar dene.' : 'Voice could not be recognized, please try again.');
    }
  };
  rec.onend = function () {
    if (watchdog) { clearInterval(watchdog); watchdog = null; }
    nxVoicePressed(false);
    nxVoiceRec = null;
    if (networkFailed) {
      if (nxRecorderSupported()) {
        nxVoiceToast(nxVoiceIsTr() ? 'Tarayıcı konuşma servisine ulaşılamadı; kayıt yoluyla deniyorum.' : 'Browser speech service is unreachable; trying recording instead.');
        nxStartRecorder();
      } else {
        nxVoiceToast(nxVoiceIsTr() ? 'Konuşma tanıma bu cihazda çalışmıyor (ağ/servis).' : 'Speech recognition is not available on this device (network/service).');
      }
    }
  };
  try { rec.start(); } catch (e) { rec.onend(); }
  watchdog = setInterval(function () {
    if (lastResultAt && Date.now() - lastResultAt > 2500) { try { rec.stop(); } catch (e) {} }
  }, 300);
}

function nxPickAudioMime() {
  var list = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (var i = 0; i < list.length; i++) {
    try { if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(list[i])) return list[i]; } catch (e) {}
  }
  return '';
}
function nxStopStream(stream) {
  try { (stream.getTracks() || []).forEach(function (t) { t.stop(); }); } catch (e) {}
}

function nxStartRecorder() {
  if (!nxRecorderSupported()) {
    nxVoiceToast(nxVoiceIsTr() ? 'Sesli yazma bu cihazda desteklenmiyor. Metinle yazabilirsin.' : 'Voice input is not supported on this device. You can type instead.');
    return;
  }
  var input = document.getElementById('chat-input');
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    var chunks = [];
    var mime = nxPickAudioMime();
    var rec;
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (e) {
      nxStopStream(stream);
      nxVoiceToast(nxVoiceIsTr() ? 'Kayıt başlatılamadı.' : 'Could not start recording.');
      return;
    }
    var finished = false;
    // Otomatik durdurma: mikrofon seviyesi izlenir; konuşma başladıktan sonra
    // ~1,6 sn sessizlik = cümle bitti demektir, kayıt kendiliğinden durur
    // (kullanıcının düğmeye geri basması beklenmez). 60 sn üst sınır kalır.
    var SILENCE_MS = 1600, RMS_ON = 0.012;
    var audioCtx = null, analyser = null, levelBuf = null, silenceTimer = null;
    var heardSpeech = false, lastLoudAt = 0;
    function stop() {
      if (finished) return;
      finished = true;
      nxVoiceStopper = null;
      if (nxVoiceTimer) { clearTimeout(nxVoiceTimer); nxVoiceTimer = null; }
      if (silenceTimer) { clearInterval(silenceTimer); silenceTimer = null; }
      try { if (audioCtx) { audioCtx.close(); audioCtx = null; } } catch (e) {}
      try { if (rec.state !== 'inactive') rec.stop(); } catch (e) { nxStopStream(stream); nxVoicePressed(false); }
    }
    nxVoiceStopper = stop;
    nxVoicePressed(true);
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onerror = function () {
      nxStopStream(stream);
      nxVoicePressed(false);
      nxVoiceStopper = null;
      nxVoiceToast(nxVoiceIsTr() ? 'Kayıt sırasında hata oluştu.' : 'Recording failed.');
    };
    rec.onstop = function () {
      nxStopStream(stream);
      nxVoicePressed(false);
      if (!chunks.length) {
        nxVoiceToast(nxVoiceIsTr() ? 'Ses duyulamadı; mikrofona yakın konuş.' : 'No audio was captured; speak closer to the mic.');
        return;
      }
      var blob = new Blob(chunks, { type: mime || 'audio/webm' });
      nxVoiceToast(nxVoiceIsTr() ? 'Yazıya dökülüyor…' : 'Transcribing…');
      window.nexusAssistant.transcribe(blob, nxVoiceIsTr() ? 'tr' : 'en').then(function (text) {
        if (!text) {
          nxVoiceToast(nxVoiceIsTr() ? 'Ses anlaşılamadı, tekrar dene.' : 'Could not understand the audio, please try again.');
          return;
        }
        var current = input.value.replace(/\s+$/, '');
        input.value = (current ? current + ' ' : '') + text;
        input.focus();
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
      }).catch(function (err) {
        var msg = String((err && err.message) || '');
        if (/too_large/.test(msg)) nxVoiceToast(nxVoiceIsTr() ? 'Kayıt çok uzun; 60 saniyeden kısa konuş.' : 'Recording is too long; keep it under 60 seconds.');
        else nxVoiceToast(nxVoiceIsTr() ? 'Yazıya dökülemedi. İnternet bağlantını kontrol et.' : 'Could not transcribe. Check your internet connection.');
      });
    };
    try { rec.start(); } catch (e) {
      nxVoiceStopper = null;
      nxVoicePressed(false);
      nxStopStream(stream);
      nxVoiceToast(nxVoiceIsTr() ? 'Kayıt başlatılamadı.' : 'Could not start recording.');
      return;
    }
    nxVoiceTimer = setTimeout(stop, 60000);
    // Seviye ölçer: konuşma başlangıcını (RMS eşiği üstü) işaretler, ardından
    // SILENCE_MS boyunca ses gelmezse stop() çağrılır. AudioContext yoksa (eski
    // WebView) davranış eskisi gibi kalır: düğmeyle veya 60 sn'de durur.
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        audioCtx = new AC();
        if (audioCtx.resume) audioCtx.resume();
        var src = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        levelBuf = new Uint8Array(analyser.fftSize);
        silenceTimer = setInterval(function () {
          analyser.getByteTimeDomainData(levelBuf);
          var sum = 0;
          for (var i = 0; i < levelBuf.length; i++) { var v = (levelBuf[i] - 128) / 128; sum += v * v; }
          var rms = Math.sqrt(sum / levelBuf.length);
          if (rms > RMS_ON) { heardSpeech = true; lastLoudAt = Date.now(); }
          if (heardSpeech && Date.now() - lastLoudAt > SILENCE_MS) stop();
        }, 120);
      }
    } catch (e) {}
    nxVoiceToast(nxVoiceIsTr() ? 'Dinliyorum… Konuşma bitince kendiliğinden durur.' : 'Listening… It stops automatically when you finish speaking.');
  }).catch(function (err) {
    nxVoicePressed(false);
    nxVoiceStopper = null;
    var name = (err && err.name) || '';
    if (name === 'NotAllowedError' || name === 'SecurityError') nxVoiceToast(nxVoiceIsTr() ? 'Mikrofon izni verilmedi. Cihaz ayarlarından izin ver.' : 'Microphone permission denied. Allow it in your device settings.');
    else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') nxVoiceToast(nxVoiceIsTr() ? 'Bu cihazda mikrofon bulunamadı.' : 'No microphone was found on this device.');
    else nxVoiceToast(nxVoiceIsTr() ? 'Mikrofon açılamadı.' : 'Could not open the microphone.');
  });
}

function nxVoiceToast(msg, ms) { if (window.nexusToast) window.nexusToast(msg, { type: 'info', duration: ms || 2200, key: 'voice' }); }
