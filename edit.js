/* Režim úprav textů: index.html?upravit (jen pro přihlášené vedení) */
(function(){
var sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY),T=CFG.TABLE;
var l=document.createElement('link');l.rel='stylesheet';l.href='edit.css';document.head.appendChild(l);
var box=document.createElement('aside');box.className='epan';document.body.appendChild(box);
document.body.classList.add('editing');
var els=[].slice.call(document.querySelectorAll('[data-t]')),saved={},started=false,dirty=false,L=clone(LAYOUT),savedL=JSON.stringify(LAYOUT);
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function g(el){
  if(el.closest('#doneView'))return'Po odeslání přihlášky';
  if(el.closest('#appForm'))return'Formulář';
  if(el.closest('aside'))return'Menu';
  if(el.closest('footer'))return'Patička';
  var s=el.closest('section');return s?({uvod:'Úvod',kodex:'Kodex',cesta:'Cesta dovnitř',prihlaska:'Přihláška'}[s.id]||s.id):'Ostatní';
}
function say(t,c){var m=box.querySelector('.emsg');if(m){m.textContent=t||'';m.className='emsg'+(c?' '+c:'')}}
function clone(o){return JSON.parse(JSON.stringify(o))}
function ttl(id){if(L.custom[id])return L.custom[id].t||'(bez názvu)';var s=document.querySelector('.rail nav [data-s="'+id+'"] span');return s?s.textContent:id}
function secHTML(){
  var o=layoutIds(L);
  return'<h4>Sekce stránky</h4>'+o.map(function(id,i){
    var c=L.custom[id],off=L.hidden.indexOf(id)>-1;
    return'<div class="sec'+(off?' off':'')+'" data-id="'+id+'"><b>'+esc(ttl(id))+'</b><span>'+
      '<button type="button" data-m="-1"'+(i?'':' disabled')+'>↑</button><button type="button" data-m="1"'+(i<o.length-1?'':' disabled')+'>↓</button>'+
      (id==='prihlaska'?'':'<button type="button" data-h="1">'+(off?'Zobrazit':'Skrýt')+'</button>')+
      (c?'<button type="button" data-x="1">Smazat</button>':'')+'</span></div>'+
      (c?'<input class="ci" data-ct="'+id+'" value="'+esc(c.t||'')+'" placeholder="Nadpis sekce"><textarea class="cb" data-cb="'+id+'" placeholder="Text sekce. Odstavce oddělte prázdným řádkem.">'+esc(c.b||'')+'</textarea>':'');
  }).join('')+'<button class="eb add" id="eAdd" type="button">+ Přidat sekci</button>';
}
function dcHTML(){
  return'<h4>Discord: odesílání přihlášek</h4><div class="dc">'+
   '<label>Webhook URL<input id="dcHook" value="'+esc(DC.hook)+'" placeholder="https://discord.com/api/webhooks/…" autocomplete="off"></label>'+
   '<label>ID role k označení <small>(nepovinné, nechte prázdné pro bez označení)</small><input id="dcRole" value="'+esc(DC.role)+'" placeholder="např. 123456789012345678" inputmode="numeric" autocomplete="off"></label>'+
   '<div class="eb2"><button class="eb primary" id="dcSave" type="button">Uložit Discord</button><button class="eb" id="dcTest" type="button">Poslat zkušební zprávu</button></div><p class="emsg" id="dcMsg"></p></div>';
}
function dsay(t,c){var m=box.querySelector('#dcMsg');if(m){m.textContent=t||'';m.className='emsg'+(c?' '+c:'')}}
function dcRead(){return{hook:box.querySelector('#dcHook').value.trim(),role:box.querySelector('#dcRole').value.replace(/\D/g,'')}}
function dcBad(d){
  if(d.hook&&!/^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+/.test(d.hook))return'Webhook musí vypadat jako https://discord.com/api/webhooks/…';
  if(d.role&&!/^\d{15,25}$/.test(d.role))return'ID role má mít 15 až 25 číslic.';
  return'';
}
function touch(){dirty=true;window.onbeforeunload=function(){return''};applyLayout(L);var e=box.querySelector('#eSec');if(e)e.innerHTML=secHTML()}
function size(t){t.style.height='auto';t.style.height=t.scrollHeight+'px'}

function loginUI(){
  started=false;
  box.innerHTML='<div class="eh"><h3>Úprava textů</h3><p>Přihlaste se jako člen vedení.</p>'+
   '<input id="eMail" type="email" placeholder="E-mail" autocomplete="email"><input id="ePass" type="password" placeholder="Heslo" autocomplete="current-password">'+
   '<div class="eb2"><button class="eb primary" id="eIn" type="button">Přihlásit se</button><a class="eb" href="'+location.pathname+'">Zpět</a></div><p class="emsg"></p></div>';
  var go=async function(){
    var r=await sb.auth.signInWithPassword({email:box.querySelector('#eMail').value.trim(),password:box.querySelector('#ePass').value});
    if(r.error)say(/not confirmed/i.test(r.error.message)?'E-mail není v Supabase potvrzený.':'Špatný e-mail nebo heslo, nebo účet neexistuje.','err');
  };
  box.querySelector('#eIn').onclick=go;
  box.querySelector('#ePass').onkeydown=function(e){if(e.key==='Enter')go()};
}

function editUI(){
  started=true;dirty=false;
  els.forEach(function(el){saved[el.dataset.t]=el.textContent});
  var groups={},order=[];
  els.forEach(function(el){var n=g(el);if(!groups[n]){groups[n]=[];order.push(n)}groups[n].push(el)});
  box.innerHTML='<div class="eh"><h3>Úprava textů</h3><p>Klikněte na text na stránce nebo ho najděte v seznamu. Změny se hned ukazují, uloží se tlačítkem.</p>'+
    '<div class="eb2"><button class="eb primary" id="eSave" type="button">Uložit změny</button><button class="eb" id="eDisc" type="button">Zahodit</button></div>'+
    '<div class="eb2"><button class="eb" id="eReset" type="button">Obnovit původní texty</button><button class="eb" id="eExit" type="button">Konec úprav</button></div><div class="eb2"><a class="eb" href="admin.html">Hodnocení přihlášek</a><button class="eb" id="eFull" type="button">Na celou obrazovku</button></div><p class="emsg"></p></div>'+
    '<div class="elist"><div id="eSec">'+secHTML()+'</div><div id="eDc">'+dcHTML()+'</div>'+order.map(function(n){return'<h4>'+esc(n)+'</h4>'+groups[n].map(function(el){return'<textarea data-k="'+el.dataset.t+'" rows="1">'+esc(el.textContent)+'</textarea>'}).join('')}).join('')+'</div>';
  box.querySelectorAll('textarea').forEach(size);
  box.querySelector('#eSave').onclick=save;
  box.querySelector('#eDisc').onclick=function(){els.forEach(function(el){el.textContent=saved[el.dataset.t]});L=clone(JSON.parse(savedL));applyLayout(L);editUI()};
  box.querySelector('#eExit').onclick=function(){if(!dirty||confirm('Neuložené změny se ztratí. Opravdu skončit?'))go()};
  box.querySelector('#eReset').onclick=async function(){
    if(!confirm('Vrátit všechny texty na původní znění? Všechny dosavadní úpravy se smažou.'))return;
    var r=await sb.from(T).delete().like('key','txt\\_%').neq('key','txt_discord');
    if(r.error)say('Obnovení se nepodařilo: '+r.error.message,'err');else{dirty=false;go()}
  };
}
function go(){window.onbeforeunload=null;location.href=location.pathname}

box.addEventListener('input',function(e){
  var t=e.target;if(!t.dataset||!t.dataset.k)return;
  var el=document.querySelector('[data-t="'+t.dataset.k+'"]');if(el)el.textContent=t.value;
  size(t);dirty=true;window.onbeforeunload=function(){return''};
});
box.addEventListener('focusin',function(e){
  var k=e.target.dataset&&e.target.dataset.k;if(!k)return;
  var el=document.querySelector('[data-t="'+k+'"]');if(!el)return;
  document.querySelectorAll('.hl').forEach(function(x){x.classList.remove('hl')});
  el.classList.add('hl');if(el.offsetParent)el.scrollIntoView({block:'center',behavior:'smooth'});
});
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-t]');
  if(!t||box.contains(e.target)||!started)return;
  e.preventDefault();e.stopPropagation();
  var ta=box.querySelector('[data-k="'+t.dataset.t+'"]');if(ta){ta.focus();ta.scrollIntoView({block:'center'})}
},true);

