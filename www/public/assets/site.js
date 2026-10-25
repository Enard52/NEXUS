// Tema: sistem tercihi + kullanıcı seçimi
(function(){
  var d='light';
  var t=null;
  try{t=localStorage.getItem('nx-site-theme')}catch(e){}
  if(t==='dark'||t==='light') d=t;
  else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches) d='dark';
  document.documentElement.setAttribute('data-theme',d);
})();

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

// Modal Açıldığında Sayfanın Sağa/Sola Kaymasını Önleyen Kilit
function nxLockScroll(){
  document.documentElement.classList.add('nx-modal-open');
}

function nxUnlockScroll(){
  var anyOpen = document.querySelectorAll('.nx-modal-backdrop.open').length > 0;
  if(!anyOpen){
    document.documentElement.classList.remove('nx-modal-open');
  }
}

// İletişim & Destek Modülü Kontrolleri
function nxOpenContactModal(category){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  if(category){
    var sel=document.getElementById('nxContactCategory');
    if(sel)sel.value=category;
  }
  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  nxLockScroll();
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
    try{customName=localStorage.getItem('nexusUserName');}catch(e){}
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
    if(profileView)profileView.style.display='block';
    var customName=null;
    try{customName=localStorage.getItem('nexusUserName');}catch(e){}
    var displayName = customName || user.split('@')[0];
    
    var avatarWrap=document.getElementById('nxProfileAvatarWrap');
    var nameEl=document.getElementById('nxProfileNameDisplay');
    var emailEl=document.getElementById('nxProfileEmail');
    if(avatarWrap){
      avatarWrap.innerHTML = nxGetAvatarHtml(true) + '<span class="nx-avatar-status-dot"></span>';
    }
    if(nameEl)nameEl.textContent = displayName;
    if(emailEl)emailEl.textContent = user;
    
    var plusActive = false;
    try{plusActive = localStorage.getItem('nexusPlusActive')==='true';}catch(e){}
    var planTag=document.getElementById('nxProfilePlanTag');
    var planDesc=document.getElementById('nxProfilePlanDesc');
    if(planTag)planTag.textContent = plusActive ? 'NEXUS+ Pro' : (isTr ? 'Ücretsiz' : 'Free');
    if(planDesc)planDesc.textContent = plusActive ? (isTr ? 'Aktif NEXUS+ Aboneliği (Sınırsız AI)' : 'Active NEXUS+ Pro (Unlimited AI)') : (isTr ? 'Temel Plan (Cihaz/Oda Sınırı Yok)' : 'Starter Plan (No device limits)');
  }else{
    if(formView)formView.style.display='block';
    if(profileView)profileView.style.display='none';
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
  try{curName=localStorage.getItem('nexusUserName')||'';}catch(e){}
  nxShowPrompt(
    isTr ? 'İsmi Düzenle' : 'Edit Display Name',
    isTr ? 'Hesabınız için görünecek yeni bir isim girin:' : 'Enter your new display name:',
    curName,
    function(newName){
      if(!newName)return;
      try{localStorage.setItem('nexusUserName', newName);}catch(e){}
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
          localStorage.setItem('nexusUserName', data.user.user_metadata.full_name || data.user.user_metadata.name);
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
      if(cta.dataset.yearlyHref)cta.href=cta.dataset.yearlyHref;
      if(cta.dataset.yearlyLabel)cta.textContent=cta.dataset.yearlyLabel;
    }
  }else{
    if(priceVal)priceVal.textContent=bundle.price.monthly;
    if(periodVal)periodVal.textContent=isTr?'/ay':'/mo';
    if(priceNote)priceNote.textContent=isTr?'Aylık faturalandırma':'Billed monthly';
    if(cta){
      if(cta.dataset.monthlyHref)cta.href=cta.dataset.monthlyHref;
      if(cta.dataset.monthlyLabel)cta.textContent=cta.dataset.monthlyLabel;
    }
  }
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
  if(nxShotTimer)clearInterval(nxShotTimer);
  nxShotTimer=setInterval(function(){
    nxShowShot(nxCurrentShot+1);
  },4500);
}

// Telefon dokunma, sürükleme ve tıklama yönetimi
document.addEventListener('DOMContentLoaded',function(){
  var mockup=document.getElementById('phoneMockup');
  if(mockup){
    nxResetShotTimer();

    mockup.addEventListener('mouseenter',function(){if(nxShotTimer)clearInterval(nxShotTimer);});
    mockup.addEventListener('mouseleave',function(){nxResetShotTimer();});

    mockup.addEventListener('click',function(e){
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
      touchStartX=e.changedTouches[0].screenX;
      if(nxShotTimer)clearInterval(nxShotTimer);
    },{passive:true});
    mockup.addEventListener('touchend',function(e){
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
        var payload=JSON.parse(atob(token.split('.')[1]));
        var userEmail=payload.email||'kullanici@nexus';
        localStorage.setItem('nexusCurrentUser',userEmail);
        if(payload.user_metadata){
          if(payload.user_metadata.avatar_url || payload.user_metadata.picture){
            localStorage.setItem('nexusUserAvatar', payload.user_metadata.avatar_url || payload.user_metadata.picture);
          }
          if(payload.user_metadata.full_name || payload.user_metadata.name){
            localStorage.setItem('nexusUserName', payload.user_metadata.full_name || payload.user_metadata.name);
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

  // GitHub Sürüm Etiketi Çekimi (nexus-releases deposu)
  fetch('https://api.github.com/repos/Enard52/nexus-releases/releases/latest')
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){
      if(!d||!d.tag_name)return;
      var tag=String(d.tag_name);
      var v=tag.indexOf('v')===0?tag.slice(1):tag;
      document.querySelectorAll('[data-nexus-ver]').forEach(function(el){
        el.textContent='v'+v;
      });
    })
    .catch(function(){});

  // ESC Tuşu ile Modal Kapatma
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      nxCloseContactModal();
      nxCloseAuthModal();
    }
  });
});