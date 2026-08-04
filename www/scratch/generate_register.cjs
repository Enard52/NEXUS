const fs = require('fs');

let loginHtml = fs.readFileSync('stitch-login.html', 'utf8');

let registerHtml = loginHtml
  .replace('<title>Nexus AI: Giriş</title>', '<title>Nexus AI: Kayıt Ol</title>')
  .replace('Hesabınıza Giriş Yapın', 'NEXUS Ailesine Katılın')
  .replace('Akıllı evinize tekrar hoş geldiniz.', 'Geleceğin evine ilk adımınızı atın.');

const newFormFields = `
  <!-- Ad Soyad Input -->
  <div class="mb-4 relative group">
    <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
      <i class="w-5 h-5 text-slate-400 group-focus-within:text-[#4C7DFF] transition-colors" data-lucide="user"></i>
    </div>
    <input class="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/60 border border-white/80 focus:border-[#4C7DFF] focus:ring-2 focus:ring-[#4C7DFF]/20 text-slate-700 font-medium placeholder-slate-400 transition-all outline-none card-shadow" id="register-name" placeholder="Adınız Soyadınız" type="text"/>
  </div>

  <!-- Email Input -->
  <div class="mb-4 relative group">
    <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
      <i class="w-5 h-5 text-slate-400 group-focus-within:text-[#4C7DFF] transition-colors" data-lucide="mail"></i>
    </div>
    <input class="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/60 border border-white/80 focus:border-[#4C7DFF] focus:ring-2 focus:ring-[#4C7DFF]/20 text-slate-700 font-medium placeholder-slate-400 transition-all outline-none card-shadow" id="register-email" placeholder="E-posta Adresi" type="email"/>
  </div>

  <!-- Password Input -->
  <div class="mb-4 relative group">
    <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
      <i class="w-5 h-5 text-slate-400 group-focus-within:text-[#4C7DFF] transition-colors" data-lucide="lock"></i>
    </div>
    <input class="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/60 border border-white/80 focus:border-[#4C7DFF] focus:ring-2 focus:ring-[#4C7DFF]/20 text-slate-700 font-medium placeholder-slate-400 transition-all outline-none card-shadow" id="register-password" placeholder="Şifre Belirleyin" type="password"/>
  </div>

  <!-- Confirm Password Input -->
  <div class="mb-6 relative group">
    <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
      <i class="w-5 h-5 text-slate-400 group-focus-within:text-[#4C7DFF] transition-colors" data-lucide="check-circle"></i>
    </div>
    <input class="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/60 border border-white/80 focus:border-[#4C7DFF] focus:ring-2 focus:ring-[#4C7DFF]/20 text-slate-700 font-medium placeholder-slate-400 transition-all outline-none card-shadow" id="register-confirm-password" placeholder="Şifreyi Tekrar Girin" type="password"/>
  </div>
`;

registerHtml = registerHtml.replace(/<div class="mb-4 relative group">[\s\S]*?<\/div>[\s\S]*?<div class="mb-6 relative group">[\s\S]*?<\/div>/, newFormFields);

registerHtml = registerHtml.replace('Giriş Yap', 'Kayıt Ol');
registerHtml = registerHtml.replace('doLogin()', 'doRegister()');

registerHtml = registerHtml.replace('Hesabınız yok mu?', 'Zaten hesabınız var mı?').replace('>Kayıt Ol<', '>Giriş Yap<').replace('href="#"', 'href="stitch-login.html"');

const scriptRegex = /function doLogin\(\) \{[\s\S]*?\}/;
const newScript = `
  function doRegister() {
    var name = (document.getElementById('register-name').value || '').trim();
    var email = (document.getElementById('register-email').value || '').trim();
    var pw = (document.getElementById('register-password').value || '').trim();
    var pwConfirm = (document.getElementById('register-confirm-password').value || '').trim();
    var errorBox = document.getElementById('error-message');

    if (!name || !email || !pw || !pwConfirm) {
      errorBox.textContent = 'Lütfen tüm alanları doldurun.';
      errorBox.classList.remove('hidden');
      return;
    }
    
    if (pw !== pwConfirm) {
      errorBox.textContent = 'Şifreler eşleşmiyor.';
      errorBox.classList.remove('hidden');
      return;
    }

    if (pw.length < 4) {
      errorBox.textContent = 'Şifre en az 4 karakter olmalıdır.';
      errorBox.classList.remove('hidden');
      return;
    }

    var existingPw = localStorage.getItem('nexus_mock_pw_' + email);
    if (existingPw) {
      errorBox.textContent = 'Bu e-posta ile zaten bir hesap var. Lütfen giriş yapın.';
      errorBox.classList.remove('hidden');
      return;
    }

    localStorage.setItem('nexus_mock_pw_' + email, pw);
    window.nexusSetItem = window.nexusSetItem || function(){};
    localStorage.setItem('nexusCurrentUser', email);
    localStorage.setItem(email + '_userName', name);
    
    window.location.replace('stitch-home.html');
  }
`;

registerHtml = registerHtml.replace(scriptRegex, newScript);
fs.writeFileSync('stitch-register.html', registerHtml);

let authHtml = fs.readFileSync('auth.js', 'utf8');
if (!authHtml.includes('stitch-register.html')) {
  authHtml = authHtml.replace("['stitch-login.html', 'stitch-onboarding.html', 'stitch-forgot-password.html']", "['stitch-login.html', 'stitch-onboarding.html', 'stitch-forgot-password.html', 'stitch-register.html']");
  fs.writeFileSync('auth.js', authHtml);
}

loginHtml = loginHtml.replace('<a class="text-[#4C7DFF] font-bold hover:underline" href="#">Kayıt Ol</a>', '<a class="text-[#4C7DFF] font-bold hover:underline" href="stitch-register.html">Kayıt Ol</a>');
fs.writeFileSync('stitch-login.html', loginHtml);

console.log('SUCCESS');
