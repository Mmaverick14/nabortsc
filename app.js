/* ════ NASTAVENÍ ════ */
var CFG={
  SUPABASE_URL:'https://cufbeahjechwpyvldztr.supabase.co',
  SUPABASE_ANON_KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZmJlYWhqZWNod3B5dmxkenRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjYwNjAsImV4cCI6MjEwNzI0MjA2MH0.CdFElIVzjhz6SRF__vypI8v9m3jghjtciWx62YkYCn4',
  TABLE:'frakce_kv',
  WEBHOOK_URL:'https://discord.com/api/webhooks/1569438434987352066/2w0-eaYk3Y3YjQfzYm5V8SukewyDdWan3R351mdz4IiFumu0XoT_bOTvamxZQbc0zIx1', 
  KEY_PREFIX:'nabor_',                    
  COOLDOWN_HOURS:24
};
/* ═══════════════════ */

var sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY);
var $=function(id){return document.getElementById(id)};
var mode='in',user=null,step=0;
var STEPS=[['fName','fAge','fPhone','fOrigin'],['fPast','fWhy'],['fSkills']];

function view(v){['authView','appForm','doneView'].forEach(function(x){$(x).classList.toggle('hide',x!==v)})}
function say(id,t,c){var e=$(id);e.textContent=t||'';e.className='msg'+(c?' '+c:'')}

