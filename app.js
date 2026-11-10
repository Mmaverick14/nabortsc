/* ════ NASTAVENÍ ════ */
var CFG={
  SUPABASE_URL:'https://cufbeahjechwpyvldztr.supabase.co',
  SUPABASE_ANON_KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZmJlYWhqZWNod3B5dmxkenRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjYwNjAsImV4cCI6MjEwNzI0MjA2MH0.CdFElIVzjhz6SRF__vypI8v9m3jghjtciWx62YkYCn4',
  TABLE:'nabor',
  WEBHOOK_URL:'https://discord.com/api/webhooks/1569438434987352066/2w0-eaYk3Y3YjQfzYm5V8SukewyDdWan3R351mdz4IiFumu0XoT_bOTvamxZQbc0zIx1',  
  ADMIN_URL:'',    
  PING_ROLE_ID:'1311700245649948784',                              
  COOLDOWN_HOURS:0
};
/* ═══════════════════ */
var $=function(id){return document.getElementById(id)};
var step=0,STEPS=[['fName','fAge','fPhone','fOrigin','fDiscord'],['fPast','fWhy'],['fSkills']];
var DC={hook:'',role:''},LAYOUT={order:[],hidden:[],custom:{}},BUILT=['uvod','kodex','cesta','prihlaska'],ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
/* texty webu: výchozí jsou v HTML, úpravy vedení se načtou z databáze (klíče txt_<id>) */
document.querySelectorAll('[data-t]').forEach(function(el){el.dataset.d=el.textContent});
var TXT_READY=fetch(CFG.SUPABASE_URL+'/rest/v1/'+CFG.TABLE+'?select=key,value&key=like.txt_*',{headers:{apikey:CFG.SUPABASE_ANON_KEY,Authorization:'Bearer '+CFG.SUPABASE_ANON_KEY}})
  .then(function(r){return r.ok?r.json():[]}).then(function(rows){
    rows.forEach(function(x){
      if(x.key==='txt_discord'){try{var d=JSON.parse(x.value);DC={hook:d.hook||'',role:d.role||''};if(DC.hook)CFG.WEBHOOK_URL=DC.hook;CFG.PING_ROLE_ID=DC.role}catch(e){}return}
      if(x.key==='txt_layout'){try{var l=JSON.parse(x.value);LAYOUT={order:l.order||[],hidden:l.hidden||[],custom:l.custom||{}}}catch(e){}return}
      var el=document.querySelector('[data-t="'+x.key.slice(4)+'"]');if(el&&typeof x.value==='string'&&x.value.trim())el.textContent=x.value});
    applyLayout(LAYOUT);
  }).catch(function(){});
/* ?upravit = režim úprav textů pro vedení */
if(/[?&]upravit/.test(location.search)){
  var s1=document.createElement('script');
  s1.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  s1.onload=function(){var s2=document.createElement('script');s2.src='edit.js';document.body.appendChild(s2)};
  document.body.appendChild(s1);
}
function say(id,t,c){var e=$(id);e.textContent=t||'';e.className='msg'+(c?' '+c:'')}
function val(id){return $(id).value.trim()}
function cut(s,n){s=(s||'').trim();return s?(s.length>n?s.slice(0,n-1)+'…':s):'—'}

