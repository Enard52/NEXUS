const fs = require('fs');
let content = fs.readFileSync('stitch-smart.html', 'utf8');

const r1 = `  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Oturma Odası" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=256&q=80"/>`;

const repl1 = `  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform" onclick="window.location.href='stitch-lighting-master.html'">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Oturma Odası" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=256&q=80"/>`;

const r2 = `  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Güvenlik Modu" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=256&q=80"/>`;

const repl2 = `  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform" onclick="window.location.href='stitch-smart-app-detail.html'">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Güvenlik Modu" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=256&q=80"/>`;

const r3 = `  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Sinema Modu" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=256&q=80"/>`;

const repl3 = `  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer active:scale-[0.98] transition-transform" onclick="window.location.href='stitch-movie-mode.html'">
    <div class="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
      <img alt="Sinema Modu" class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=256&q=80"/>`;

content = content.replace(r1, repl1);
content = content.replace(r2, repl2);
content = content.replace(r3, repl3);

fs.writeFileSync('stitch-smart.html', content, 'utf8');
console.log('Replaced successfully.');
