/* Režim úprav textů: index.html?upravit (jen pro přihlášené vedení) */
(function(){
var sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY),T=CFG.TABLE;
var l=document.createElement('link');l.rel='stylesheet';l.href='edit.css';document.head.appendChild(l);
var box=document.createElement('aside');box.className='epan';document.body.appendChild(box);
document.body.classList.add('editing');
var els=[].slice.call(document.querySelectorAll('[data-t]')),saved={},started=false,dirty=false;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function g(el){
  if(el.closest('#doneView'))return'Po odeslání přihlášky';
  if(el.closest('#appForm'))return'Formulář';
  if(el.closest('aside'))return'Menu';
  if(el.closest('footer'))return'Patička';
  var s=el.closest('section');return s?({uvod:'Úvod',kodex:'Kodex',cesta:'Cesta dovnitř',prihlaska:'Přihláška'}[s.id]||s.id):'Ostatní';
}
function say(t,c){var m=box.querySelector('.emsg');if(m){m.textContent=t||'';m.className='emsg'+(c?' '+c:'')}}
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
    '<div class="eb2"><button class="eb" id="eReset" type="button">Obnovit původní texty</button><button class="eb" id="eExit" type="button">Konec úprav</button></div><p class="emsg"></p></div>'+
    '<div class="elist">'+order.map(function(n){return'<h4>'+esc(n)+'</h4>'+groups[n].map(function(el){return'<textarea data-k="'+el.dataset.t+'" rows="1">'+esc(el.textContent)+'</textarea>'}).join('')}).join('')+'</div>';
  box.querySelectorAll('textarea').forEach(size);
  box.querySelector('#eSave').onclick=save;
  box.querySelector('#eDisc').onclick=function(){els.forEach(function(el){el.textContent=saved[el.dataset.t]});editUI()};
  box.querySelector('#eExit').onclick=function(){if(!dirty||confirm('Neuložené změny se ztratí. Opravdu skončit?'))go()};
  box.querySelector('#eReset').onclick=async function(){
    if(!confirm('Vrátit všechny texty na původní znění? Všechny dosavadní úpravy se smažou.'))return;
    var r=await sb.from(T).delete().like('key','txt\\_%');
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

async function save(){
  var up=[],del=[],now=new Date().toISOString();
  els.forEach(function(el){
    var k=el.dataset.t,cur=el.textContent.trim();
    if(!cur||cur===el.dataset.d){if(saved[k]!==el.dataset.d)del.push('txt_'+k);if(!cur)el.textContent=el.dataset.d}
    else if(cur!==saved[k])up.push({key:'txt_'+k,value:cur,updated_at:now});
  });
  if(!up.length&&!del.length){say('Není co ukládat.');return}
  say('Ukládám…');
  var r1=up.length?await sb.from(T).upsert(up,{onConflict:'key'}):{};
  var r2=del.length?await sb.from(T).delete().in('key',del):{};
  var err=(r1.error||r2.error);
  if(err){say('Uložení se nepodařilo: '+err.message,'err');return}
  els.forEach(function(el){saved[el.dataset.t]=el.textContent});dirty=false;window.onbeforeunload=null;
  say('Uloženo. Změny jsou na webu vidět hned.','ok');
}

TXT_READY.then(function(){
  sb.auth.onAuthStateChange(function(_e,s){
    if(s&&!started)editUI();
    else if(!s)loginUI();
  });
});
})();