/* ── menu: zvýraznění kapitoly ── */
var links=document.querySelectorAll('.rail nav a');
var io=new IntersectionObserver(function(es){
  es.forEach(function(e){if(e.isIntersecting)links.forEach(function(a){a.classList.toggle('on',a.dataset.s===e.target.id)})});
},{rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('.ch').forEach(function(s){io.observe(s)});

/* ── přihlášení ── */
document.querySelectorAll('.tabs button').forEach(function(b){
  b.addEventListener('click',function(){
    mode=b.dataset.t;
    document.querySelectorAll('.tabs button').forEach(function(x){x.classList.toggle('on',x===b)});
    $('btnAuth').firstChild.textContent=mode==='in'?'Přihlásit se':'Vytvořit účet';
    say('authMsg','');
  });
});
$('btnAuth').addEventListener('click',async function(){
  var email=$('aMail').value.trim(),pass=$('aPass').value;
  if(!email||pass.length<6){say('authMsg','Zadejte e-mail a heslo o délce alespoň 6 znaků.','err');return}
  this.disabled=true;
  try{
    if(mode==='in'){
      var r=await sb.auth.signInWithPassword({email:email,password:pass});if(r.error)throw r.error;
    }else{
      var r2=await sb.auth.signUp({email:email,password:pass,options:{emailRedirectTo:location.href.split('#')[0]}});
      if(r2.error)throw r2.error;
      if(!r2.data.session)say('authMsg','Účet vytvořen. Potvrďte e-mail odkazem ve schránce a pak se přihlaste.','ok');
    }
  }catch(e){
    var m=(e&&e.message)||'';
    if(/Invalid login/i.test(m))m='Špatný e-mail nebo heslo.';
    else if(/already registered/i.test(m))m='Tento e-mail už má účet. Přepněte na přihlášení.';
    else if(/not confirmed/i.test(m))m='E-mail zatím není potvrzený. Zkontrolujte schránku.';
    say('authMsg',m||'Přihlášení se nepodařilo.','err');
  }
  this.disabled=false;
});
$('btnDiscord').addEventListener('click',async function(){
  var r=await sb.auth.signInWithOAuth({provider:'discord',options:{redirectTo:location.href.split('#')[0]+'#prihlaska'}});
  if(r.error)say('authMsg','Přihlášení přes Discord není zapnuté. Použijte e-mail.','err');
});
$('btnOut').addEventListener('click',function(){sb.auth.signOut()});

function setUser(u){
  user=u||null;
  var w=$('who');
  if(user){
    var md=user.user_metadata||{};
    $('whoName').textContent=md.full_name||md.name||user.email||'Přihlášen';
    w.classList.add('on');
    if($('doneView').classList.contains('hide'))view('appForm');
  }else{w.classList.remove('on');view('authView')}
}
sb.auth.getSession().then(function(r){setUser(r.data&&r.data.session?r.data.session.user:null)});
sb.auth.onAuthStateChange(function(_e,s){setUser(s?s.user:null)});

/* ── kroky formuláře ── */
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
  var ok=true,first=null;
  STEPS[n].forEach(function(id){
    var el=$(id),bad=!el.value.trim();
    if(id==='fAge'){var a=parseInt(el.value,10);bad=!(a>=18&&a<=90)}
    el.classList.toggle('bad',bad);
    if(bad){ok=false;if(!first)first=el}
  });
  if(!ok){first.focus();say('formMsg',first.id==='fAge'&&first.value?'Věk postavy musí být mezi 18 a 90.':'Vyplňte všechna povinná pole.','err')}
  return ok;
}
$('btnNext').addEventListener('click',function(){if(valid(step))showStep(step+1)});
$('btnBack').addEventListener('click',function(){showStep(step-1)});
document.querySelectorAll('.f input,.f textarea').forEach(function(el){el.addEventListener('input',function(){el.classList.remove('bad')})});
showStep(0);

/* ── odeslání: Discord + uložení do frakce_kv ── */
function cut(s,n){s=(s||'').trim();return s?(s.length>n?s.slice(0,n-1)+'…':s):'—'}
function val(id){return $(id).value.trim()}

$('appForm').addEventListener('submit',async function(ev){
  ev.preventDefault();
  if($('hp').value)return;
  if(!user){say('formMsg','Nejdřív se přihlaste.','err');return}
  for(var i=0;i<3;i++){if(!valid(i)){showStep(i);return}}

  var cdKey='nabor_last_'+user.id,last=0;
  try{last=parseInt(localStorage.getItem(cdKey)||'0',10)}catch(e){}
  if(Date.now()-last<CFG.COOLDOWN_HOURS*3600*1000){say('formMsg','Přihlášku jste už odeslal(a). Počkejte na odpověď vedení.','err');return}

  var md=user.user_metadata||{};
  var dcName=(md.custom_claims&&md.custom_claims.global_name)||md.full_name||md.name||'';
  var dcId=(user.identities||[]).filter(function(x){return x.provider==='discord'}).map(function(x){return x.id})[0]||'';
  var d={
    name:val('fName'),age:parseInt(val('fAge'),10),phone:val('fPhone'),origin:val('fOrigin'),
    past:val('fPast'),why:val('fWhy'),skills:val('fSkills'),ref:val('fRef'),prev:val('fPrev'),
    status:'new',at:new Date().toISOString(),
    account:{id:user.id,email:user.email||'',discord:dcName,discordId:dcId}
  };

  var btn=$('btnSend');btn.disabled=true;say('formMsg','Odesílám…');
  var okDiscord=false,okDb=false;

  if(CFG.WEBHOOK_URL.indexOf('https://')===0){
    var f=function(n,v,i){return{name:n,value:cut(v,1000),inline:!!i}};
    try{
      var r=await fetch(CFG.WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        username:'Nábor',allowed_mentions:{parse:[]},
        embeds:[{title:'Nová přihláška: '+cut(d.name,60),color:0xC49A14,timestamp:d.at,fields:[
          f('Věk',String(d.age),true),f('Telefon',d.phone,true),f('Původ',d.origin,true),
          f('Minulost',d.past),f('Proč právě my',d.why),f('Dovednosti a nabídka',d.skills),
          f('Doporučil',d.ref,true),f('Předchozí skupina',d.prev),
          f('Účet',(dcName?dcName+'\n':'')+(dcId?'<@'+dcId+'>\n':'')+d.account.email+'\nID: '+user.id)
        ]}]
      })});
      okDiscord=r.ok;
    }catch(e){console.warn('Discord:',e)}
  }

  try{
    var key=CFG.KEY_PREFIX+Date.now()+'_'+user.id.slice(0,8);
    var q=await sb.from(CFG.TABLE).insert({key:key,value:JSON.stringify(d),updated_at:d.at});
    okDb=!q.error;if(q.error)console.warn('Supabase:',q.error.message);
  }catch(e){console.warn('Supabase:',e)}

  if(okDiscord||okDb){
    try{localStorage.setItem(cdKey,String(Date.now()))}catch(e){}
    this.reset();showStep(0);say('formMsg','');view('doneView');
  }else{
    say('formMsg','Odeslání se nepodařilo. Zkuste to za chvíli znovu.','err');
  }
  btn.disabled=false;
});
