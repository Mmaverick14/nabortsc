/* ════ NASTAVENÍ ════ */
var CFG={
  SUPABASE_URL:'https://cufbeahjechwpyvldztr.supabase.co',
  SUPABASE_ANON_KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZmJlYWhqZWNod3B5dmxkenRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjYwNjAsImV4cCI6MjEwNzI0MjA2MH0.CdFElIVzjhz6SRF__vypI8v9m3jghjtciWx62YkYCn4',
  TABLE:'nabor',
  WEBHOOK_URL:'VLOZ_SEM_DISCORD_WEBHOOK_URL',  /* ✎ Discord → kanál → Integrace → Webhooky */
  ADMIN_URL:'',                                 /* ✎ nepovinné: celá adresa admin.html, nadpis zprávy pak otevře přímo přihlášku */
  PING_ROLE_ID:'',                              /* ✎ nepovinné: ID role vedení, která se při nové přihlášce označí */
  COOLDOWN_HOURS:12
};
/* ═══════════════════ */
var $=function(id){return document.getElementById(id)};
var step=0,STEPS=[['fName','fAge','fPhone','fOrigin','fDiscord'],['fPast','fWhy'],['fSkills']];
function say(id,t,c){var e=$(id);e.textContent=t||'';e.className='msg'+(c?' '+c:'')}
function val(id){return $(id).value.trim()}
function cut(s,n){s=(s||'').trim();return s?(s.length>n?s.slice(0,n-1)+'…':s):'—'}

/* menu: zvýraznění kapitoly */
var links=document.querySelectorAll('.rail nav a');
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)links.forEach(function(a){a.classList.toggle('on',a.dataset.s===e.target.id)})})},{rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('.ch').forEach(function(s){io.observe(s)});

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
    if(CFG.ADMIN_URL)emb.url=CFG.ADMIN_URL+'#'+id;
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
