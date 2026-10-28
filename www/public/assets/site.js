function nxToggleTheme(){
  var d=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',d);
  try{localStorage.setItem('nx-site-theme',d)}catch(e){}
}

// Dil değiştirme: seçimi kaydet ve doğru sayfaya git
function nxSetLang(lang){
  try{localStorage.setItem('nx-lang',lang)}catch(e){}
  var p=location.pathname;
  var isTr=(p==='/tr/'||p.indexOf('/tr/')===0);
  if(lang==='tr'){
    if(isTr)return;
    var sub=p;
    while(sub.charAt(0)==='/')sub=sub.slice(1);
    location.href='/tr/'+sub+(sub?'':'?lang=tr')+location.hash;
  }else{
    if(!isTr)return;
    var sub=p.slice(3);
    while(sub.charAt(0)==='/')sub=sub.slice(1);
    location.href='/'+sub+(sub?'':'?lang=en')+location.hash;
  }
}

// Modal açıkken sayfa kaymasın: gövde sabitlenir, tekerlek arka plana gitmez.
var nxScrollY=0;
var nxScrollLocked=false;
// Kilit sırasında kutusu piksele sabitlenen öğeler (gövde + sabit başlık).
// Kaydırma çubuğunun şeridi kilitte serbest kaldığı için sabit kutu genişler;
// bu öğeler eski genişliklerinde tutulmazsa navbar ve içerik kayar.
var nxPinned=[];
function nxPinBox(el,w){
  if(!el||!(w>0))return;
  el.style.left='0';
  el.style.right='auto';
  el.style.width=w+'px';
  nxPinned.push(el);
}
function nxUnpinBoxes(){
  while(nxPinned.length){
    var el=nxPinned.pop();
    el.style.left=''; el.style.right=''; el.style.width='';
  }
}
function nxGuardModalScroll(e){
  var node=e.target;
  while(node && node!==document.body){
    if(node.classList && (node.classList.contains('nx-modal-card') || node.classList.contains('nx-dialog-card'))){
      if(node.scrollHeight<=node.clientHeight+1){ e.preventDefault(); return; }
      if(e.touches) return;
      var dy=e.deltaY||0;
      if((dy<0 && node.scrollTop<=0) || (dy>0 && node.scrollTop+node.clientHeight>=node.scrollHeight-1)) e.preventDefault();
      return;
    }
    node=node.parentNode;
  }
  e.preventDefault();
}
function nxLockScroll(){
  // KİLİTLEMEDEN ÖNCE gövde ve başlığın gerçek genişliği ölçülür. Neden padding değil
  // de piksel genişlik: html overflow:hidden olunca kaydırma çubuğu VE ayırdığı şerit
  // kayboluyor (clientWidth 505 -> 520 ölçüldü). Sabit gövdenin containing block'u bu
  // şeridi zaten dışlıyor; üstüne bir de paddingRight=çubuk eklenince kutu iki kez
  // daralıyor ve margin:auto ile ortalanan içerik ~7.5px sola kayıyordu — sabit navbar
  // bundan etkilenmediği için kaymazdı, "sadece içerik kayıyor" görüntüsü buydu.
  // Şerit artık kilitte serbest (html.nx-modal-open{scrollbar-gutter:auto}), o yüzden
  // sabit kutu da genişliyor: gövde ve başlık kilit anındaki kutularına kilitlenir.
  var b=document.body;
  var nxBodyW=b.getBoundingClientRect().width;
  var nxHdr=document.querySelector('.hd');
  var nxHdrW=nxHdr?nxHdr.getBoundingClientRect().width:0;
  document.documentElement.classList.add('nx-modal-open');
  if(nxScrollLocked) return;
  nxScrollLocked=true;
  nxScrollY=window.scrollY||document.documentElement.scrollTop||0;
  b.style.position='fixed';
  b.style.top='-'+nxScrollY+'px';
  b.style.paddingRight='';
  nxPinBox(b,nxBodyW);
  nxPinBox(nxHdr,nxHdrW);
  document.addEventListener('wheel',nxGuardModalScroll,{passive:false,capture:true});
  document.addEventListener('touchmove',nxGuardModalScroll,{passive:false,capture:true});
}
function nxUnlockScroll(){
  var anyOpen=document.querySelectorAll('.nx-modal-backdrop.open,.nx-dialog-backdrop.open').length>0;
  if(anyOpen) return;
  document.documentElement.classList.remove('nx-modal-open');
  if(!nxScrollLocked) return;
  nxScrollLocked=false;
  document.removeEventListener('wheel',nxGuardModalScroll,true);
  document.removeEventListener('touchmove',nxGuardModalScroll,true);
  var b=document.body;
  b.style.position='';
  b.style.top='';
  b.style.paddingRight='';
  nxUnpinBoxes();
  // html{scroll-behavior:smooth} yüzünden bu geri yazma animasyonlu olurdu:
  // kapanışta istemsiz kaydırma animasyonu tetiklenmesin diye anında, sert geri yazılır.
  var de=document.documentElement;
  var prevBehavior=de.style.scrollBehavior;
  de.style.scrollBehavior='auto';
  window.scrollTo(0,nxScrollY);
  de.style.scrollBehavior=prevBehavior;
}

// İletişim & Destek Modülü Kontrolleri
function nxOpenContactModal(category){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  var form=document.getElementById('nxContactForm');
  var successEl=document.getElementById('nxContactSuccess');
  if(form)form.style.display='block';
  if(successEl)successEl.style.display='none';
  if(category){
    var sel=document.getElementById('nxContactCategory');
    if(sel)sel.value=category;
  }
  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  nxLockScroll();
}

// Mojibake Karakter Düzeltici & UTF-8 JWT Çözücü
function nxFixMojibake(str){
  if(!str)return '';
  try{
    if(/[Â-Å]/.test(str)){
      var bytes=new Uint8Array(str.length);
      for(var i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i)&0xff;
      var decoded=new TextDecoder('utf-8').decode(bytes);
      if(decoded && !decoded.includes('�'))return decoded;
    }
  }catch(e){}
  return str;
}

function nxDecodeJwt(token){
  try{
    var base64Url=token.split('.')[1];
    var base64=base64Url.replace(/-/g,'+').replace(/_/g,'/');
    while(base64.length%4)base64+='=';
    var binary=atob(base64);
    var bytes=new Uint8Array(binary.length);
    for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  }catch(e){
    try{return JSON.parse(atob(token.split('.')[1]));}catch(err){return {};}
  }
}

function nxCloseContactModal(){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  m.classList.remove('open');
  setTimeout(function(){
    m.style.display='none';
    nxUnlockScroll();
  },250);
}

function nxSubmitContact(e){
  e.preventDefault();
  var form=document.getElementById('nxContactForm');
  var btn=document.getElementById('nxContactSubmitBtn');
  var successEl=document.getElementById('nxContactSuccess');
  if(!form||!btn)return;

  var name=(document.getElementById('nxContactName').value||'').trim();
  var email=(document.getElementById('nxContactEmail').value||'').trim();
  var cat=document.getElementById('nxContactCategory').value;
  var msg=(document.getElementById('nxContactMsg').value||'').trim();

  if(!name||!email||!msg)return;

  btn.disabled=true;
  var origText=btn.innerHTML;
  btn.innerHTML=form.getAttribute('data-sending')||'Gönderiliyor…';

  fetch('https://formsubmit.co/ajax/nexus.smarthome.app@gmail.com',{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({
      name:name,
      email:email,
      _replyto:email,
      _subject:'[NEXUS Destek] '+cat+' — '+name,
      category:cat,
      message:msg,
      _template:'box'
    })
  })
  .then(function(r){return r.json();})
  .then(function(d){
    btn.disabled=false;
    btn.innerHTML=origText;
    form.style.display='none';
    if(successEl)successEl.style.display='block';
  })
  .catch(function(err){
    btn.disabled=false;
    btn.innerHTML=origText;
    var mailto='mailto:nexus.smarthome.app@gmail.com?subject='+encodeURIComponent('[NEXUS Destek] '+cat+' — '+name)+'&body='+encodeURIComponent('İsim: '+name+'\nE-posta: '+email+'\n\nMesaj:\n'+msg);
    location.href=mailto;
    form.style.display='none';
    if(successEl)successEl.style.display='block';
  });
}

// Auth & Giriş Kontrolleri
var nxAuthMode='login';
var nxDialogCallback=null;

// Özel NEXUS Dialog (Alert & Prompt) Fonksiyonları
function nxShowAlert(msg, title, type, onOk){
  var isTr=document.documentElement.lang==='tr';
  var dlg=document.getElementById('nxCustomDialog');
  if(!dlg)return;
  var iconEl=document.getElementById('nxDialogIcon');
  var titleEl=document.getElementById('nxDialogTitle');
  var msgEl=document.getElementById('nxDialogMsg');
  var inputWrap=document.getElementById('nxDialogInputWrap');
  var cancelBtn=document.getElementById('nxDialogCancelBtn');
  var confirmBtn=document.getElementById('nxDialogConfirmBtn');

  if(inputWrap)inputWrap.style.display='none';
  if(cancelBtn)cancelBtn.style.display='none';
  if(confirmBtn){
    confirmBtn.textContent = isTr ? 'Anladım' : 'Got it';
    confirmBtn.className = 'btn btn-primary w-full';
  }

  type = type || 'info';
  if(iconEl){
    iconEl.className = 'nx-dialog-icon ' + type;
    if(type==='success'){
      iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    }else if(type==='warning'){
      iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>';
    }else{
      iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>';
    }
  }

  if(titleEl)titleEl.textContent = title || (isTr ? 'Bilgilendirme' : 'Notice');
  if(msgEl)msgEl.textContent = msg || '';

  nxDialogCallback = onOk || null;
  if(confirmBtn){
    confirmBtn.onclick = function(){
      nxCloseDialog();
      if(nxDialogCallback) nxDialogCallback();
    };
  }

  dlg.style.display='flex';
  setTimeout(function(){dlg.classList.add('open')},10);
  nxLockScroll();
}