box.addEventListener('input',function(e){
  var d=e.target.dataset||{},id=d.ct||d.cb;
  if(id&&L.custom[id]){L.custom[id][d.ct?'t':'b']=e.target.value;dirty=true;window.onbeforeunload=function(){return''};applyLayout(L)}
});
box.addEventListener('click',function(e){
  var b=e.target.closest('[data-m],[data-h],[data-x],#eAdd');if(!b)return;
  var r=b.closest('[data-id]'),id=r&&r.dataset.id,o=layoutIds(L);
  if(b.id==='eAdd'){var n='c'+Date.now().toString(36);L.custom[n]={t:'Nová sekce',b:''};o.push(n);L.order=o}
  else if(b.dataset.m){var i=o.indexOf(id),j=i+(+b.dataset.m);if(j<0||j>=o.length)return;o.splice(j,0,o.splice(i,1)[0]);L.order=o}
  else if(b.dataset.h){var h=L.hidden.indexOf(id);if(h>-1)L.hidden.splice(h,1);else L.hidden.push(id)}
  else if(b.dataset.x){if(!confirm('Smazat tuto sekci?'))return;delete L.custom[id];L.order=o.filter(function(x){return x!==id});L.hidden=L.hidden.filter(function(x){return x!==id})}
  touch();
});

