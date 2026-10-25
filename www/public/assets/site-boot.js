if(location.hostname==='enard52.github.io'){location.replace('https://nexus-smarthome.pages.dev'+location.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'')+location.search+location.hash)}
(function(){try{var L=location,p=L.pathname,tr=/^\/tr(\/|$)/.test(p);
var q=new URLSearchParams(L.search).get('lang'),s=null;try{s=localStorage.getItem('nx-lang')}catch(e){}
if(q==='tr'||q==='en'){s=q;try{localStorage.setItem('nx-lang',q)}catch(e){}}
function d(){var a=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).filter(Boolean);
for(var i=0;i<a.length;i++){if(/^tr/i.test(String(a[i]).split(/[-_]/)[0]))return'tr'}
var z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
return /Istanbul|Famagusta|Baku|Almaty|Qyzylorda|Aqtobe|Aqtau|Atyrau|Oral|Qostanay|Tashkent|Samarkand|Bishkek|Ashgabat/.test(z)?'tr':'en'}
if(!s&&tr)return;var w=s||d();var f=p.replace(/^\/tr(\/|$)/,'/').replace(/^\/+/,'');if(f==='index.html')f='';
var t=(w==='tr'?'/tr/':'/')+f;if(t!==p&&!(t+'index.html'===p))L.replace(t+L.hash)}catch(e){}})();