function nxShowPrompt(title, msg, defaultValue, onConfirm){
  var isTr=document.documentElement.lang==='tr';
  var dlg=document.getElementById('nxCustomDialog');
  if(!dlg)return;
  var iconEl=document.getElementById('nxDialogIcon');
  var titleEl=document.getElementById('nxDialogTitle');
  var msgEl=document.getElementById('nxDialogMsg');
  var inputWrap=document.getElementById('nxDialogInputWrap');
  var input=document.getElementById('nxDialogInput');
  var cancelBtn=document.getElementById('nxDialogCancelBtn');
  var confirmBtn=document.getElementById('nxDialogConfirmBtn');

  if(inputWrap)inputWrap.style.display='block';
  if(input){
    input.value = defaultValue || '';
    setTimeout(function(){ input.focus(); input.select(); }, 100);
  }
  if(cancelBtn){
    cancelBtn.style.display='inline-flex';
    cancelBtn.textContent = isTr ? 'İptal' : 'Cancel';
  }
  if(confirmBtn){
    confirmBtn.textContent = isTr ? 'Kaydet' : 'Save';
    confirmBtn.className = 'btn btn-primary';
  }

  if(iconEl){
    iconEl.className = 'nx-dialog-icon edit';
    iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
  }

  if(titleEl)titleEl.textContent = title || '';
  if(msgEl)msgEl.textContent = msg || '';

  nxDialogCallback = onConfirm || null;
  if(confirmBtn){
    confirmBtn.onclick = function(){
      var val = input ? input.value.trim() : '';
      nxCloseDialog();
      if(nxDialogCallback) nxDialogCallback(val);
    };
  }

  dlg.style.display='flex';
  setTimeout(function(){dlg.classList.add('open')},10);
  nxLockScroll();
}

function nxCloseDialog(){
  var dlg=document.getElementById('nxCustomDialog');
  if(!dlg)return;
  dlg.classList.remove('open');
  setTimeout(function(){
    dlg.style.display='none';
    nxUnlockScroll();
  },200);
}

// Avatar ve Kullanıcı Rozeti Yardımcısı (Fotoğraf Varsa Fotoğraf, Yoksa Modern Standart İkon)
var nxUserSvgIcon = '<svg viewBox="0 0 24 24" class="nx-user-icon" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';

function nxGetAvatarHtml(isLarge){
  var avatarUrl = null;
  try{ avatarUrl = localStorage.getItem('nexusUserAvatar'); }catch(e){}
  if(avatarUrl){
    /* DIKKAT: bu satirlar pageJs() icindeki sabit metin (template literal) icinde
       yaziliyor; tek tirnak kacisi iki kere kacislanmali (\'). Tek kere yazilinca
       uretilen site.js'te syntax hatasi olusuyor ve sitedeki TUM JavaScript oliyordu
       (olculdu: canli nexus-smarthome.pages.dev/assets/site.js "Unexpected string"). */
    return '<img src="' + avatarUrl + '" alt="Avatar" class="nx-avatar-photo" onerror="this.outerHTML=\'' + nxUserSvgIcon.replace(/"/g, '&quot;') + '\';">';
  }
  return nxUserSvgIcon;
}

// Uygulamada değiştirilen profil fotoğrafı (nexus_user_state → nexusAvatar) sitede de
// görünsün: giriş oturumu varsa hesabın senkronlu avatar değeri çekilir ve Google
// metadata avatarının önüne geçer. Uygulama ile aynı görünüm — avatar her yerde aynı.
// Satır yoksa (kullanıcı hiç uygulamadan giriş yapmadıysa) metadata avatarı kalır;
// satır varsa ve boşsa fotoğraf kaldırılmış demektir, varsayılan ikon gösterilir.
function nxFetchSyncedAvatar(){
  try{
    if(window.nxAvatarSaving) return; // yerel kayıt sürüyor: eski uzak değer geri çekilmesin
    var pending=null;
    try{ pending=localStorage.getItem('nxAvatarPending'); }catch(e){}
    if(pending){
      var pv='';
      try{ pv=(JSON.parse(pending)||{}).v; if(typeof pv!=='string') pv=''; }catch(e){}
      nxSiteSaveAvatar(pv); // önceki kayıt buluta gidemedi: önce onu tamamla
      return;
    }
    var s=nxCloudSession();
    if(!s||!s.accessToken||!s.userId) return;
    var cfg=nxCloudConfig();
    if(!cfg.url||!cfg.anonKey) return;
    var url=cfg.url+'/rest/v1/nexus_user_state?select=value&key=eq.nexusAvatar&user_id=eq.'+encodeURIComponent(s.userId);
    fetch(url,{headers:{apikey:cfg.anonKey,Authorization:'Bearer '+s.accessToken}})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(rows){
        var now=nxCloudSession();
        if(!now||!now.userId||now.userId!==s.userId) return; // çıkış yapıldı ya da başka hesaba geçildi
        if(!rows||!rows.length) return; // hiç senkronlanmamış: metadata avatarı geçerli
        var v=(rows[0]&&typeof rows[0].value==='string')?rows[0].value:'';
        var cur=null;
        try{ cur=localStorage.getItem('nexusUserAvatar'); }catch(e){}
        if(v===cur) return;
        try{ localStorage.setItem('nexusUserAvatar', v); }catch(e){}
        nxUpdateNavAuth();
        var profileWrap=document.getElementById('nxProfileAvatarWrap');
        if(profileWrap) profileWrap.innerHTML = nxGetAvatarHtml(true);
      })
      .catch(function(){ /* çevrimdışı / erişilemedi: metadata avatarı kalır */ });
  }catch(e){}
}

// --- Sitede avatar değiştirme (uygulamadaki akışın karşılığı) -----------------
// Seçilen dosya 256px JPEG'e sıkıştırılır, yerelde uygulanır ve nexus_user_state
// (key=nexusAvatar) satırına yazılır; uygulama aynı satırdan okuduğu için avatar
// her yerde değişmiş olur. Kayıt buluta gidemezse kuyrukta bekler ve
// nxFetchSyncedAvatar bir sonraki açılışta önce onu tamamlar.
function nxSitePickAvatar(){
  var inp=document.getElementById('nxAvatarFileInput');
  if(inp) inp.click();
}

function nxSiteAvatarFile(input){
  var file=input.files&&input.files[0];
  if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    var raw=e.target.result;
    var img=new Image();
    img.onload=function(){
      try{
        var canvas=document.createElement('canvas');
        var maxDim=256;
        var scale=Math.min(maxDim/img.width,maxDim/img.height,1);
        canvas.width=Math.round(img.width*scale);
        canvas.height=Math.round(img.height*scale);
        var ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        nxSiteApplyAvatar(canvas.toDataURL('image/jpeg',0.85));
      }catch(err){ nxSiteApplyAvatar(raw); }
    };
    img.onerror=function(){ nxSiteApplyAvatar(raw); };
    img.src=raw;
  };
  reader.readAsDataURL(file);
  input.value='';
}

function nxSiteAvatarUpsert(val){
  try{
    var s=nxCloudSession();
    if(!s||!s.accessToken||!s.userId) return Promise.resolve(false);
    var cfg=nxCloudConfig();
    if(!cfg.url||!cfg.anonKey) return Promise.resolve(false);
    return fetch(cfg.url+'/rest/v1/nexus_user_state',{
      method:'POST',
      headers:{
        apikey:cfg.anonKey,
        Authorization:'Bearer '+s.accessToken,
        'Content-Type':'application/json',
        Prefer:'resolution=merge-duplicates'
      },
      body:JSON.stringify({user_id:s.userId,key:'nexusAvatar',value:val,updated_at:new Date().toISOString()})
    }).then(function(r){ return r.ok; },function(){ return false; });
  }catch(e){ return Promise.resolve(false); }
}

function nxSiteSaveAvatar(val){
  window.nxAvatarSaving=true;
  nxSiteAvatarUpsert(val).then(function(ok){
    window.nxAvatarSaving=false;
    try{
      if(ok) localStorage.removeItem('nxAvatarPending');
      else localStorage.setItem('nxAvatarPending', JSON.stringify({v:val}));
    }catch(e){}
  });
}

function nxSiteApplyAvatar(val){
  // "Google fotoğrafına dön" YALNIZCA Google girişinden gelen fotoğrafı saklar:
  // Google hesap avatarı her zaman googleusercontent.com'da barınır. Başka bir
  // https adresi (elle atanmış metadata vb.) geri dönüş kaynağı sayılmaz, böylece
  // seçenek e-posta ile giren kullanıcılara asla görünmez.
  var cur=null;
  try{ cur=localStorage.getItem('nexusUserAvatar'); }catch(e){}
  if(cur && cur.indexOf('data:')!==0 && cur!==val && /googleusercontent.com|ggpht.com/i.test(cur)){
    try{ localStorage.setItem('nexusUserGoogleAvatar', cur); }catch(e){}
  }
  try{ localStorage.setItem('nexusUserAvatar', val); }catch(e){}
  nxSiteSaveAvatar(val);
  nxUpdateNavAuth();
  var profileWrap=document.getElementById('nxProfileAvatarWrap');
  if(profileWrap) profileWrap.innerHTML = nxGetAvatarHtml(true);
  nxSiteAvatarActions();
}

function nxSiteRevertGoogleAvatar(){
  var g=null;
  try{ g=localStorage.getItem('nexusUserGoogleAvatar'); }catch(e){}
  if(g) nxSiteApplyAvatar(g);
}

function nxSiteRemoveAvatar(){
  nxSiteApplyAvatar('');
}

function nxSiteAvatarActions(){
  var cur='';
  try{ cur=localStorage.getItem('nexusUserAvatar')||''; }catch(e){}
  var g='';
  try{ g=localStorage.getItem('nexusUserGoogleAvatar')||''; }catch(e){}
  var rev=document.getElementById('nxAvatarRevertGoogle');
  var rm=document.getElementById('nxAvatarRemove');
  if(rev) rev.style.display = (g && cur!==g) ? '' : 'none';
  if(rm) rm.style.display = (cur.indexOf('data:')===0) ? '' : 'none';
}