box.addEventListener('click',async function(e){
  var id=e.target.id;
  if(id==='eFull'){
    var on=document.body.classList.toggle('efull');e.target.textContent=on?'Zmenšit panel':'Na celou obrazovku';
    box.querySelectorAll('.elist textarea:not(.cb)').forEach(size);return;
  }
  if(id!=='dcSave'&&id!=='dcTest')return;
  var d=dcRead(),bad=dcBad(d);if(bad){dsay(bad,'err');return}
  if(id==='dcSave'){
    dsay('Ukládám…');
    var r=(d.hook||d.role)?await sb.from(T).upsert({key:'txt_discord',value:JSON.stringify(d),updated_at:new Date().toISOString()},{onConflict:'key'}):await sb.from(T).delete().eq('key','txt_discord');
    if(r.error){dsay('Uložení se nepodařilo: '+r.error.message,'err');return}
    DC=d;dsay('Uloženo. Nové přihlášky půjdou do tohoto kanálu.','ok');
  }else{
    if(!d.hook){dsay('Nejdřív vyplňte webhook URL.','err');return}
    dsay('Odesílám…');
    try{
      var x=await fetch(d.hook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'Nábor',
        content:d.role?'<@&'+d.role+'> zkušební zpráva':'Zkušební zpráva',allowed_mentions:d.role?{roles:[d.role]}:{parse:[]},
        embeds:[{title:'Test odesílání přihlášek',description:'Pokud tohle vidíte, nastavení funguje.',color:0xC49A14}]})});
      if(x.ok)dsay('Zpráva odeslána. Nezapomeňte nastavení uložit.','ok');else dsay('Discord odmítl zprávu (kód '+x.status+'). Zkontrolujte webhook.','err');
    }catch(er){dsay('Zprávu se nepodařilo odeslat.','err')}
  }
});

async function save(){
  var up=[],del=[],now=new Date().toISOString();
  els.forEach(function(el){
    var k=el.dataset.t,cur=el.textContent.trim();
    if(!cur||cur===el.dataset.d){if(saved[k]!==el.dataset.d)del.push('txt_'+k);if(!cur)el.textContent=el.dataset.d}
    else if(cur!==saved[k])up.push({key:'txt_'+k,value:cur,updated_at:now});
  });
  var lc=JSON.stringify(L)!==savedL;
  if(!up.length&&!del.length&&!lc){say('Není co ukládat.');return}
  if(lc)up.push({key:'txt_layout',value:JSON.stringify(L),updated_at:now});
  say('Ukládám…');
  var r1=up.length?await sb.from(T).upsert(up,{onConflict:'key'}):{};
  var r2=del.length?await sb.from(T).delete().in('key',del):{};
  var err=(r1.error||r2.error);
  if(err){say('Uložení se nepodařilo: '+err.message,'err');return}
  els.forEach(function(el){saved[el.dataset.t]=el.textContent});dirty=false;savedL=JSON.stringify(L);window.onbeforeunload=null;
  say('Uloženo. Změny jsou na webu vidět hned.','ok');
}

TXT_READY.then(function(){
  sb.auth.onAuthStateChange(function(_e,s){
    if(s&&!started)editUI();
    else if(!s)loginUI();
  });
});
})();