/* menu: zvýraznění kapitoly */
var links=document.querySelectorAll('.rail nav a');
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)document.querySelectorAll('.rail nav a').forEach(function(a){a.classList.toggle('on',a.dataset.s===e.target.id)})})},{rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('.ch').forEach(function(s){io.observe(s)});

/* rozvržení: pořadí, skrytí a vlastní sekce (uloženo jako řádek txt_layout) */
function layoutIds(L){
  var ids=(L.order||[]).filter(function(i){return BUILT.indexOf(i)>-1||L.custom[i]});
  BUILT.concat(Object.keys(L.custom)).forEach(function(i){if(ids.indexOf(i)<0)ids.push(i)});
  return ids;
}
function applyLayout(L){
  var main=document.querySelector('main'),foot=main.querySelector('footer'),nav=document.querySelector('.rail nav'),n=0;
  document.querySelectorAll('.custom').forEach(function(x){x.remove()});
  layoutIds(L).forEach(function(id){
    var s=document.getElementById(id),a=nav.querySelector('[data-s="'+id+'"]'),c=L.custom[id];
    if(c){
      s=document.createElement('section');s.id=id;s.className='ch custom';
      var h=document.createElement('h2');h.textContent=c.t||'';s.appendChild(h);
      String(c.b||'').split(/\n\s*\n/).forEach(function(t){if(t.trim()){var p=document.createElement('p');p.style.whiteSpace='pre-line';p.textContent=t.trim();s.appendChild(p)}});
      a=document.createElement('a');a.href='#'+id;a.dataset.s=id;a.className='custom';a.innerHTML='<i></i><span></span>';a.lastChild.textContent=c.t||'';
    }
    if(!s||!a)return;
    var hid=(L.hidden||[]).indexOf(id)>-1&&id!=='prihlaska';
    s.classList.toggle('hide',hid);a.classList.toggle('hide',hid);
    main.insertBefore(s,foot);nav.appendChild(a);
    if(!hid)a.querySelector('i').textContent=ROM[n++]||n;
    io.observe(s);
  });
}

/* čistá adresa: odkazy na kapitoly jen posunou stránku, #hash se v adrese neukazuje */
document.addEventListener('click',function(e){
  var a=e.target.closest('a[href^="#"]');if(!a)return;
  var t=document.getElementById(a.getAttribute('href').slice(1));if(!t)return;
  e.preventDefault();t.scrollIntoView();
  if(location.hash)history.replaceState(null,'',location.pathname+location.search);
});
if(location.hash&&!/admin/.test(location.pathname))history.replaceState(null,'',location.pathname+location.search);

/* kroky */
function showStep(n){
  step=n;
  document.querySelectorAll('.step').forEach(function(s){s.classList.toggle('on',+s.dataset.i===n)});
  document.querySelectorAll('#prog li').forEach(function(li,i){li.classList.toggle('on',i===n);li.classList.toggle('done',i<n)});
  $('btnBack').style.visibility=n===0?'hidden':'visible';
  $('btnNext').classList.toggle('hide',n===2);
  $('btnSend').classList.toggle('hide',n!==2);
  say('formMsg','');
}
function valid(n){
  var first=null;
  STEPS[n].forEach(function(id){
    var el=$(id),bad=!el.value.trim();
    if(id==='fAge'){var a=parseInt(el.value,10);bad=!(a>=18&&a<=90)}
    el.classList.toggle('bad',bad);if(bad&&!first)first=el;
  });
  if(first){first.focus();say('formMsg',first.id==='fAge'&&first.value?'Věk postavy musí být mezi 18 a 90.':'Vyplňte všechna povinná pole.','err')}
  return !first;
}
$('btnNext').addEventListener('click',function(){if(valid(step))showStep(step+1)});
$('btnBack').addEventListener('click',function(){showStep(step-1)});
document.querySelectorAll('.f input,.f textarea').forEach(function(el){el.addEventListener('input',function(){el.classList.remove('bad')})});
showStep(0);

/* odeslání: uložení do Supabase (bez přihlášení) + upozornění na Discord */
$('appForm').addEventListener('submit',async function(ev){
  ev.preventDefault();
  if($('hp').value)return;
  for(var i=0;i<3;i++){if(!valid(i)){showStep(i);return}}
  var last=0;try{last=parseInt(localStorage.getItem('nabor_last')||'0',10)}catch(e){}
  if(Date.now()-last<CFG.COOLDOWN_HOURS*3600*1000){say('formMsg','Přihláška už byla z tohoto zařízení odeslána. Počkejte na odpověď.','err');return}

  var id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  var d={name:val('fName'),age:parseInt(val('fAge'),10),phone:val('fPhone'),origin:val('fOrigin'),discord:val('fDiscord'),
    past:val('fPast'),why:val('fWhy'),skills:val('fSkills'),ref:val('fRef'),prev:val('fPrev'),at:new Date().toISOString()};
  var btn=$('btnSend');btn.disabled=true;say('formMsg','Odesílám…');
  var okDb=false;
  try{
    var r=await fetch(CFG.SUPABASE_URL+'/rest/v1/'+CFG.TABLE,{method:'POST',
      headers:{'Content-Type':'application/json',apikey:CFG.SUPABASE_ANON_KEY,Authorization:'Bearer '+CFG.SUPABASE_ANON_KEY,Prefer:'return=minimal'},
      body:JSON.stringify({key:'app_'+id,value:JSON.stringify(d),updated_at:d.at})});
    okDb=r.ok;if(!r.ok)console.warn('Supabase',r.status,await r.text());
  }catch(e){console.warn('Supabase',e)}

  if(okDb&&CFG.WEBHOOK_URL.indexOf('https://')===0){
    var F=function(n,v,i){return v?{name:n,value:cut(v,1000),inline:!!i}:null};
    var emb={
      title:'Nová přihláška: '+cut(d.name,60),
      description:'**'+cut(d.name,60)+'**, '+d.age+' let, '+cut(d.origin,80),
      color:0xC49A14,
      fields:[
        F('💬 Discord',d.discord,true),F('📞 Telefon',d.phone,true),F('🤝 Doporučil',d.ref,true),
        F('Minulost',d.past),F('Proč právě my',d.why),F('Co umí a nabídne',d.skills),F('Dřívější skupina',d.prev)
      ].filter(Boolean),
      footer:{text:'Přihláška '+id},
      timestamp:d.at
    };
    emb.url=(CFG.ADMIN_URL||new URL('admin.html',location.href).href)+'#'+id;
    var role=/^\d{15,25}$/.test(CFG.PING_ROLE_ID)?CFG.PING_ROLE_ID:'';
    try{await fetch(CFG.WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      username:'Nábor',
      content:role?'<@&'+role+'> přišla nová přihláška':'',
      allowed_mentions:role?{roles:[role]}:{parse:[]},
      embeds:[emb]})})}catch(e){}
  }
  if(okDb){
    try{localStorage.setItem('nabor_last',String(Date.now()))}catch(e){}
    this.reset();showStep(0);say('formMsg','');
    $('appForm').classList.add('hide');$('doneView').classList.remove('hide');
  }else say('formMsg','Odeslání se nepodařilo. Zkuste to za chvíli znovu.','err');
  btn.disabled=false;
});