// --- Hesap e-postası değiştirme ----------------------------------------------
// Supabase Auth: yeni adrese doğrulama bağlantısı gider; bağlantı onaylanana
// kadar giriş için eski adres geçerli kalır. Eski adres yerelde saklanmaya devam
// eder (oturum hâlâ o hesabın belirteciyle çalışır).
function nxChangeEmailPrompt(){
  var isTr=document.documentElement.lang==='tr';
  var s=nxCloudSession();
  var cfg=nxCloudConfig();
  if(!s||!s.accessToken||!cfg.url||!cfg.anonKey){ nxAuthUnavailable(); return; }
  var cur='';
  try{ cur=localStorage.getItem('nexusCurrentUser')||''; }catch(e){}
  nxShowPrompt(
    isTr?'E-posta Adresini Değiştir':'Change Email Address',
    isTr
      ? ('Mevcut adres: '+(cur||'—')+'. Yeni adrese bir doğrulama bağlantısı gönderilir; bağlantıyı onaylayana kadar girişte eski adres kullanılır.')
      : ('Current address: '+(cur||'—')+'. A confirmation link will be sent to the new address; the old one keeps working for sign-in until you confirm.'),
    '',
    nxSubmitEmailChange
  );
}

function nxSubmitEmailChange(val){
  var isTr=document.documentElement.lang==='tr';
  if(!val){ nxShowAlert(isTr?'Yeni e-posta adresini girin.':'Enter the new email address.',isTr?'Eksik bilgi':'Missing info','warning'); return; }
  if(val.indexOf('@')<1 || !/^\S+@\S+\.\S+$/.test(val)){ nxShowAlert(isTr?'Geçerli bir e-posta adresi girin.':'Enter a valid email address.',isTr?'Geçersiz adres':'Invalid address','warning'); return; }
  var s=nxCloudSession();
  var cfg=nxCloudConfig();
  if(!s||!s.accessToken||!cfg.url||!cfg.anonKey){ nxAuthUnavailable(); return; }
  fetch(cfg.url+'/auth/v1/user',{
    method:'PUT',
    headers:{
      'apikey':cfg.anonKey,
      'Authorization':'Bearer '+s.accessToken,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({email:val})
  })
  .then(function(res){
    return res.json().then(function(data){
      if(!res.ok){ throw new Error(data.msg||data.message||data.error_description||(isTr?'E-posta değiştirilemedi.':'Could not change the email.')); }
      return data;
    });
  })
  .then(function(){
    nxShowAlert(
      isTr
        ? ('Doğrulama bağlantısı '+val+' adresine gönderildi. Bağlantıya tıkladığında adresin değişir; o zamana kadar girişte eski adres geçerli kalır.')
        : ('A confirmation link was sent to '+val+'. Your address changes once you click it; until then the old address keeps working for sign-in.'),
      isTr?'Bağlantı gönderildi':'Link sent','success');
  })
  .catch(function(err){
    var msg=String((err&&err.message)||'');
    var text=msg;
    if(/already registered|already been registered|already exists|duplicate/i.test(msg)) text=isTr?'Bu e-posta zaten bir hesaba bağlı.':'That email is already registered.';
    else if(/not allowed|not authorized/i.test(msg)) text=isTr?'Bu e-posta sağlayıcısıyla kayıt yapılamıyor.':'Signups with this email provider are not allowed.';
    else if(/oturum/i.test(msg)) text=isTr?'Oturum bulunamadı. Çıkış yapıp tekrar giriş yap.':'Session not found. Sign out and sign in again.';
    nxShowAlert(text,isTr?'Değiştirilemedi':'Not changed','warning');
  });
}

function nxUpdateNavAuth(){
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  var btn=document.getElementById('nxNavAuthBtn');
  var label=document.getElementById('nxNavAuthLabel');
  var avatarWrap=document.getElementById('nxNavAuthAvatar');
  if(!btn||!label)return;
  var isTr=document.documentElement.lang==='tr';
  if(user){
    btn.classList.add('logged-in');
    var customName=null;
    try{
      customName=localStorage.getItem('nexusUserName');
      if(customName){
        var fixed=nxFixMojibake(customName);
        if(fixed!==customName){customName=fixed;localStorage.setItem('nexusUserName',fixed);}
      }
    }catch(e){}
    var displayName = customName || user.split('@')[0];
    label.textContent = displayName;
    label.title = displayName + ' (' + user + ')';
    if(avatarWrap){
      avatarWrap.innerHTML='<div class="nx-nav-avatar">' + nxGetAvatarHtml(false) + '<span class="dot-online"></span></div>';
    }
    // Uygulamada seçilen profil fotoğrafı sitede de görünsün (senkronlu avatar).
    nxFetchSyncedAvatar();
  }else{
    btn.classList.remove('logged-in');
    label.textContent = isTr ? 'Giriş Yap' : 'Sign In';
    label.title = '';
    if(avatarWrap){
      avatarWrap.innerHTML='<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0-8 0 4 4 0 0 0 8 0"/></svg>';
    }
  }
}

function nxOpenAuthModal(){
  var m=document.getElementById('nxAuthModal');
  if(!m)return;
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  var formView=document.getElementById('nxAuthFormView');
  var profileView=document.getElementById('nxAuthProfileView');
  var recoveryView=document.getElementById('nxAuthRecoveryView');
  var isTr=document.documentElement.lang==='tr';
  if(recoveryView)recoveryView.style.display='none';

  if(user){
    if(formView)formView.style.display='none';
    if(profileView)profileView.style.display='flex';
    var customName=null;
    try{
      customName=localStorage.getItem('nexusUserName');
      if(customName){
        var fixed=nxFixMojibake(customName);
        if(fixed!==customName){customName=fixed;localStorage.setItem('nexusUserName',fixed);}
      }
    }catch(e){}
    var displayName = customName || user.split('@')[0];
    
    var avatarWrap=document.getElementById('nxProfileAvatarWrap');
    var nameEl=document.getElementById('nxProfileNameDisplay');
    var emailEl=document.getElementById('nxProfileEmail');
    if(avatarWrap) avatarWrap.innerHTML = nxGetAvatarHtml(true);
    if(nameEl)nameEl.textContent = displayName;
    if(emailEl)emailEl.textContent = user;
    nxSiteAvatarActions();
    
    var plusPlan = '';
    try {
      plusPlan = localStorage.getItem('nexusPlusPlan') || '';
      if (!plusPlan && window.nexusGetItem) plusPlan = window.nexusGetItem('nexusPlusPlan') || '';
    } catch (e) {}
    var plusActive = plusPlan === 'Aylık' || plusPlan === 'Yıllık';
    if (!plusActive) {
      try { plusActive = localStorage.getItem('nexusPlusActive') === 'true'; } catch (e) {}
    }
    var planTag=document.getElementById('nxProfilePlanTag');
    if(planTag){
      planTag.classList.toggle('is-free', !plusActive);
      if(!plusActive) planTag.textContent = isTr ? 'Ücretsiz' : 'Free';
      else if(plusPlan === 'Yıllık') planTag.textContent = isTr ? 'NEXUS+ · Yıllık' : 'NEXUS+ · Yearly';
      else if(plusPlan === 'Aylık') planTag.textContent = isTr ? 'NEXUS+ · Aylık' : 'NEXUS+ · Monthly';
      else planTag.textContent = 'NEXUS+';
    }
    var perksFree=document.getElementById('nxProfilePerksFree');
    var perksPlus=document.getElementById('nxProfilePerksPlus');
    if(perksFree)perksFree.classList.toggle('is-hidden', plusActive);
    if(perksPlus)perksPlus.classList.toggle('is-hidden', !plusActive);
    var upgrade=document.getElementById('nxProfileUpgrade');
    if(upgrade)upgrade.classList.toggle('is-hidden', plusActive);
    m.classList.add('nx-account-open');
    m.setAttribute('aria-labelledby','nxProfileNameDisplay');
  }else{
    if(formView)formView.style.display='block';
    if(profileView)profileView.style.display='none';
    m.classList.remove('nx-account-open');
    m.setAttribute('aria-labelledby','nxAuthTitle');
    var alertEl=document.getElementById('nxAuthAlert');
    if(alertEl)alertEl.style.display='none';
  }

  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  nxLockScroll();
}

function nxEditProfileName(){
  var isTr=document.documentElement.lang==='tr';
  var curName='';
  try{curName=nxFixMojibake(localStorage.getItem('nexusUserName')||'');}catch(e){}
  nxShowPrompt(
    isTr ? 'İsmi Düzenle' : 'Edit Display Name',
    isTr ? 'Hesabınız için görünecek yeni bir isim girin:' : 'Enter your new display name:',
    curName,
    function(newName){
      if(!newName)return;
      try{localStorage.setItem('nexusUserName', nxFixMojibake(newName));}catch(e){}
      nxUpdateNavAuth();
      nxOpenAuthModal();
    }
  );
}

// cloud-config.js CI'da üretilir; değer yoksa ağa gitmek yerine nedeni söylenir.
/* Bulut adresi + anonim anahtar build çıktısına gömülmez; sayfa /assets/cloud-config.js
   üzerinden gelir (gitignore'dur, CI/site yayınıda üretilir). Yoksa auth 'unavailable' der. */
function nxCloudConfig(){
  var c = (typeof window !== 'undefined' && window.NEXUS_CLOUD) || {};
  return { url: c.url || '', anonKey: c.anonKey || '' };
}
function nxAuthUnavailableMsg(){
  var isTr=document.documentElement.lang==='tr';
  return isTr?'Hesap işlemleri bu sürümde kapalı (bulut yapılandırması yok). Uygulamayı indirip oradan giriş yapabilirsin.':'Account actions are off in this build (no cloud config). Download the app and sign in there.';
}
function nxAuthUnavailable(){
  var isTr=document.documentElement.lang==='tr';
  nxShowAlert(nxAuthUnavailableMsg(),isTr?'Kullanımda değil':'Not available','warning');
}

function nxSendPasswordReset(){
  var isTr=document.documentElement.lang==='tr';
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  if(!user)return;
  var SUPABASE_URL=nxCloudConfig().url;
  var SUPABASE_KEY=nxCloudConfig().anonKey;
  if(!SUPABASE_URL||!SUPABASE_KEY){nxAuthUnavailable();return;}
  fetch(SUPABASE_URL+'/auth/v1/recover?redirect_to='+encodeURIComponent(window.location.origin+window.location.pathname),{
    method:'POST',
    headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({email:user})
  })
  .then(function(){
    nxShowAlert(
      isTr ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi ('+user+').' : 'Password reset link sent to your email ('+user+').',
      isTr ? 'Bağlantı Gönderildi' : 'Reset Link Sent',
      'success'
    );
  })
  .catch(function(){
    nxShowAlert(
      isTr ? 'Şifre sıfırlama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.' : 'Could not send reset email. Please try again later.',
      isTr ? 'Hata' : 'Error',
      'warning'
    );
  });
}

function nxCloseAuthModal(){
  var m=document.getElementById('nxAuthModal');
  if(!m)return;
  var recoveryView=document.getElementById('nxAuthRecoveryView');
  if(recoveryView && recoveryView.style.display!=='none'){
    recoveryView.style.display='none';
    nxRecoveryToken=null;nxRecoveryRefresh=null;nxRecoveryEmail='';
  }
  m.classList.remove('open');
  setTimeout(function(){
    m.style.display='none';
    nxUnlockScroll();
  },250);
}

function nxToggleAuthMode(){
  var isTr=document.documentElement.lang==='tr';
  var title=document.getElementById('nxAuthTitle');
  var sub=document.getElementById('nxAuthSubtitle');
  var submitBtn=document.getElementById('nxAuthSubmitBtn');
  var switchPrompt=document.getElementById('nxAuthSwitchPrompt');
  var alertEl=document.getElementById('nxAuthAlert');
  if(alertEl)alertEl.style.display='none';

  if(nxAuthMode==='login'){
    nxAuthMode='signup';
    if(title)title.textContent=isTr?'Yeni Hesap Oluştur':'Create Account';
    if(sub)sub.textContent=isTr?'Evini tek merkezden yönetmek için hemen ücretsiz kaydol.':'Sign up free to control your home with zero lock-in.';
    if(submitBtn)submitBtn.innerHTML='<span>'+(isTr?'Kayıt Ol':'Sign Up')+'</span>';
    if(switchPrompt)switchPrompt.textContent=isTr?'Zaten hesabınız var mı? Giriş Yap':'Already have an account? Sign In';
  }else{
    nxAuthMode='login';
    if(title)title.textContent=isTr?'Tekrar Hoş Geldin':'Welcome Back';
    if(sub)sub.textContent=isTr?'Evini tek merkezden yönetmek için giriş yap.':'Sign in to manage your smart home.';
    if(submitBtn)submitBtn.innerHTML='<span>'+(isTr?'Giriş Yap':'Sign In')+'</span>';
    if(switchPrompt)switchPrompt.textContent=isTr?'Hesabın yok mu? Yeni Hesap Oluştur':"Don't have an account? Sign up";
  }
}

function nxTogglePwVisible(){
  var input=document.getElementById('nxAuthPassword');
  var iconEl=document.getElementById('nxPwEyeIcon');
  if(!input||!iconEl)return;
  if(input.type==='password'){
    input.type='text';
    iconEl.innerHTML='<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  }else{
    input.type='password';
    iconEl.innerHTML='<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/></svg>';
  }
}

function nxGoogleLogin(){
  var SUPABASE_URL=nxCloudConfig().url;
  if(!SUPABASE_URL){nxAuthUnavailable();return;}
  var redir=window.location.origin + window.location.pathname;
  window.location.href = SUPABASE_URL + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(redir);
}

function nxForgotPassword(){
  var isTr=document.documentElement.lang==='tr';
  var email=(document.getElementById('nxAuthEmail').value||'').trim();
  nxShowPrompt(
    isTr ? 'Şifremi Unuttum' : 'Forgot Password',
    isTr ? 'Şifre sıfırlama bağlantısı gönderilecek e-posta adresinizi girin:' : 'Enter your email address to receive a password reset link:',
    email,
    function(inputEmail){
      if(!inputEmail)return;
      var alertEl=document.getElementById('nxAuthAlert');
      var SUPABASE_URL=nxCloudConfig().url;
      var SUPABASE_KEY=nxCloudConfig().anonKey;
      if(!SUPABASE_URL||!SUPABASE_KEY){if(alertEl){alertEl.textContent=nxAuthUnavailableMsg();alertEl.style.display='block';}return;}
      fetch(SUPABASE_URL+'/auth/v1/recover?redirect_to='+encodeURIComponent(window.location.origin+window.location.pathname),{
        method:'POST',
        headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({email:inputEmail})
      })
      .then(function(){
        nxShowAlert(
          isTr ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi ('+inputEmail+').' : 'Password reset link sent to your email ('+inputEmail+').',
          isTr ? 'Bağlantı Gönderildi' : 'Reset Link Sent',
          'success'
        );
      })
      .catch(function(){
        nxShowAlert(
          isTr ? 'Şifre sıfırlama e-postası gönderilemedi.' : 'Could not send reset email.',
          isTr ? 'Hata' : 'Error',
          'warning'
        );
      });
    }
  );
}

/* ---------- Şifre sıfırlama bağlantısı (site köküne dönen recovery akışı) ----------
   Supabase bağlantısı #access_token=…&type=recovery ile döner. Token oturum olarak
   yazılmaz; kullanıcı yeni şifresini kaydedince oturum açılır. */
var nxRecoveryToken=null;
var nxRecoveryRefresh=null;
var nxRecoveryEmail='';

function nxShowRecovery(){
  var m=document.getElementById('nxAuthModal');
  var formView=document.getElementById('nxAuthFormView');
  var profileView=document.getElementById('nxAuthProfileView');
  var recoveryView=document.getElementById('nxAuthRecoveryView');
  if(!m||!recoveryView)return;
  if(formView)formView.style.display='none';
  if(profileView)profileView.style.display='none';
  recoveryView.style.display='block';
  m.classList.remove('nx-account-open');
  m.setAttribute('aria-labelledby','nxRecoveryTitle');
  var emailEl=document.getElementById('nxRecoveryEmail');
  if(emailEl)emailEl.textContent=nxRecoveryEmail||'';
  var alertEl=document.getElementById('nxRecoveryAlert');
  if(alertEl)alertEl.style.display='none';
  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  nxLockScroll();
}

function nxSubmitRecovery(e){
  e.preventDefault();
  var isTr=document.documentElement.lang==='tr';
  var a=(document.getElementById('nxRecoveryPassword')||{}).value||'';
  var b=(document.getElementById('nxRecoveryPassword2')||{}).value||'';
  var btn=document.getElementById('nxRecoverySubmitBtn');
  var alertEl=document.getElementById('nxRecoveryAlert');
  var cfg=nxCloudConfig();

  function fail(msg){
    if(alertEl){alertEl.textContent=msg;alertEl.style.display='block';}
  }
  if(!nxRecoveryToken){fail(isTr?'Sıfırlama bağlantısı geçersiz. Yeni bir bağlantı isteyin.':'This reset link is invalid. Please request a new one.');return;}
  if(a.length<6){fail(isTr?'Şifre en az 6 karakter olmalıdır.':'Password must be at least 6 characters.');return;}
  if(a!==b){fail(isTr?'Şifreler eşleşmiyor.':'Passwords do not match.');return;}
  if(!cfg.url||!cfg.anonKey){fail(nxAuthUnavailableMsg());return;}

  var origText=btn?btn.innerHTML:'';
  if(btn){btn.disabled=true;btn.innerHTML=isTr?'Kaydediliyor…':'Saving…';}
  if(alertEl)alertEl.style.display='none';

  fetch(cfg.url+'/auth/v1/user',{
    method:'PUT',
    headers:{
      'apikey':cfg.anonKey,
      'Authorization':'Bearer '+nxRecoveryToken,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({password:a})
  })
  .then(function(res){
    return res.json().then(function(data){
      if(!res.ok){
        throw new Error(data.msg||data.message||data.error_description||(isTr?'Şifre kaydedilemedi.':'Could not save the password.'));
      }
      return data;
    });
  })
  .then(function(data){
    if(btn){btn.disabled=false;btn.innerHTML=origText;}
    var email=(data&&data.email)||nxRecoveryEmail;
    try{
      if(email)localStorage.setItem('nexusCurrentUser',email);
      localStorage.setItem('nexus_cloud_session',JSON.stringify({
        accessToken:nxRecoveryToken,
        refreshToken:nxRecoveryRefresh,
        userId:(data&&data.id)||null,
        email:email
      }));
    }catch(err){}
    nxRecoveryToken=null;nxRecoveryRefresh=null;nxRecoveryEmail='';
    nxCloseAuthModal();
    nxUpdateNavAuth();
    nxShowAlert(
      isTr?'Şifreniz güncellendi ve hesabınıza giriş yapıldı.':'Your password has been updated and you are signed in.',
      isTr?'Şifre Güncellendi':'Password Updated',
      'success'
    );
  })
  .catch(function(err){
    if(btn){btn.disabled=false;btn.innerHTML=origText;}
    var msg=String((err&&err.message)||'');
    if(/expired|invalid|jwt/i.test(msg))msg=isTr?'Bağlantının süresi dolmuş. Yeni bir sıfırlama bağlantısı isteyin.':'This link has expired. Please request a new reset link.';
    else if(/same|different/i.test(msg))msg=isTr?'Yeni şifre eskisinden farklı olmalı.':'The new password must be different from the old one.';
    fail(msg||(isTr?'Şifre kaydedilemedi.':'Could not save the password.'));
  });
}

function nxSubmitAuth(e){
  e.preventDefault();
  var isTr=document.documentElement.lang==='tr';
  var email=(document.getElementById('nxAuthEmail').value||'').trim();
  var pass=document.getElementById('nxAuthPassword').value||'';
  var btn=document.getElementById('nxAuthSubmitBtn');
  var alertEl=document.getElementById('nxAuthAlert');

  if(!email||!pass)return;

  btn.disabled=true;
  var origText=btn.innerHTML;
  btn.innerHTML=isTr?'İşleniyor…':'Processing…';
  if(alertEl)alertEl.style.display='none';

  var SUPABASE_URL=nxCloudConfig().url;
  var SUPABASE_KEY=nxCloudConfig().anonKey;
  if(!SUPABASE_URL||!SUPABASE_KEY){
    btn.disabled=false;btn.innerHTML=origText;
    if(alertEl){alertEl.textContent=nxAuthUnavailableMsg();alertEl.style.display='block';}
    return;
  }

  var endpoint=nxAuthMode==='signup'
    ? SUPABASE_URL+'/auth/v1/signup?redirect_to='+encodeURIComponent(window.location.origin+window.location.pathname)
    : SUPABASE_URL+'/auth/v1/token?grant_type=password';

  fetch(endpoint,{
    method:'POST',
    headers:{
      'apikey':SUPABASE_KEY,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({email:email,password:pass})
  })
  .then(function(res){
    return res.json().then(function(data){
      if(!res.ok){
        throw new Error(data.error_description||data.msg||data.message||'İşlem başarısız');
      }
      return data;
    });
  })
  .then(function(data){
    btn.disabled=false;
    btn.innerHTML=origText;
    var userEmail=(data.user&&data.user.email)||email;
    if(!data.access_token){
      /* E-posta doğrulaması açık: oturum yok. Kullanıcıyı giriş yapmış gibi
         göstermek yanıltıcıydı; doğrulama bağlantısına yönlendiriyoruz. */
      nxShowAlert(
        isTr ? 'Kayıt alındı. Giriş yapabilmek için e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.' : 'Account created. Click the verification link we sent to your email to sign in.',
        isTr ? 'E-postanızı Kontrol Edin' : 'Check Your Email',
        'success'
      );
      return;
    }
    try{
      localStorage.setItem('nexusCurrentUser',userEmail);
      if(data.user && data.user.user_metadata){
        if(data.user.user_metadata.avatar_url || data.user.user_metadata.picture){
          localStorage.setItem('nexusUserAvatar', data.user.user_metadata.avatar_url || data.user.user_metadata.picture);
        }
        if(data.user.user_metadata.full_name || data.user.user_metadata.name){
          localStorage.setItem('nexusUserName', nxFixMojibake(data.user.user_metadata.full_name || data.user.user_metadata.name));
        }
      }
      localStorage.setItem('nexus_cloud_session',JSON.stringify({
        accessToken:data.access_token,
        refreshToken:data.refresh_token,
        userId:data.user?data.user.id:null,
        email:userEmail
      }));
    }catch(e){}
    nxUpdateNavAuth();
    nxOpenAuthModal();
  })
  .catch(function(err){
    btn.disabled=false;
    btn.innerHTML=origText;
    if(alertEl){
      var msg=err.message||'';
      if(/invalid login credentials/i.test(msg)){
        msg=isTr?'E-posta adresi veya şifre hatalı.':'Invalid email or password.';
      }else if(/already registered/i.test(msg)){
        msg=isTr?'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.':'This email is already registered. Please sign in.';
      }else if(/Password should be at least/i.test(msg)){
        msg=isTr?'Şifre en az 6 karakter olmalıdır.':'Password must be at least 6 characters.';
      }
      alertEl.textContent=msg;
      alertEl.style.display='block';
    }
  });
}

function nxSignOut(){
  try{
    localStorage.removeItem('nexusCurrentUser');
    localStorage.removeItem('nexusUserName');
    localStorage.removeItem('nexusUserAvatar');
    localStorage.removeItem('nexus_cloud_session');
  }catch(e){}
  nxUpdateNavAuth();
  nxCloseAuthModal();
}

// Fiyatlandırma: Aylık / Yıllık geçişi
// Rakamlar ve indirim oranı build'de PRICES'tan enjekte edilir (tek kaynak cloud-sync.js);
// elle yazılan fiyatlar zam geldiğinde yalan söylüyordu. site.js tek dosya olduğu için
// para birimi sayfanın dilinden seçilir (TR → TL, diğerleri → USD; cloud-sync.js de öyle yapıyor).
var NX_BILLING = {"tr":{"price":{"monthly":"₺499,99","yearly":"₺3.999,99","perMonthOfYear":"₺333,33"},"save":33},"en":{"price":{"monthly":"$11.99","yearly":"$89.99","perMonthOfYear":"$7.50"},"save":37}};
function nxSetBilling(period){
  var isYearly=period==='yearly';
  var btnM=document.getElementById('billingMonthly');
  var btnY=document.getElementById('billingYearly');
  if(btnM)btnM.classList.toggle('active',!isYearly);
  if(btnY)btnY.classList.toggle('active',isYearly);

  var isTr=document.documentElement.lang==='tr';
  var bundle=NX_BILLING[isTr?'tr':'en'];
  var priceVal=document.getElementById('planPriceVal');
  var periodVal=document.getElementById('planPeriodVal');
  var priceNote=document.getElementById('planPriceNote');
  var cta=document.getElementById('nexusPlusCta');

  if(isYearly){
    if(priceVal)priceVal.textContent=bundle.price.perMonthOfYear;
    if(periodVal)periodVal.textContent=isTr?'/ay, yıllık':'/mo, billed yearly';
    if(priceNote)priceNote.textContent=isTr
      ? ('Yıllık ' + bundle.price.yearly + ' olarak faturalandırılır (%' + bundle.save + ' tasarruf)')
      : ('Billed as ' + bundle.price.yearly + '/yr (Save ' + bundle.save + '%)');
    if(cta){
      cta.dataset.plan=isYearly?cta.dataset.yearlyPlan:cta.dataset.monthlyPlan;
      if(cta.dataset.yearlyUrl && isYearly)cta.href=cta.dataset.yearlyUrl;
      if(cta.dataset.yearlyLabel && isYearly)cta.textContent=cta.dataset.yearlyLabel;
      if(cta.dataset.monthlyLabel && !isYearly)cta.textContent=cta.dataset.monthlyLabel;
    }
  }else{
    if(priceVal)priceVal.textContent=bundle.price.monthly;
    if(periodVal)periodVal.textContent=isTr?'/ay':'/mo';
    if(priceNote)priceNote.textContent=isTr?'Aylık faturalandırma':'Billed monthly';
    if(cta){
      cta.dataset.plan=cta.dataset.monthlyPlan;
      if(cta.dataset.monthlyUrl)cta.href=cta.dataset.monthlyUrl;
      if(cta.dataset.monthlyLabel)cta.textContent=cta.dataset.monthlyLabel;
    }
  }
}

function nxOpenCheckout(e){
  var cta=document.getElementById('nexusPlusCta');
  if(!cta) return true;
  var yearly=document.getElementById('billingYearly');
  var isYearly=yearly && yearly.classList.contains('active');
  var url = isYearly ? (cta.dataset.yearlyUrl || ('https://whop.com/checkout/' + cta.dataset.yearlyPlan))
                     : (cta.dataset.monthlyUrl || ('https://whop.com/checkout/' + (cta.dataset.plan || cta.dataset.monthlyPlan)));
  if(url){
    if(e && e.preventDefault) e.preventDefault();
    var returnUrl = window.location.origin + window.location.pathname + '?payment=success';
    var sep = url.indexOf('?') >= 0 ? '&' : (url.endsWith('/') ? '?' : '/?');
    window.location.href = url + sep + 'redirect_url=' + encodeURIComponent(returnUrl);
    return false;
  }
  return true;
}
function nxCloseCheckout(){
  var modal=document.getElementById('nxCheckoutModal');
  if(!modal) return;
  modal.classList.remove('open');
  setTimeout(function(){
    modal.style.display='none';
    var box=document.getElementById('nxCheckoutMount');
    if(box) box.innerHTML='';
    nxUnlockScroll();
  }, 220);
}
function nxCloudSession(){
  try { return JSON.parse(localStorage.getItem('nexus_cloud_session')||'null'); } catch(err){ return null; }
}
function nxOpenBilling(){
  var panel=document.getElementById('nxBillingPanel');
  if(panel) panel.style.display='block';
  nxLoadBilling('status');
}
function nxLoadBilling(action){
  var status=document.getElementById('nxBillingStatus');
  var pays=document.getElementById('nxBillingPays');
  var cancelBtn=document.getElementById('nxBillingCancel');
  var isTr=document.documentElement.lang==='tr';
  var session=nxCloudSession();
  var cfg=nxCloudConfig();
  if(!session||!session.accessToken||!cfg.url||!cfg.anonKey){
    if(status) status.textContent=isTr?'Aboneliği görmek için yeniden giriş yap.':'Sign in again to see the subscription.';
    if(cancelBtn) cancelBtn.style.display='none';
    return;
  }
  if(status) status.textContent=isTr?'Yükleniyor…':'Loading…';
  fetch(cfg.url+'/functions/v1/whop-account',{
    method:'POST',
    headers:{ Authorization:'Bearer '+session.accessToken, apikey:cfg.anonKey, 'Content-Type':'application/json' },
    body:JSON.stringify({ action: action==='cancel'?'cancel':'status' })
  }).then(function(r){
    return r.json().then(function(d){ return { ok:r.ok, d:d }; });
  }).then(function(res){
    if(!res.ok){
      if(status) status.textContent=isTr?'Abonelik bilgisi alınamadı.':'Could not load the subscription.';
      if(cancelBtn) cancelBtn.style.display='none';
      return;
    }
    var m=res.d.membership;
    if(!m){
      if(status) status.textContent=isTr?'Bu hesapta NEXUS+ aboneliği yok.':'This account has no NEXUS+ subscription.';
      if(cancelBtn) cancelBtn.style.display='none';
    }else{
      var when=m.periodEnd ? new Date(m.periodEnd).toLocaleDateString(isTr?'tr-TR':'en-US') : '';
      if(status) status.textContent=(m.plan||'NEXUS+')+(m.cancelAtPeriodEnd?(isTr?' · dönem sonunda bitecek':' · ends at period end'):'')+(when?(isTr?' · yenileme ':' · renews ')+when:'');
      if(cancelBtn) cancelBtn.style.display=m.cancelAtPeriodEnd?'none':'flex';
    }
    if(pays){
      pays.innerHTML='';
      (res.d.payments||[]).forEach(function(pmt){
        var li=document.createElement('li');
        li.textContent=[pmt.amount, pmt.currency, pmt.status].filter(Boolean).join(' · ');
        pays.appendChild(li);
      });
    }
  }).catch(function(){
    if(status) status.textContent=isTr?'Abonelik bilgisi alınamadı.':'Could not load the subscription.';
  });
}

// SSS tek-açıklık davranışı
function nxToggleFaq(btn){
  var item=btn.closest('.faq-item');
  var isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(el){
    el.classList.remove('open');
    var b=el.querySelector('.faq-q');
    if(b)b.setAttribute('aria-expanded','false');
  });
  if(!isOpen){item.classList.add('open');btn.setAttribute('aria-expanded','true');}
}

// Gerçekçi Akıllı Telefon Ön İzleme Kontrolleri
var nxCurrentShot=0;
var nxShotTimer=null;

function nxShowShot(idx){
  var slides=document.querySelectorAll('.shot-slide');
  var dots=document.querySelectorAll('.phone-dot');
  if(!slides.length)return;
  if(idx<0)idx=slides.length-1;
  if(idx>=slides.length)idx=0;
  nxCurrentShot=idx;

  slides.forEach(function(s,i){
    s.classList.toggle('active',i===idx);
  });
  dots.forEach(function(d,i){
    d.classList.toggle('active',i===idx);
    d.setAttribute('aria-selected',i===idx?'true':'false');
  });

  var titleEl=document.getElementById('phoneSlideTitle');
  var numEl=document.getElementById('phoneSlideNum');
  var activeSlide=slides[idx];
  if(activeSlide){
    var label=activeSlide.getAttribute('data-label')||activeSlide.getAttribute('data-shot')||'';
    if(titleEl)titleEl.textContent=label;
    if(numEl)numEl.textContent=(idx+1)+'/'+slides.length;
  }
}

function nxNextShot(){
  nxShowShot(nxCurrentShot+1);
  nxHoldShotTimer(8000);
}

function nxPrevShot(){
  nxShowShot(nxCurrentShot-1);
  nxHoldShotTimer(8000);
}

function nxResetShotTimer(){
  if(nxShotTimer){ clearInterval(nxShotTimer); nxShotTimer=null; }
}

/* Otomatik tanıtım: hero görünürken 4 sn'de bir sonraki ekran. Kullanıcı
   dokunursa kısa süre durur, sonra kendiliğinden devam eder; sekme arka
   plana geçince veya maket görünmezken saymaz. */
var nxShotHold=null;
var nxPhoneInView=true;
function nxShotTick(){
  if(document.hidden || !nxPhoneInView || nxPreviewOn) return;
  nxShowShot(nxCurrentShot+1);
}
function nxStartShotTimer(){
  if(nxShotTimer || nxPreviewOn || nxShotHold) return;
  if(document.hidden || !nxPhoneInView) return;
  nxShotTimer=setInterval(nxShotTick,4000);
}
function nxHoldShotTimer(ms){
  nxResetShotTimer();
  if(nxShotHold){ clearTimeout(nxShotHold); nxShotHold=null; }
  if(nxPreviewOn) return;
  nxShotHold=setTimeout(function(){ nxShotHold=null; nxStartShotTimer(); }, ms||8000);
}

// Web uygulaması yayında değil. Telefon, uygulama ve programla aynı ekranların görsellerini gösterir.
var nxPreviewOn=false;

function nxScalePreview(){
  var box=document.querySelector('.phone-inner-screen');
  if(!box)return;
  var w=box.clientWidth||390;
  box.style.setProperty('--nx-preview-scale',(w/390).toFixed(4));
}

function nxUseShotFallback(){
  var prev=document.getElementById('phonePreview');
  var shots=document.querySelector('.phone-screen-content');
  var mock=document.getElementById('phoneMockup');
  if(prev) prev.style.display='none';
  if(shots){ shots.style.display='block'; shots.removeAttribute('aria-hidden'); }
  if(mock) mock.classList.remove('previewing');
  nxPreviewOn=false;
  nxResetShotTimer();
}
function nxPreviewLooksEmpty(frame){
  try{
    var href=frame.contentWindow && frame.contentWindow.location && frame.contentWindow.location.href;
    return !href || href==='about:blank';
  }catch(e){
    return false;
  }
}
function nxPreviewPage(){
  var page='stitch-home.html';
  var extra='';
  try{
    var saved=sessionStorage.getItem('nxPreviewPage')||'';
    if(/^stitch-[a-z0-9-]+\.html$/.test(saved)) page=saved;
    var idx=sessionStorage.getItem('nxPreviewIndex')||'';
    if(/^\d+$/.test(idx)) extra='&i='+idx;
  }catch(e){}
  return page+'?preview=1'+extra;
}
var nxPreviewBooted=false;
function nxBootPreview(){
  if(nxPreviewBooted) return;
  nxPreviewBooted=true;
  nxUseShotFallback();
}
window.addEventListener('message',function(e){
  var frame=document.getElementById('phonePreviewFrame');
  if(!frame) return;
  var base=frame.getAttribute('data-src')||'';
  var root=base.replace(/stitch-[a-z0-9-]+\.html.*$/,'');
  if(!root || e.origin!==root.replace(/\/$/,'')) return;
  var data=e.data||{};
  if(data.source!=='nexus-preview') return;
  var page=String(data.page||'');
  if(!/^stitch-[a-z0-9-]+\.html$/.test(page)) return;
  var idx=String(data.index||'');
  if(idx && !/^\d+$/.test(idx)) return;
  try{
    sessionStorage.setItem('nxPreviewPage', page);
    if(idx) sessionStorage.setItem('nxPreviewIndex', idx);
    else sessionStorage.removeItem('nxPreviewIndex');
  }catch(err){}
});

function nxSetPhoneMode(mode){
  nxBootPreview();
}

window.addEventListener('resize',nxScalePreview);
document.addEventListener('DOMContentLoaded',nxBootPreview);

// Telefon dokunma, sürükleme ve tıklama yönetimi
document.addEventListener('DOMContentLoaded',function(){
  var mockup=document.getElementById('phoneMockup');
  if(mockup){
    mockup.addEventListener('mouseenter',function(){if(nxPreviewOn)return;nxResetShotTimer();if(nxShotHold){clearTimeout(nxShotHold);nxShotHold=null;}});
    mockup.addEventListener('mouseleave',function(){if(nxPreviewOn)return;nxHoldShotTimer(3000);});

    mockup.addEventListener('click',function(e){
      if(nxPreviewOn)return;
      if(e.target.closest('.phone-arrow')) return;
      var rect=mockup.getBoundingClientRect();
      var x=e.clientX-rect.left;
      if(x<rect.width*0.35){
        nxPrevShot();
      }else{
        nxNextShot();
      }
    });

    var touchStartX=0;
    var touchEndX=0;
    mockup.addEventListener('touchstart',function(e){
      if(nxPreviewOn)return;
      touchStartX=e.changedTouches[0].screenX;
      nxResetShotTimer();
      if(nxShotHold){clearTimeout(nxShotHold);nxShotHold=null;}
    },{passive:true});
    mockup.addEventListener('touchend',function(e){
      if(nxPreviewOn)return;
      touchEndX=e.changedTouches[0].screenX;
      var diff=touchEndX-touchStartX;
      if(diff>40) nxPrevShot();
      else if(diff<-40) nxNextShot();
      nxHoldShotTimer(8000);
    },{passive:true});
  }

  /* Sekme gizliyken sayma, maket görünmezken de durur; geri gelince kısa bir
     aralıkla devam eder. Ok/dot ve nxNext/Prev çağrıları 8 sn'lik bekleme koyar. */
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){ nxResetShotTimer(); if(nxShotHold){clearTimeout(nxShotHold);nxShotHold=null;} }
    else if(nxPhoneInView){ nxHoldShotTimer(1200); }
  });
  var phoneWrap=document.querySelector('.phone-wrapper');
  if(phoneWrap && 'IntersectionObserver' in window){
    var phoneIo=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        nxPhoneInView=en.isIntersecting;
        if(nxPhoneInView){ nxHoldShotTimer(900); }
        else { nxResetShotTimer(); if(nxShotHold){clearTimeout(nxShotHold);nxShotHold=null;} }
      });
    },{ threshold:0.25 });
    phoneIo.observe(phoneWrap);
  }
  /* Koşulsuz başlangıç: IO arka plan sekmesinde ertelenirse bile tanıtım kalksın.
     nxShotTick zaten document.hidden ve görünüm kontrolü yapıyor. */
  nxStartShotTimer();

  /* OAuth / Google girişi, e-posta doğrulama ve şifre sıfırlama dönüşleri.
     Supabase implicit akışı belirteçleri hash içinde döndürür:
       • type=recovery → yeni şifre görünümü açılır (token oturum sayılmaz)
       • type=signup/email → e-posta doğrulandı, oturum açılır
       • error/error_description → süresi dolmuş bağlantı bildirimi
     Hash her durumda temizlenir; belirteç adres çubuğunda kalmaz. */
  var nxHashParams=null;
  if(window.location.hash && window.location.hash.length>1){
    try{nxHashParams=new URLSearchParams(window.location.hash.substring(1));}catch(e){nxHashParams=null;}
  }
  if(nxHashParams){
    var nxHashError=nxHashParams.get('error_description')||nxHashParams.get('error');
    if(nxHashError){
      var nxHashIsTr=document.documentElement.lang==='tr';
      var nxHashErrText=String(nxHashError).replace(/\+/g,' ');
      try{nxHashErrText=decodeURIComponent(nxHashErrText);}catch(e){}
      nxShowAlert(
        /expired|invalid/i.test(nxHashErrText)
          ? (nxHashIsTr?'Bağlantının süresi dolmuş ya da geçersiz. Yeni bir bağlantı isteyin.':'This link has expired or is invalid. Please request a new one.')
          : nxHashErrText,
        nxHashIsTr?'Bağlantı Hatası':'Link Error',
        'warning'
      );
      history.replaceState(null,null,window.location.pathname+window.location.search);
    }else if(nxHashParams.get('access_token')){
      var nxHashToken=nxHashParams.get('access_token');
      var nxHashType=nxHashParams.get('type')||'';
      var nxHashRefresh=nxHashParams.get('refresh_token');
      var nxPayload=nxDecodeJwt(nxHashToken);
      var nxUserEmail=nxPayload.email||'kullanici@nexus';
      var nxMeta=nxPayload.user_metadata||{};
      if(nxHashType==='recovery'){
        nxRecoveryToken=nxHashToken;
        nxRecoveryRefresh=nxHashRefresh;
        nxRecoveryEmail=nxUserEmail;
        nxShowRecovery();
      }else{
        try{
          localStorage.setItem('nexusCurrentUser',nxUserEmail);
          if(nxMeta.avatar_url || nxMeta.picture){
            localStorage.setItem('nexusUserAvatar', nxMeta.avatar_url || nxMeta.picture);
          }
          if(nxMeta.full_name || nxMeta.name){
            localStorage.setItem('nexusUserName', nxFixMojibake(nxMeta.full_name || nxMeta.name));
          }
          localStorage.setItem('nexus_cloud_session',JSON.stringify({
            accessToken:nxHashToken,
            refreshToken:nxHashRefresh,
            userId:nxPayload.sub,
            email:nxUserEmail
          }));
        }catch(e){}
        nxUpdateNavAuth();
        if(nxHashType==='invite'){
          var nxInviteIsTr=document.documentElement.lang==='tr';
          nxShowAlert(
            nxInviteIsTr?'Davet kabul edildi — NEXUS hesabın hazır. Artık uygulama ve programla aynı hesapla giriş yapabilirsin.':'Invite accepted — your NEXUS account is ready. Sign in with the same account in the app and the desktop program.',
            nxInviteIsTr?'Davet Kabul Edildi':'Invite Accepted',
            'success'
          );
        }else if(nxHashType==='signup' || nxHashType==='email'){
          var nxSignupIsTr=document.documentElement.lang==='tr';
          nxShowAlert(
            nxSignupIsTr?'E-posta adresiniz doğrulandı ve giriş yapıldı.':'Your email is verified and you are signed in.',
            nxSignupIsTr?'E-posta Doğrulandı':'Email Verified',
            'success'
          );
        }
      }
      history.replaceState(null,null,window.location.pathname+window.location.search);
    }
  }

  // Whop Ödeme Dönüşü Kontrolü (Success / Cancel / Failed)
  try {
    var searchParams = new URLSearchParams(window.location.search);
    var payStatus = searchParams.get('payment') || searchParams.get('checkout') || searchParams.get('status');
    if(payStatus){
      var isTr = document.documentElement.lang === 'tr';
      if(payStatus === 'success'){
        nxShowAlert(
          isTr
            ? 'NEXUS+ ayrıcalıklarınız hesabınıza başarıyla tanımlandı. Uygulamayı indirip giriş yaparak tüm özelliklerin ve NEXUS AI yapay zekâsının tadını çıkarabilirsiniz.'
            : 'Your NEXUS+ privileges are now active on your account. Download the app and sign in to enjoy all premium features and NEXUS AI.',
          isTr ? 'Aboneliğiniz Başlatıldı!' : 'Subscription Activated!',
          'success',
          function(){
            var dl = document.getElementById('downloads');
            if(dl) dl.scrollIntoView({ behavior: 'smooth' });
          }
        );
      } else if(payStatus === 'failed' || payStatus === 'error'){
        nxShowAlert(
          isTr
            ? 'Ödeme işlemi tamamlanamadı veya kartınız onaylanmadı. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin veya bankanızla görüşün.'
            : 'Payment could not be completed. Please check your card information and try again, or contact your issuing bank.',
          isTr ? 'Ödeme Gerçekleştirilemedi' : 'Payment Failed',
          'warning'
        );
      } else if(payStatus === 'cancel' || payStatus === 'canceled' || payStatus === 'cancelled'){
        nxShowAlert(
          isTr
            ? 'Ödeme adımı tamamlanmadan sonlandırıldı. İstediğiniz zaman planınızı seçip ücretsiz denemenizi başlatabilirsiniz.'
            : 'Checkout was not completed. You can start your free trial whenever you are ready.',
          isTr ? 'Ödeme İptal Edildi' : 'Checkout Canceled',
          'info'
        );
      }
      var cleanUrl = window.location.pathname + (window.location.hash || '');
      history.replaceState(null, document.title, cleanUrl);
    }
  } catch(e) {}

  // Giriş Durumu Güncelleme
  nxUpdateNavAuth();

  // İndirme: GitHub sürümü kaynak sürümüne yetişmişse oradan, değilse geçici kayıttan.
  // Etiket yine açılınca (Actions) latest bağlantıları kendiliğinden kullanılır.
  var NX_VER="1.0.28";
  function nxVerLess(a,b){
    var pa=String(a).replace(/^v/,'').split('.').map(function(n){return parseInt(n,10)||0;});
    var pb=String(b).replace(/^v/,'').split('.').map(function(n){return parseInt(n,10)||0;});
    for(var i=0;i<3;i++){var da=pa[i]||0,db=pb[i]||0;if(da!==db)return da<db;}
    return false;
  }
  function nxApplyVer(tag){
    var v=String(tag||'');
    if(v.indexOf('v')===0)v=v.slice(1);
    if(!v)return;
    document.querySelectorAll('[data-nexus-ver]').forEach(function(el){el.textContent='v'+v;}); fetch('https://api.github.com/repos/Enard52/NEXUS/contributors?per_page=24').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}).then(function(list){ if(!Array.isArray(list)||!list.length)return; var box=document.getElementById('nx-contrib'); if(!box)return; var SAFE_LOGIN=(function(s){if(typeof s!=='string'||s.length<1||s.length>39)return false;for(var i=0;i<s.length;i++){var c=s.charAt(i);var ok=(c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')||c==='-'||c==='_'||c==='.';if(!ok)return false;}return true;}), SAFE_PAGE='https://github.com/', SAFE_AV='https://avatars.githubusercontent.com/u/'; list.forEach(function(u){ if(!u||typeof u!=='object')return; var login=String(u.login||''); if(!SAFE_LOGIN(login))return; /* kurucular yukarıda sabit chip olarak durur */ if(login==='Enard52'||login==='hadesonline02')return; var page=SAFE_PAGE+login; if(u.html_url&&String(u.html_url).indexOf('https://github.com/')===0)page=u.html_url; var av=String(u.avatar_url||''); if(av.indexOf('https://avatars.githubusercontent.com/u/')!==0)return; var a=document.createElement('a'); a.href=page; a.target='_blank'; a.rel='noopener'; a.title='@'+login; a.className='contrib-chip'; var img=document.createElement('img'); img.src=av; img.alt='@'+login; img.width=88; img.height=88; img.loading='lazy'; var name=document.createElement('span'); name.className='contrib-login'; name.textContent='@'+login; a.appendChild(img); a.appendChild(name); box.appendChild(a); }); });
  }
  Promise.all([
    fetch('https://api.github.com/repos/Enard52/nexus-releases/releases/latest').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),
    fetch('/downloads/current.json').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})
  ]).then(function(pair){
    var gh=pair[0], mirror=pair[1];
    var ghVer=gh&&gh.tag_name?String(gh.tag_name).replace(/^v/,''):'';
    var ghReady=!!ghVer && !nxVerLess(ghVer, NX_VER);
    if(ghReady) nxApplyVer(gh.tag_name);
    if(ghReady || !mirror || !mirror.files) return;
    /* current.json = acil durum freni; dokunulmadığı sürece HİÇBİR bağlantı yazılmaz.
       'releases/latest/download/…' zaten GitHub'in en yeni YAYINLANMIŞ sürümüne döner,
       yani sürüm yükseltmek için bu dosyayı güncellemek gerekmez.
       Neden varsayılan kapalı — 29 Ekim'de iki ayrı başarısızlık modu da ölçüldü:
         a) dosya bayat kaldı (1.0.27 çıktı, JSON 1.0.26'da kaldı) → API'ya ulaşamayan
            ziyaretçi SESSİZCE ESKİ — o vakada çöken — kurucuya yönlendi;
         b) dosya öne düştü (sürüm basıldı, CI kurucusu henüz yüklenmedi) → pinli adres
            404 verir; 'latest' ise çalışmaya devam ederdi.
       Fren gerçekten gerekirse (bozuk bir sürüm yayımlandıysa) bakımcı "pinned": true
         ve doğrulanmış iyi sürümü elle yazar; bilinçli tek hamle, sessiz varsayılan değil. */
    if(mirror.pinned !== true) return;
    var names=mirror.files;
    document.querySelectorAll('a[href*="nexus-releases/releases/latest/download/"]').forEach(function(a){
      var file=decodeURIComponent((a.getAttribute('href')||'').split('/').pop().split('?')[0]);
      if(names[file]) a.href=names[file];
    });
  });

  // ESC Tuşu ile Modal Kapatma
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      nxCloseContactModal();
      nxCloseAuthModal();
    }
  });

  // Nav ve sayfa içi bağlantılarda akıcı animasyonlu kaydırma ve ScrollSpy
  function nxInitSmoothNav(){
    var navLinks = document.querySelectorAll('.nav a');
    var isAutoScrolling = false;

    function nxNormalizePath(p){
      if(!p) return '/';
      var s = String(p).split('?')[0].split('#')[0];
      if(s.slice(-11) === '/index.html') s = s.slice(0, -10);
      while(s.length > 1 && s.charAt(s.length - 1) === '/') s = s.slice(0, -1);
      return s || '/';
    }

    function nxSmoothScrollTo(targetEl, callback){
      if(!targetEl) return;
      var header = document.querySelector('.hd');
      var headerH = header ? header.offsetHeight : 68;
      var targetY = Math.max(0, targetEl.getBoundingClientRect().top + window.pageYOffset - headerH - 14);

      if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        window.scrollTo(0, targetY);
        if(callback) callback();
        return;
      }

      // Sekme görünmüyorken animasyon kareleri işletilmez: gizli sekmede doğrudan atla.
      if(document.hidden){
        window.scrollTo(0, targetY);
        if(callback) callback();
        return;
      }

      var startY = window.pageYOffset;
      var diff = targetY - startY;
      if(Math.abs(diff) < 2){
        if(callback) callback();
        return;
      }

      isAutoScrolling = true;
      var duration = Math.min(650, Math.max(340, Math.abs(diff) * 0.42));
      var startTime = null;
      var isCancelled = false;

      function onInterrupt(){
        isCancelled = true;
        isAutoScrolling = false;
        cleanup();
      }
      function cleanup(){
        window.removeEventListener('wheel', onInterrupt);
        window.removeEventListener('touchstart', onInterrupt);
      }
      window.addEventListener('wheel', onInterrupt, { passive: true });
      window.addEventListener('touchstart', onInterrupt, { passive: true });

      function easeOutQuart(x){
        return 1 - Math.pow(1 - x, 4);
      }

      function step(currentTime){
        if(isCancelled) return;
        if(!startTime) startTime = currentTime;
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = easeOutQuart(progress);
        window.scrollTo(0, startY + diff * eased);

        if(progress < 1){
          requestAnimationFrame(step);
        } else {
          cleanup();
          setTimeout(function(){
            isAutoScrolling = false;
            if(callback) callback();
          }, 60);
        }
      }

      requestAnimationFrame(step);
    }

    // Click dinleyicisi: Nav butonları ve sayfa içi bağlantılar
    document.addEventListener('click', function(e){
      var a = e.target.closest('a');
      if(!a) return;
      var rawHref = a.getAttribute('href');
      if(!rawHref) return;

      var url;
      try {
        url = new URL(a.href, window.location.href);
      } catch(err){
        return;
      }

      if(nxNormalizePath(url.pathname) === nxNormalizePath(window.location.pathname) && url.hash){
        var id = url.hash.replace(/^#/, '');
        var target = id ? document.getElementById(id) : null;
        if(target){
          e.preventDefault();
          if(history.pushState){
            history.pushState(null, '', url.hash);
          }

          if(a.closest('.nav')){
            navLinks.forEach(function(l){ l.classList.remove('active'); });
            a.classList.add('active');
          }

          nxSmoothScrollTo(target, function(){
            updateScrollSpy();
          });
        }
      }
    });

    // ScrollSpy
    var sections = [];
    navLinks.forEach(function(a){
      var href = a.getAttribute('href') || '';
      var id = href.replace(/^.*#/, '');
      var sec = id ? document.getElementById(id) : null;
      if(sec) sections.push({ id: id, el: sec, link: a });
    });

    function updateScrollSpy(){
      if(isAutoScrolling || !sections.length) return;
      var header = document.querySelector('.hd');
      var headerH = (header ? header.offsetHeight : 68) + 80;
      var scrollPos = window.pageYOffset + headerH;
      var atBottom = (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 60);
      var currentId = null;

      if(atBottom){
        currentId = sections[sections.length - 1].id;
      } else if(window.pageYOffset < 140){
        currentId = null;
      } else {
        for(var i = sections.length - 1; i >= 0; i--){
          var top = sections[i].el.getBoundingClientRect().top + window.pageYOffset;
          if(scrollPos >= top){
            currentId = sections[i].id;
            break;
          }
        }
      }

      sections.forEach(function(item){
        if(item.id === currentId){
          item.link.classList.add('active');
        } else {
          item.link.classList.remove('active');
        }
      });
    }

    if(sections.length){
      var ticking = false;
      window.addEventListener('scroll', function(){
        if(!ticking && !isAutoScrolling){
          requestAnimationFrame(function(){
            updateScrollSpy();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      updateScrollSpy();
    }
  }

  /* ---------- Premium mikro-etkileşimler (kademeli açılış, platform vurgusu, yukarı çık) ---------- */
  (function nxPolish(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tr = document.documentElement.lang === 'tr';
    window.__nxSiteReady = true;

    // 1) Scroll-reveal (AOS örüntüsü): .rv öğeleri görünüme girince belirir.
    //    Kademeli gecikme: aynı kapsayıcıdaki .rv kardeşler sırayla gelir (en fazla 5 adım).
    var rvEls = Array.prototype.slice.call(document.querySelectorAll('.rv'));
    if(rvEls.length){
      rvEls.forEach(function(el){
        var i = 0, sib = el.parentElement ? el.parentElement.children : [];
        for(var k = 0; k < sib.length && sib[k] !== el; k++){
          if(sib[k].classList && sib[k].classList.contains('rv')) i++;
        }
        el.style.setProperty('--rv-i', String(Math.min(i, 5)));
      });
      if(document.documentElement.classList.contains('nx-io') && 'IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(en.isIntersecting){ en.target.classList.add('rv-in'); io.unobserve(en.target); }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
        rvEls.forEach(function(el){ io.observe(el); });
        /* Güvenlik ağı: arka plan sekmesinde IO geri çağrıları ertelenebilir.
           Görünür pencerede IO zaten anındadır; gecikse bile ilk ekrandaki öğeler
           1.2 sn içinde zorunlu belirir — kullanıcı asla boş bölüm görmez. */
        setTimeout(function(){
          Array.prototype.forEach.call(rvEls, function(el){
            if(el.classList.contains('rv-in')) return;
            var r = el.getBoundingClientRect();
            if(r.top < window.innerHeight && r.bottom > 0) el.classList.add('rv-in');
          });
        }, 1200);
      }
    }

    // 2) Yukarı çık düğmesi: kaydırınca belirir, var olan yumuşak kaydırmayı kullanır.
    var topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.className = 'nx-to-top';
    topBtn.setAttribute('aria-label', tr ? 'Sayfa başına dön' : 'Back to top');
    topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(topBtn);
    topBtn.addEventListener('click', function(){
      var target = document.getElementById('top');
      if(target && typeof nxSmoothScrollTo === 'function') nxSmoothScrollTo(target);
      else window.scrollTo(0, 0);
    });

    // 3) Kaydırma durumu: başlık gölgesi + yukarı çık düğmesinin görünürlüğü.
    //    Yalnızca iki sınıf togglesi: rAF'siz de ucuz; sekme arka plandayken bile doğru kalır.
    function nxOnScroll(){
      var y = window.pageYOffset || 0;
      document.documentElement.classList.toggle('nx-scrolled', y > 10);
      topBtn.classList.toggle('show', y > 640);
    }
    window.addEventListener('scroll', nxOnScroll, { passive: true });
    nxOnScroll();

    // 4) Platform-farkında indirme vurgusu: ziyaretçinin işletim sistemi kartı işaretlenir.
    var dls = document.querySelectorAll('.dl-card[data-platform]');
    if(dls.length){
      var plat = '';
      try{
        var ua = navigator.userAgent || '';
        if(/Android/i.test(ua)) plat = 'android';
        else if(/Win/i.test(ua)) plat = 'windows';
        else if(/Mac/i.test(ua) && !/iPhone|iPad/i.test(ua)) plat = 'mac';
        else if(/Linux/i.test(ua)) plat = 'linux';
      }catch(e){}
      if(plat === 'windows' || plat === 'linux' || plat === 'android'){
        Array.prototype.forEach.call(dls, function(card){
          if(card.getAttribute('data-platform') !== plat) return;
          card.classList.add('dl-you');
          var badge = document.createElement('span');
          badge.className = 'dl-you-badge';
          badge.textContent = tr ? 'Sizin için' : 'For you';
          card.appendChild(badge);
        });
      }
    }

    // 5) Telefon maketi fare takibi (vanilla-tilt örüntüsü): yalnızca hassas imleçte,
    //    harekete duyarlılık kapalıysa hiç. Yumuşak takip: hedefe lerp'lenir, bırakınca
    //    kendiliğinden sıfıra iner ve transform temizlenir.
    var canTilt = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce;
    var caseEl = document.getElementById('phoneMockup');
    if(canTilt && caseEl){
      var tx = 0, ty = 0, cx = 0, cy = 0, tiltRaf = null, hovering = false;
      var nxTiltFrame = function(){
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        caseEl.style.transform = 'rotateX(' + cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
        if(hovering || Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05){
          tiltRaf = requestAnimationFrame(nxTiltFrame);
        } else {
          tiltRaf = null;
          caseEl.style.transform = '';
        }
      };
      var stage = caseEl.closest('.phone-wrapper') || caseEl.parentElement;
      stage.addEventListener('mousemove', function(e){
        var r = caseEl.getBoundingClientRect();
        if(!r.width || !r.height) return;
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = Math.max(-1, Math.min(1, px)) * 9;
        ty = Math.max(-1, Math.min(1, py)) * -9;
        if(!tiltRaf){ hovering = true; tiltRaf = requestAnimationFrame(nxTiltFrame); }
      });
      stage.addEventListener('mouseleave', function(){
        tx = 0; ty = 0; hovering = false;
        if(!tiltRaf) tiltRaf = requestAnimationFrame(nxTiltFrame);
      });
    }
  })();

  nxInitSmoothNav();
});