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
  document.documentElement.classList.add('nx-modal-open');
  if(nxScrollLocked) return;
  nxScrollLocked=true;
  nxScrollY=window.scrollY||document.documentElement.scrollTop||0;
  var b=document.body;
  b.style.position='fixed';
  b.style.top='-'+nxScrollY+'px';
  b.style.left='0';
  b.style.right='0';
  b.style.width='100%';
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
  b.style.left='';
  b.style.right='';
  b.style.width='';
  window.scrollTo(0,nxScrollY);
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
  var isTr=document.documentElement.lang==='tr';

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
  fetch(SUPABASE_URL+'/auth/v1/recover',{
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
      fetch(SUPABASE_URL+'/auth/v1/recover',{
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
    ? SUPABASE_URL+'/auth/v1/signup'
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
      if(data.access_token){
        localStorage.setItem('nexus_cloud_session',JSON.stringify({
          accessToken:data.access_token,
          refreshToken:data.refresh_token,
          userId:data.user?data.user.id:null,
          email:userEmail
        }));
      }
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
      if(cta.dataset.yearlyLabel && isYearly)cta.textContent=cta.dataset.yearlyLabel;
      if(cta.dataset.monthlyLabel && !isYearly)cta.textContent=cta.dataset.monthlyLabel;
    }
  }else{
    if(priceVal)priceVal.textContent=bundle.price.monthly;
    if(periodVal)periodVal.textContent=isTr?'/ay':'/mo';
    if(priceNote)priceNote.textContent=isTr?'Aylık faturalandırma':'Billed monthly';
    if(cta){
      cta.dataset.plan=cta.dataset.monthlyPlan;
      if(cta.dataset.monthlyLabel)cta.textContent=cta.dataset.monthlyLabel;
    }
  }
}

function nxOpenCheckout(e){
  if(e && e.preventDefault) e.preventDefault();
  var cta=document.getElementById('nexusPlusCta');
  var box=document.getElementById('nxCheckoutMount');
  var modal=document.getElementById('nxCheckoutModal');
  if(!cta||!box||!modal) return false;
  var yearly=document.getElementById('billingYearly');
  var plan=(yearly && yearly.classList.contains('active') && cta.dataset.yearlyPlan) ? cta.dataset.yearlyPlan : (cta.dataset.plan || cta.dataset.monthlyPlan);
  if(!plan) return false;
  box.innerHTML='';
  var el=document.createElement('div');
  el.id='whop-embedded-checkout';
  el.setAttribute('data-whop-checkout-plan-id', plan);
  el.setAttribute('data-whop-checkout-return-url', location.href.split('#')[0]);
  box.appendChild(el);
  var old=document.getElementById('nxWhopLoader');
  if(old) old.remove();
  var s=document.createElement('script');
  s.id='nxWhopLoader';
  s.src='https://js.whop.com/static/checkout/loader.js';
  s.async=true;
  document.body.appendChild(s);
  modal.style.display='flex';
  setTimeout(function(){ modal.classList.add('open'); }, 10);
  nxLockScroll();
  return false;
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
  nxResetShotTimer();
}

function nxPrevShot(){
  nxShowShot(nxCurrentShot-1);
  nxResetShotTimer();
}

function nxResetShotTimer(){
  if(nxShotTimer){ clearInterval(nxShotTimer); nxShotTimer=null; }
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
    mockup.addEventListener('mouseenter',function(){if(nxPreviewOn)return;if(nxShotTimer)clearInterval(nxShotTimer);});
    mockup.addEventListener('mouseleave',function(){if(nxPreviewOn)return;nxResetShotTimer();});

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
      if(nxShotTimer)clearInterval(nxShotTimer);
    },{passive:true});
    mockup.addEventListener('touchend',function(e){
      if(nxPreviewOn)return;
      touchEndX=e.changedTouches[0].screenX;
      var diff=touchEndX-touchStartX;
      if(diff>40) nxPrevShot();
      else if(diff<-40) nxNextShot();
      nxResetShotTimer();
    },{passive:true});
  }

  // OAuth / Google Giriş Dönüşü Kontrolü
  if(window.location.hash && window.location.hash.indexOf('access_token=')!==-1){
    try{
      var hashParams=new URLSearchParams(window.location.hash.substring(1));
      var token=hashParams.get('access_token');
      if(token){
        var payload=nxDecodeJwt(token);
        var userEmail=payload.email||'kullanici@nexus';
        localStorage.setItem('nexusCurrentUser',userEmail);
        if(payload.user_metadata){
          if(payload.user_metadata.avatar_url || payload.user_metadata.picture){
            localStorage.setItem('nexusUserAvatar', payload.user_metadata.avatar_url || payload.user_metadata.picture);
          }
          if(payload.user_metadata.full_name || payload.user_metadata.name){
            localStorage.setItem('nexusUserName', nxFixMojibake(payload.user_metadata.full_name || payload.user_metadata.name));
          }
        }
        localStorage.setItem('nexus_cloud_session',JSON.stringify({
          accessToken:token,
          refreshToken:hashParams.get('refresh_token'),
          userId:payload.sub,
          email:userEmail
        }));
        history.replaceState(null,null,window.location.pathname+window.location.search);
      }
    }catch(e){}
  }

  // Giriş Durumu Güncelleme
  nxUpdateNavAuth();

  // İndirme: GitHub sürümü kaynak sürümüne yetişmişse oradan, değilse geçici kayıttan.
  // Etiket yine açılınca (Actions) latest bağlantıları kendiliğinden kullanılır.
  var NX_VER="1.0.19";
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
    document.querySelectorAll('[data-nexus-ver]').forEach(function(el){el.textContent='v'+v;});
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

  nxInitSmoothNav();
});