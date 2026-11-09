var CFG={
  SUPABASE_URL:'https://cufbeahjechwpyvldztr.supabase.co',
  SUPABASE_ANON_KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZmJlYWhqZWNod3B5dmxkenRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjYwNjAsImV4cCI6MjEwNzI0MjA2MH0.CdFElIVzjhz6SRF__vypI8v9m3jghjtciWx62YkYCn4',
  TABLE:'nabor'
};
var sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY),T=CFG.TABLE;
var $=function(id){return document.getElementById(id)};
var me=null,apps={},revs={},sts={},sel=null,flt='wait';
var FILTERS=[['wait','Čekají'],['accepted','Přijatí'],['rejected','Zamítnutí'],['all','Všechny']];
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pj(v){try{return typeof v==='string'?JSON.parse(v):v}catch(e){return null}}
function say(id,t,c){var e=$(id);e.textContent=t||'';e.className='msg'+(c?' '+c:'')}
function stOf(id){return sts[id]?sts[id].status:'wait'}
function tally(id){var t={pro:0,proti:0,zdrz:0};Object.values(revs[id]||{}).forEach(function(r){if(t[r.vote]!=null)t[r.vote]++});return t}
function myRev(id){return(revs[id]||{})[me.id.slice(0,8)]||{}}
function myName(){var m=me.user_metadata||{};return m.name||m.full_name||(me.email||'').split('@')[0]}
function fdate(s){try{return new Date(s).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}

/* přihlášení */
$('btnLogin').addEventListener('click',async function(){
  var e=$('aMail').value.trim(),p=$('aPass').value;
  if(!e||!p){say('loginMsg','Zadejte e-mail a heslo.','err');return}
  this.disabled=true;
  var r=await sb.auth.signInWithPassword({email:e,password:p});
  if(r.error){
    var m=r.error.message||'';
    if(/not confirmed/i.test(m))m='E-mail není v Supabase potvrzený. V Authentication → Users účet potvrďte, nebo ho vytvořte se zapnutým Auto Confirm User.';
    else if(/invalid login/i.test(m))m='Špatný e-mail nebo heslo, nebo takový účet v Supabase neexistuje. Účty vedení se zakládají v Authentication → Users → Add user.';
    else if(/fetch|network/i.test(m))m='Nepodařilo se spojit se Supabase. Zkontrolujte připojení.';
    say('loginMsg',m,'err');
  }else say('loginMsg','');
  this.disabled=false;
});
$('aMail').addEventListener('keydown',function(e){if(e.key==='Enter')$('btnLogin').click()});
$('aPass').addEventListener('keydown',function(e){if(e.key==='Enter')$('btnLogin').click()});
$('btnOut').addEventListener('click',function(){sb.auth.signOut()});
$('btnRefresh').addEventListener('click',load);
function setMe(u){
  me=u||null;
  $('login').classList.toggle('hide',!!me);$('board').classList.toggle('hide',!me);$('me').classList.toggle('hide',!me);
  if(me){$('meName').textContent=myName();load()}
}
sb.auth.getSession().then(function(r){setMe(r.data&&r.data.session?r.data.session.user:null)});
sb.auth.onAuthStateChange(function(ev,s){if(ev==='SIGNED_IN'&&me&&s&&s.user.id===me.id)return;setMe(s?s.user:null)});

/* načtení: app_<id>, rev_<id>_<uid8>, st_<id> */
async function load(){
  say('boardMsg','Načítám…');
  var r=await sb.from(T).select('key,value').limit(3000);
  if(r.error){say('boardMsg','Načtení se nepodařilo: '+r.error.message,'err');return}
  say('boardMsg','');apps={};revs={};sts={};
  r.data.forEach(function(row){
    var v=pj(row.value);if(!v)return;var p=row.key.split('_');
    if(p[0]==='app')apps[p[1]]=v;
    else if(p[0]==='rev'){(revs[p[1]]=revs[p[1]]||{})[p[2]]=v}
    else if(p[0]==='st')sts[p[1]]=v;
  });
  var h=location.hash.slice(1);
  if(!sel&&apps[h]){sel=h;flt='all'}
  render();
}
async function save(key,obj){
  var r=await sb.from(T).upsert({key:key,value:JSON.stringify(obj),updated_at:new Date().toISOString()},{onConflict:'key'});
  if(r.error){say('boardMsg','Uložení se nepodařilo: '+r.error.message,'err');return false}
  say('boardMsg','');return true;
}

/* vykreslení */
function render(){
  var ids=Object.keys(apps).sort(function(a,b){return apps[b].at<apps[a].at?-1:1});
  $('filters').innerHTML=FILTERS.map(function(f){
    var n=ids.filter(function(i){return f[0]==='all'||stOf(i)===f[0]}).length;
    return'<button type="button" data-f="'+f[0]+'" class="'+(flt===f[0]?'on':'')+'">'+f[1]+' ('+n+')</button>';
  }).join('');
  var shown=ids.filter(function(i){return flt==='all'||stOf(i)===flt});
  $('list').innerHTML=shown.length?shown.map(function(i){
    var a=apps[i],t=tally(i);
    return'<li data-id="'+i+'" class="'+stOf(i)+(sel===i?' on':'')+'"><b>'+esc(a.name)+'</b><small><span>'+esc(a.age)+' let</span><span>'+fdate(a.at)+'</span><span class="pro">+'+t.pro+'</span><span class="con">−'+t.proti+'</span><span class="abs">○'+t.zdrz+'</span></small></li>';
  }).join(''):'<li class="empty" style="cursor:default;border:0;background:none">Nic tu není.</li>';
  detail();
}
function detail(){
  var el=$('detail'),a=apps[sel];
  if(!a){el.innerHTML='<p class="empty">Vyberte přihlášku vlevo.</p>';return}
  var mine=myRev(sel),t=tally(sel),st=stOf(sel);
  var others=Object.keys(revs[sel]||{}).map(function(k){return revs[sel][k]}).filter(function(r){return r.vote||r.note});
  var V=[['pro','Pro'],['proti','Proti'],['zdrz','Zdržuji se']];
  el.innerHTML=
   '<h2>'+esc(a.name)+(st==='accepted'?'<span class="badge accepted">Přijat</span>':st==='rejected'?'<span class="badge rejected">Zamítnut</span>':'')+'</h2>'+
   '<div class="meta">'+esc(a.age)+' let · '+esc(a.origin)+' · podáno '+fdate(a.at)+'</div>'+
   '<h4>Discord</h4><div class="dcrow"><code>'+esc(a.discord)+'</code><button class="mini" data-act="copy" type="button">Kopírovat</button></div>'+
   '<h4>Telefon</h4><p class="ans">'+esc(a.phone)+'</p>'+
   '<h4>Minulost</h4><p class="ans">'+esc(a.past)+'</p>'+
   '<h4>Proč právě my</h4><p class="ans">'+esc(a.why)+'</p>'+
   '<h4>Dovednosti a nabídka</h4><p class="ans">'+esc(a.skills)+'</p>'+
   (a.ref?'<h4>Doporučil</h4><p class="ans">'+esc(a.ref)+'</p>':'')+
   (a.prev?'<h4>Dřívější skupina</h4><p class="ans">'+esc(a.prev)+'</p>':'')+
   '<div class="sep"></div><h4>Váš hlas</h4>'+
   '<div class="votes">'+V.map(function(v){return'<button type="button" data-act="vote" data-v="'+v[0]+'" class="'+(mine.vote===v[0]?'on':'')+'">'+v[1]+'</button>'}).join('')+'</div>'+
   '<p class="tally"><span class="pro">Pro '+t.pro+'</span> · <span class="con">Proti '+t.proti+'</span> · Zdrželo se '+t.zdrz+'</p>'+
   '<h4>Vaše poznámka</h4><textarea id="myNote" maxlength="1500">'+esc(mine.note||'')+'</textarea>'+
   '<div class="acts"><button class="btn" type="button" data-act="note"><span>Uložit poznámku</span></button></div>'+
   (others.length?'<div class="sep"></div><h4>Hlasy a poznámky vedení</h4>'+others.map(function(r){
     var l={pro:'Pro',proti:'Proti',zdrz:'Zdržel se'}[r.vote]||'bez hlasu';
     return'<div class="rv"><b>'+esc(r.name)+'</b> · '+l+(r.note?'<p>'+esc(r.note)+'</p>':'')+'</div>'}).join(''):'')+
   '<div class="sep"></div><h4>Rozhodnutí</h4><div class="acts">'+
   (st!=='accepted'?'<button class="mini" data-act="st" data-s="accepted" type="button">Přijmout</button>':'')+
   (st!=='rejected'?'<button class="mini" data-act="st" data-s="rejected" type="button">Zamítnout</button>':'')+
   (st!=='wait'?'<button class="mini" data-act="st" data-s="wait" type="button">Vrátit mezi čekající</button>':'')+
   '<button class="mini" data-act="del" type="button">Smazat přihlášku</button></div>';
}

/* akce */
async function saveRev(patch){
  var note=$('myNote')?$('myNote').value.trim():'';
  var r=Object.assign({},myRev(sel),{note:note,name:myName(),at:new Date().toISOString()},patch);
  if(await save('rev_'+sel+'_'+me.id.slice(0,8),r)){(revs[sel]=revs[sel]||{})[me.id.slice(0,8)]=r;render()}
}
document.addEventListener('click',async function(e){
  var f=e.target.closest('[data-f]');if(f){flt=f.dataset.f;render();return}
  var li=e.target.closest('#list li[data-id]');if(li){sel=li.dataset.id;render();return}
  var b=e.target.closest('[data-act]');if(!b||!sel)return;
  var act=b.dataset.act;
  if(act==='copy'){try{await navigator.clipboard.writeText(apps[sel].discord);b.textContent='Zkopírováno'}catch(x){}}
  else if(act==='vote')saveRev({vote:myRev(sel).vote===b.dataset.v?'':b.dataset.v});
  else if(act==='note')saveRev({});
  else if(act==='st'){
    var s=b.dataset.s,ok;
    if(s==='wait'){var d=await sb.from(T).delete().eq('key','st_'+sel);ok=!d.error;if(ok)delete sts[sel]}
    else{var o={status:s,by:myName(),at:new Date().toISOString()};ok=await save('st_'+sel,o);if(ok)sts[sel]=o}
    if(ok)render();
  }else if(act==='del'){
    if(!confirm('Opravdu smazat přihlášku „'+apps[sel].name+'“ včetně hlasů a poznámek?'))return;
    var q=await sb.from(T).delete().or('key.eq.app_'+sel+',key.eq.st_'+sel+',key.like.rev\\_'+sel+'\\_%');
    if(q.error){say('boardMsg','Smazání se nepodařilo: '+q.error.message,'err');return}
    delete apps[sel];delete revs[sel];delete sts[sel];sel=null;render();
  }
});
