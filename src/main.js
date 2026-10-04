import './style.css';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } });

/* ---------- catalogue ---------- */
var GROUPS=[{id:'cardio',label:'Cardio',hint:'Tick the machine, then type the kcal from its screen.'},{id:'upper',label:'Upper body'},{id:'lower',label:'Lower body'},{id:'core',label:'Core'},{id:'free',label:'Free weights'}];
var GROUP_LABEL={cardio:'Cardio',upper:'Upper',lower:'Lower',core:'Core',free:'Free weights'};
var MACHINES=[
 {id:'treadmill',name:'Treadmill',g:'cardio'},{id:'cross_trainer',name:'Cross trainer',g:'cardio'},
 {id:'upright_bike',name:'Upright bike',g:'cardio'},{id:'recumbent_bike',name:'Recumbent bike',g:'cardio'},
 {id:'rower',name:'Rowing machine',g:'cardio',paused:'Paused for now: deep knee bend'},
 {id:'chest_press',name:'Chest press',g:'upper',m:['Chest']},{id:'pec_deck',name:'Pec deck',g:'upper',m:['Chest']},
 {id:'shoulder_press',name:'Shoulder press',g:'upper',m:['Shoulders']},{id:'lat_pulldown',name:'Lat pulldown',g:'upper',m:['Back']},
 {id:'pullover',name:'Pullover machine',g:'upper',m:['Back']},{id:'bicep_curl',name:'Bicep curl',g:'upper',m:['Arms']},
 {id:'tricep_ext',name:'Tricep extension',g:'upper',m:['Arms']},{id:'dip',name:'Dip machine',g:'upper',m:['Arms','Chest']},
 {id:'leg_press',name:'Leg press',g:'lower',m:['Legs']},{id:'leg_ext',name:'Leg extension',g:'lower',m:['Legs']},
 {id:'smith',name:'Smith machine',g:'lower',m:['Legs'],paused:'Paused for now: loads knee and spine'},
 {id:'hip_abd',name:'Hip abduction',g:'lower',m:['Legs']},{id:'hip_add',name:'Hip adduction',g:'lower',m:['Legs']},
 {id:'calf',name:'Calf raise',g:'lower',m:['Legs']},
 {id:'dead_bug',name:'Dead bug',g:'core',m:['Core']},{id:'bird_dog',name:'Bird dog',g:'core',m:['Core']},
 {id:'plank',name:'Forearm plank',g:'core',m:['Core']},
 {id:'crunch',name:'Crunch machine',g:'core',m:['Core'],paused:'Paused for now: strains lower back'},
 {id:'back_ext',name:'Back extension',g:'core',m:['Core','Back'],paused:'Paused for now: stresses lower back'},
 {id:'db_lateral',name:'Seated dumbbell lateral raise',g:'free',m:['Shoulders']},
 {id:'free_weights',name:'Other free weights',g:'free',m:[]}];
var CUES={leg_press:'Bend knees only to about 60\u00b0',leg_ext:'Lift only halfway: from bent to half-straight',
 hip_abd:'Slow and controlled, protects the knee',hip_add:'Slow and controlled',calf:'Full range, pause at the top',
 chest_press:'Back flat against the pad',shoulder_press:'Back flat against the pad',
 lat_pulldown:'Pull to upper chest, don\u2019t lean back',pec_deck:'Slight bend in the elbows',
 pullover:'Keep lower back against the pad',dip:'Use the assist, shoulders down',
 bicep_curl:'No swinging',tricep_ext:'Keep elbows still',db_lateral:'Seated with back support, light weight',
 dead_bug:'Lower back pressed to the floor',bird_dog:'Slow, hips level',plank:'20\u201330 s, on knees if needed',
 upright_bike:'Seat high: knee slightly bent at the bottom',recumbent_bike:'Seat far enough that the knee stays slightly bent',
 cross_trainer:'Smooth pace, stand tall',treadmill:'Walk only, 3\u20136% incline'};
var RX=[{label:'Sets',value:'3'},{label:'Reps',value:'12\u201315'},{label:'Rest',value:'60 s'},{label:'Cardio',value:'40 min'}];
var LEGS=['leg_press','hip_abd','hip_add','leg_ext','calf','dead_bug','bird_dog','plank'];
var WU='10 min easy bike warm-up. Weights first, then ';
var PLAN={
 1:{title:'Upper body A',rx:RX,note:WU+'40 min on either bike.',items:['chest_press','lat_pulldown','shoulder_press','pec_deck','bicep_curl','tricep_ext','recumbent_bike','upright_bike']},
 2:{title:'Legs (knee-safe) + core',rx:RX,note:WU+'40 min cross trainer.',items:LEGS.concat(['cross_trainer'])},
 3:{rest:true,title:'Rest day',note:'Muscle rebuilds on rest days. A relaxed walk is fine. If you do go in, keep it to cardio only.'},
 4:{title:'Upper body B',rx:RX,note:WU+'40 min recumbent bike.',items:['lat_pulldown','pullover','chest_press','dip','db_lateral','bicep_curl','tricep_ext','recumbent_bike']},
 5:{title:'Legs (knee-safe) + core',rx:RX,note:WU+'40 min incline walk or cross trainer.',items:LEGS.concat(['treadmill','cross_trainer'])},
 6:{title:'Cardio intervals + core',rx:[{label:'Total',value:'1 hr'},{label:'Bike',value:'45 min'},{label:'Core',value:'10 min'}],note:'45 min bike intervals, then 10 min core on the mat.',items:['recumbent_bike','upright_bike','dead_bug','bird_dog','plank'],cues:{recumbent_bike:'2 min easy, 1 min harder \u00d7 10\u201312 rounds',upright_bike:'2 min easy, 1 min harder \u00d7 10\u201312 rounds'}},
 0:{rest:true,title:'Holiday',note:'Sunday off. Enjoy it.'}};
var DAYNAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var MUSCLES=['Chest','Back','Shoulders','Arms','Legs','Core','Cardio'];
var BY_ID={};MACHINES.forEach(function(m){BY_ID[m.id]=m;});
var DOW=['M','T','W','T','F','S','S'];

/* ---------- meals ---------- */
var GOAL=85,GOAL_HI=90;
var MEALS=[{id:'b',label:'Breakfast',target:25},{id:'l',label:'Lunch',target:25},{id:'s',label:'Snack',target:10},{id:'d',label:'Dinner',target:25}];
var FOODS=[
 {id:'soya',name:'Soya chunks',serve:'30 g dry',g:15,cue:'Keep to 50 g dry a day',grp:'p'},
 {id:'paneer',name:'Paneer',serve:'50 g',g:9,cue:'Two servings = your 100 g a day',grp:'p'},
 {id:'egg',name:'Whole egg',serve:'1 large',g:6,grp:'p'},
 {id:'egg_white',name:'Egg white',serve:'1 large',g:3.5,grp:'p'},
 {id:'hung_curd',name:'Hung curd',serve:'100 g',g:8,grp:'p'},
 {id:'chana',name:'Roasted chana',serve:'30 g, a handful',g:6,grp:'p'},
 {id:'dal',name:'Dal',serve:'1 katori, cooked',g:7,grp:'p'},
 {id:'rajma',name:'Rajma or chole',serve:'1 katori, cooked',g:8,grp:'p'},
 {id:'besan_chilla',name:'Besan chilla',serve:'1, from 30 g besan',g:6.5,grp:'p'},
 {id:'peanuts',name:'Peanuts',serve:'30 g',g:7.5,grp:'p'},
 {id:'milk',name:'Milk',serve:'1 glass, 200 ml',g:6.5,grp:'e'},
 {id:'curd',name:'Curd (dahi)',serve:'1 katori, 150 g',g:5,grp:'e'},
 {id:'roti',name:'Roti',serve:'1 medium',g:3,grp:'e'},
 {id:'rice',name:'Rice',serve:'1 katori, cooked',g:4,grp:'e'}];
var FOOD_BY={};FOODS.forEach(function(f){FOOD_BY[f.id]=f;});

var CACHE_KEY='fithit-cache-v2';
var state={entries:{}},drafts={},saving=false;
var auth={user:null,ready:false,loaded:false,email:'',sent:false,error:'',busy:false};
var ui={tab:'log',selected:null,othersOpen:null,meal:defaultMeal()};

function pad(n){return String(n).padStart(2,'0');}
function keyOf(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function parseKey(k){var p=k.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);}
function addDays(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;}
function mondayOf(d){return addDays(d,-((d.getDay()+6)%7));}
function daysBetween(a,b){return Math.round((parseKey(b)-parseKey(a))/86400000);}
function has(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function clone(o){return JSON.parse(JSON.stringify(o));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function today(){return keyOf(new Date());}
function defaultMeal(){var h=new Date().getHours();return h<11?'b':h<16?'l':h<19?'s':'d';}
function blank(){return {gym:false,cardio:{},machines:[],meals:{},extra:{}};}
function ensure(e){e=e||blank();e.cardio=e.cardio||{};e.machines=e.machines||[];e.meals=e.meals||{};e.extra=e.extra||{};
 MEALS.forEach(function(m){if(!e.meals[m.id])e.meals[m.id]={};});return e;}
function isGymDay(e){return !!(e&&(e.gym||(e.machines&&e.machines.length)||(e.cardio&&Object.keys(e.cardio).length)));}
function kcalOf(e){var t=0;if(e&&e.cardio)Object.keys(e.cardio).forEach(function(k){t+=Number(e.cardio[k])||0;});return t;}
function countOf(e){return (e.machines||[]).length+Object.keys(e.cardio||{}).length;}
function mealG(e,m){if(!e)return 0;var t=0,src=(e.meals&&e.meals[m])||{};
 Object.keys(src).forEach(function(f){if(FOOD_BY[f])t+=(Number(src[f])||0)*FOOD_BY[f].g;});
 t+=Math.max(0,Number(e.extra&&e.extra[m])||0);return t;}
function proteinOf(e){var t=0;MEALS.forEach(function(m){t+=mealG(e,m.id);});return t;}
function servingsOf(e){var n=0;if(!e||!e.meals)return 0;Object.keys(e.meals).forEach(function(m){var s=e.meals[m];Object.keys(s).forEach(function(f){n+=Number(s[f])||0;});});return n;}
function fmtG(g){return (Math.round(g*2)/2).toLocaleString('en-GB');}
function ago(n){return n===0?'Today':n===1?'Yesterday':n+' days ago';}
function plural(n,w){return n+' '+w+(n===1?'':'s');}

function normalize(d){
 d=ensure(clone(d));
 var out={gym:false,machines:d.machines.slice().sort(),cardio:{}};
 Object.keys(d.cardio).sort().forEach(function(k){var v=d.cardio[k];out.cardio[k]=(v===''||v==null)?null:Math.max(0,Math.min(3000,Math.round(Number(v))||0));});
 out.gym=!!(d.gym||out.machines.length||Object.keys(out.cardio).length);
 var meals={},extra={};
 MEALS.forEach(function(m){var src=d.meals[m.id]||{},o={};
  Object.keys(src).sort().forEach(function(f){var c=Math.max(0,Math.min(20,Math.round(Number(src[f])||0)));if(c&&FOOD_BY[f])o[f]=c;});
  if(Object.keys(o).length)meals[m.id]=o;
  var x=Number(d.extra[m.id]);if(x>0)extra[m.id]=Math.min(300,Math.round(x));});
 if(Object.keys(meals).length)out.meals=meals;
 if(Object.keys(extra).length)out.extra=extra;
 return out;
}
function isEmpty(n){return !n.gym&&!n.meals&&!n.extra;}
function draftFor(k){if(!drafts[k])drafts[k]=ensure(clone(state.entries[k]||blank()));return drafts[k];}
function isDirty(k){if(!drafts[k])return false;return JSON.stringify(normalize(drafts[k]))!==JSON.stringify(normalize(state.entries[k]||blank()));}

function cacheGet(uid){try{var c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');return c&&c.uid===uid?c.entries:null;}catch(e){return null;}}
function cacheSet(){try{if(auth.user)localStorage.setItem(CACHE_KEY,JSON.stringify({uid:auth.user.id,entries:state.entries}));}catch(e){}}

/* ---------- icons ---------- */
function svg(p,s,w,extra){return '<svg width="'+(s||20)+'" height="'+(s||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'+(extra||'')+'>'+p+'</svg>';}
var I={
 left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',down:'<path d="m6 9 6 6 6-6"/>',check:'<path d="M20 6 9 17l-5-5"/>',
 plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',minus:'<path d="M5 12h14"/>',
 flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
 dumbbell:'<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',
 activity:'<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
 calendar:'<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
 utensils:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'};
var CHECK='<span class="cb">'+svg(I.check,18,3)+'</span>';
var BOX='<span class="cb"></span>';

function ringSvg(week,o){var size=o.size,c=size/2,w=o.width,r=c-w/2-2,C=2*Math.PI*r,gap=o.gap,seg=C/7-gap,s='';
 week.forEach(function(wd,i){s+='<circle cx="'+c+'" cy="'+c+'" r="'+r.toFixed(2)+'" fill="none" stroke-width="'+(wd.hit?w:o.missWidth)+'" style="stroke:'+(wd.hit?'var(--volt)':'var(--line)')+';transition:stroke .3s" stroke-dasharray="'+seg.toFixed(2)+' '+(C-seg).toFixed(2)+'" transform="rotate('+(-90+i*360/7+(gap/C*360)/2).toFixed(2)+' '+c+' '+c+')"/>';});
 return '<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'" style="display:block;width:100%;height:100%" aria-hidden="true">'+s+'</svg>';}
function arcSvg(frac,size,w){var c=size/2,r=c-w/2-1,C=2*Math.PI*r;
 return '<svg viewBox="0 0 '+size+' '+size+'" style="display:block;width:100%;height:100%" aria-hidden="true"><circle cx="'+c+'" cy="'+c+'" r="'+r+'" fill="none" stroke-width="'+w+'" style="stroke:var(--line)"/><circle cx="'+c+'" cy="'+c+'" r="'+r+'" fill="none" stroke-width="'+w+'" stroke-linecap="round" style="stroke:var(--volt);transition:stroke-dasharray .4s" stroke-dasharray="'+(Math.max(0.0001,Math.min(1,frac))*C).toFixed(2)+' '+C.toFixed(2)+'" transform="rotate(-90 '+c+' '+c+')"/></svg>';}

/* ---------- derived ---------- */
function derive(){
 var E=state.entries,TODAY=today(),mon=mondayOf(new Date()),monKey=keyOf(mon),mp=TODAY.slice(0,7);
 var week=[];for(var i=0;i<7;i++){var k=keyOf(addDays(mon,i));week.push({key:k,letter:DOW[i],hit:isGymDay(E[k]),today:k===TODAY,fut:k>TODAY});}
 var weekKcal=0,monthCount=0,last=null;
 Object.keys(E).forEach(function(k){var e=E[k];if(!isGymDay(e)||k>TODAY)return;if(k>=monKey)weekKcal+=kcalOf(e);if(k.slice(0,7)===mp)monthCount++;if(!last||k>last)last=k;});
 return {E:E,TODAY:TODAY,mon:mon,week:week,weekHits:week.filter(function(w){return w.hit;}).length,weekKcal:weekKcal,monthCount:monthCount,last:last};
}

/* ---------- views ---------- */
function header(D){
 return '<header class="hdr"><div class="mark"><b>FITHIT</b><i></i></div><div class="pill"><span class="v num">'+D.weekHits+'/7</span><span class="m">this week</span></div></header>'+(auth.loaded?'':'<div class="mode">Syncing your days\u2026</div>');
}
function switcher(D){
 var sel=ui.selected,sd=parseKey(sel),yest=keyOf(addDays(new Date(),-1));
 var kick=sel===D.TODAY?'Today':sel===yest?'Yesterday':ago(daysBetween(sel,D.TODAY));
 return '<div class="sw"><button class="ib" data-act="prev" aria-label="Previous day">'+svg(I.left)+'</button>'+
  '<div class="sw-c"><div class="kick v">'+kick+'</div><div class="sw-t">'+sd.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})+'</div></div>'+
  '<button class="ib" data-act="next" aria-label="Next day"'+(sel>=D.TODAY?' disabled':'')+'>'+svg(I.right)+'</button></div>';
}
function itemRow(m,cue,num,d){
 var isC=m.g==='cardio',on=isC?has(d.cardio,m.id):d.machines.indexOf(m.id)>-1,pausedOnly=!!m.paused&&!cue,text=cue||m.paused||'';
 var h='<div class="row'+(on?' on':'')+(pausedOnly&&!on?' paused':'')+'"><button class="row-b'+(num?'':' sm')+'" data-m="'+m.id+'" aria-pressed="'+on+'">'+
  (num?'<span class="n num">'+num+'</span>':'')+'<span class="grow"><span class="nm"><b>'+esc(m.name)+'</b>'+
  (num?'<span class="tag">'+GROUP_LABEL[m.g]+'</span>':(pausedOnly?'<span class="tag e">Paused</span>':''))+'</span>'+
  (text?'<span class="cue">'+esc(text)+'</span>':'')+'</span>'+(on?CHECK.replace('cb','cb on'):BOX)+'</button>';
 if(isC&&on){var v=d.cardio[m.id];h+='<label class="kc'+(num?'':' np')+'"><span style="color:var(--ember);display:grid">'+svg(I.flame,16)+'</span><span class="grow">Calories from the screen</span>'+
  '<input class="inp num" type="number" inputmode="numeric" min="0" max="3000" placeholder="0" data-kcal="'+m.id+'" value="'+(v==null?'':esc(v))+'" aria-label="Calories from '+esc(m.name)+'"><span class="unit">kcal</span></label>';}
 return h+'</div>';
}
function logView(D){
 var d=draftFor(ui.selected),sd=parseKey(ui.selected),dow=sd.getDay(),p=PLAN[dow],ids=p.items||[];
 var items=ids.map(function(id,i){return {m:BY_ID[id],cue:(p.cues&&p.cues[id])||CUES[id]||'',num:pad(i+1)};});
 var done=items.filter(function(x){return x.m.g==='cardio'?has(d.cardio,x.m.id):d.machines.indexOf(x.m.id)>-1;}).length;
 var extra=d.machines.some(function(id){return ids.indexOf(id)<0;})||Object.keys(d.cardio).some(function(id){return ids.indexOf(id)<0;});
 var open=ui.othersOpen!==null?ui.othersOpen:(!ids.length||extra);
 var gymOn=isGymDay(d);
 var h='<section class="card sess"><div class="kick">'+DAYNAMES[dow]+(p.rest?' \u00b7 Recovery':' \u00b7 Session')+'</div><h1>'+esc(p.title)+'</h1>';
 if(p.rx)h+='<div class="rx">'+p.rx.map(function(r){return '<div><b class="num">'+r.value+'</b><span>'+r.label+'</span></div>';}).join('')+'</div>';
 h+='<p class="note">'+esc(p.note)+'</p>';
 if(ids.length)h+='<div class="prog"><div class="prog-h"><span class="kick">Session progress</span><span class="big num"><span class="v">'+done+'</span>/'+items.length+'</span></div><div class="segs">'+
  items.map(function(x){var on=x.m.g==='cardio'?has(d.cardio,x.m.id):d.machines.indexOf(x.m.id)>-1;return '<span'+(on?' class="on"':'')+'></span>';}).join('')+'</div></div>';
 h+='</section><div class="pad"><button class="gym'+(gymOn?' on':'')+'" data-act="gym" aria-pressed="'+gymOn+'"><span style="color:var(--volt);display:grid">'+svg(I.dumbbell,22)+'</span>'+
  '<span class="grow"><span class="gym-t">Went to the gym</span><span class="sub">'+(gymOn?'Counts toward your week':'Tick even if you only did a few machines')+'</span></span>'+(gymOn?CHECK.replace('cb','cb on'):BOX)+'</button></div>';
 if(ids.length)h+='<section class="sec"><div class="sec-h"><h2>Programme</h2><span class="cap">Tap to tick off</span></div><div class="list">'+items.map(function(x){return itemRow(x.m,x.cue,x.num,d);}).join('')+'</div></section>';
 var groups=GROUPS.map(function(g){return {g:g,items:MACHINES.filter(function(m){return m.g===g.id&&ids.indexOf(m.id)<0;})};}).filter(function(x){return x.items.length;});
 var total=groups.reduce(function(a,x){return a+x.items.length;},0);
 h+='<section class="pad" style="margin-top:32px"><button class="disc" data-act="others" aria-expanded="'+!!open+'"><span class="t">'+(ids.length?'Other exercises':'All exercises')+'</span><span class="cap">'+total+' available</span><span class="chev">'+svg(I.down,18)+'</span></button>';
 if(open)h+=groups.map(function(x){return '<div class="grp"><div class="kick v">'+x.g.label+'</div>'+(x.g.hint?'<div class="cap" style="margin-top:2px">'+x.g.hint+'</div>':'')+
  '<div class="list">'+x.items.map(function(m){return itemRow(m,CUES[m.id]||'','',d);}).join('')+'</div></div>';}).join('');
 return h+'</section>';
}
function mealsSummary(d){
 var g=proteinOf(d),left=GOAL-g;
 return '<div class="kick">Protein today</div><div class="ph-r"><div class="arcw">'+arcSvg(g/GOAL,132,12)+
  '<div class="ringc"><div class="ringn num">'+fmtG(g)+'</div><div class="ringl">of '+GOAL+' g</div></div></div>'+
  '<div class="grow"><div class="ph-s'+(left<=0?' v':'')+'">'+(left<=0?'Goal reached':fmtG(left)+' g to go')+'</div>'+
  '<p class="ph-c">Aim for '+GOAL+'\u2013'+GOAL_HI+' g a day: about 25 g at each main meal.</p></div></div>';
}
function mealTiles(d){
 return MEALS.map(function(m){var g=mealG(d,m.id);
  return '<button data-meal="'+m.id+'" aria-pressed="'+(ui.meal===m.id)+'"><span class="l">'+m.label+'</span><span class="g num">'+fmtG(g)+'<small>/'+m.target+'</small></span><span class="tr"><i style="width:'+Math.min(100,Math.round(g/m.target*100))+'%"></i></span></button>';}).join('');
}
function foodRow(f,d){
 var c=Number(d.meals[ui.meal][f.id])||0;
 return '<div class="row'+(c?' on':'')+'"><div class="fr"><span class="grow"><span class="nm"><b>'+esc(f.name)+'</b></span>'+
  '<span class="cue">'+esc(f.serve)+' \u00b7 '+fmtG(f.g)+' g protein'+(c?' \u00b7 <span style="color:var(--volt)">+'+fmtG(c*f.g)+' g</span>':'')+'</span>'+
  (f.cue?'<span class="cue">'+esc(f.cue)+'</span>':'')+'</span>'+
  '<span class="step"><button data-dec="'+f.id+'" aria-label="Remove a serving of '+esc(f.name)+'"'+(c?'':' disabled')+'>'+svg(I.minus,18,2.5)+'</button>'+
  '<b class="num" aria-label="'+c+' servings">'+c+'</b><button class="plus" data-inc="'+f.id+'" aria-label="Add a serving of '+esc(f.name)+'">'+svg(I.plus,18,2.5)+'</button></span></div></div>';
}
function proteinWeek(D){
 var selMon=mondayOf(parseKey(ui.selected)),out='';
 for(var i=0;i<7;i++){var k=keyOf(addDays(selMon,i)),e=k===ui.selected?draftFor(k):state.entries[k],g=proteinOf(e),fut=k>D.TODAY;
  out+='<div class="pw-c"><div class="pw-g num">'+(g?fmtG(g):'')+'</div><div class="pw-b"'+(fut?' style="opacity:.35"':'')+'><em style="bottom:'+(GOAL/100*100)+'%"></em><i class="'+(g>=GOAL?'v':'')+'" style="height:'+Math.min(100,g/100*100)+'%"></i></div>'+
   '<div class="pw-l'+(k===ui.selected?' t':'')+'">'+DOW[i]+'</div></div>';}
 return out;
}
function mealsView(D){
 var d=draftFor(ui.selected),meal=MEALS.filter(function(m){return m.id===ui.meal;})[0];
 var ex=d.extra[ui.meal];
 var h='<section class="card ph" id="m-sum">'+mealsSummary(d)+'</section><div class="mt" id="m-tiles" role="group" aria-label="Meal">'+mealTiles(d)+'</div>';
 h+='<section class="sec"><div class="sec-h"><h2>'+meal.label+'</h2><span class="cap">Target about '+meal.target+' g</span></div>';
 h+='<div class="kick v">Protein foods</div><div class="list" style="margin-top:12px">'+FOODS.filter(function(f){return f.grp==='p';}).map(function(f){return foodRow(f,d);}).join('')+'</div>';
 h+='<div class="grp"><div class="kick v">Everyday staples</div><div class="cap" style="margin-top:2px">Smaller amounts, but they add up across the day.</div><div class="list">'+FOODS.filter(function(f){return f.grp==='e';}).map(function(f){return foodRow(f,d);}).join('')+'</div></div>';
 h+='<div class="grp"><div class="kick v">Something else</div><div class="list"><div class="row'+(Number(ex)>0?' on':'')+'"><label class="kc np" style="padding-top:16px;min-height:72px">'+
  '<span class="grow" style="color:var(--tx)"><b style="display:block;font-weight:600;font-size:15.5px">Protein from a label</b><span class="cue">For example, a whey scoop or a protein bar</span></span>'+
  '<input class="inp v num" type="number" inputmode="decimal" min="0" max="300" placeholder="0" data-extra="'+ui.meal+'" value="'+(ex==null?'':esc(ex))+'" aria-label="Extra protein grams for '+meal.label+'"><span class="unit">g</span></label></div></div></div></section>';
 h+='<section class="sec"><div class="card cal"><div class="sec-h" style="margin:0"><h2 style="font-size:22px">Protein this week</h2><span class="cap" style="white-space:nowrap">Line: '+GOAL+' g</span></div><div class="pw" id="m-week">'+proteinWeek(D)+'</div>'+
  '<p class="fine">Grams are estimates for home-cooked portions. For anything packaged, type the number from its label under Something else.</p></div></section>';
 return h;
}
function saveBar(){
 var sel=ui.selected,d=draftFor(sel),n=countOf(d),kc=kcalOf(d),g=proteinOf(d),gymOn=isGymDay(d),dirty=isDirty(sel),saved=!!state.entries[sel];
 var parts=[];if(ui.tab==='meals'){if(g)parts.push(fmtG(g)+' g protein');}else{if(n)parts.push(plural(n,'exercise'));else if(gymOn)parts.push('Checked in');if(kc)parts.push(kc+' kcal');}
 var showClear=ui.tab==='meals'?(servingsOf(d)>0||proteinOf(d)>0):(n>0||gymOn);
 return '<div class="grow"><div class="s num">'+(parts.length?parts.join(' \u00b7 '):(ui.tab==='meals'?'No food added yet':'Nothing ticked yet'))+'</div><div class="st'+(dirty?' v':'')+'">'+(saving?'Saving\u2026':dirty?'Unsaved changes':saved?'Saved':'Not logged')+'</div></div>'+
  (showClear?'<button class="clr" data-act="clear" aria-label="'+(ui.tab==='meals'?'Clear meals':'Clear workout')+'">Clear</button>':'')+
  '<button class="save" data-act="save"'+((saving||!dirty)?' disabled':'')+'>Save day</button>';
}
function progressView(D){
 var E=D.E,lastT={};
 Object.keys(E).forEach(function(k){var e=E[k];if(k>D.TODAY||!e)return;
  (e.machines||[]).forEach(function(id){((BY_ID[id]&&BY_ID[id].m)||[]).forEach(function(mu){if(!lastT[mu]||k>lastT[mu])lastT[mu]=k;});});
  if(e.cardio&&Object.keys(e.cardio).length&&(!lastT.Cardio||k>lastT.Cardio))lastT.Cardio=k;});
 var h='<section style="padding:12px 22px 0"><div class="card wk"><div class="kick" style="align-self:flex-start">This week</div><div class="ringw">'+ringSvg(D.week,{size:210,width:18,missWidth:8,gap:6})+
  '<div class="ringc"><div class="ringn num">'+D.weekHits+'</div><div class="ringl">of 7 days</div></div></div><div class="dl">'+
  D.week.map(function(w){return '<span class="'+(w.hit?'h':w.today?'t':'')+'">'+w.letter+'</span>';}).join('')+'</div></div>';
 var stats=[[D.weekKcal.toLocaleString('en-GB'),'Cardio kcal this week'],[D.monthCount,'Sessions this month'],[D.last?ago(daysBetween(D.last,D.TODAY)):'None','Last gym visit']];
 h+='<div class="stats">'+stats.map(function(s){return '<div class="card"><b class="num">'+s[0]+'</b><span>'+s[1]+'</span></div>';}).join('')+'</div></section>';
 h+='<section class="sec"><div class="sec-h"><h2>Last trained</h2><span class="cap">Due after 7 days</span></div><div class="list">'+
  MUSCLES.map(function(mu){var dn=lastT[mu]?daysBetween(lastT[mu],D.TODAY):null,due=dn===null||dn>=7,f=dn===null?0:Math.max(0,1-dn/7);
   return '<div class="card mu"><div class="mu-h"><b>'+mu+'</b><span class="mu-r">'+(dn===null?'Not logged':ago(dn))+(due?'<span class="due">Due</span>':'')+'</span></div><div class="track"><i style="width:'+Math.round(f*100)+'%"></i></div></div>';}).join('')+'</div></section>';
 h+='<section class="sec"><div class="card acct"><span class="cap">Signed in as '+esc(auth.user?auth.user.email:'')+'</span><button class="clr" data-act="signout">Sign out</button></div></section>';
 return h;
}
function calendarView(D){
 var start=addDays(D.mon,-28),E=D.E;
 function fm(dd){return dd.toLocaleDateString('en-GB',{day:'numeric',month:'short'});}
 var cells='';for(var j=0;j<35;j++){var dd=addDays(start,j),k=keyOf(dd),fut=k>D.TODAY,hit=isGymDay(E[k]),pg=proteinOf(E[k])>=GOAL;
  cells+='<button class="cc num'+(hit?' h':'')+(k===D.TODAY?' t':'')+(k===ui.selected?' s':'')+'" data-day="'+k+'"'+(fut?' disabled':'')+' aria-label="'+dd.toLocaleDateString('en-GB',{day:'numeric',month:'long'})+(hit?', gym day':'')+(pg?', protein goal met':'')+'">'+dd.getDate()+(pg?'<i></i>':'')+'</button>';}
 var h='<section style="padding:12px 22px 0"><div class="card cal"><div class="sec-h" style="margin:0"><h2>Last 5 weeks</h2><span class="cap">'+fm(start)+' \u2013 '+fm(addDays(start,34))+'</span></div>'+
  '<div class="cg">'+DOW.map(function(x){return '<div class="w">'+x+'</div>';}).join('')+cells+'</div>'+
  '<div class="leg"><span><span class="sq" style="background:var(--volt)"></span>Gym day</span><span><span class="sq" style="border:1.5px solid var(--tx)"></span>Today</span><span><span class="sq" style="width:7px;height:7px;border-radius:50%;background:var(--ember)"></span>Protein goal met</span><span>Tap a day to edit it</span></div></div></section>';
 var recent=Object.keys(E).filter(function(k){return k<=D.TODAY&&isGymDay(E[k]);}).sort().reverse().slice(0,6);
 h+='<section class="sec"><h2 class="h2" style="margin-bottom:10px">Recent sessions</h2>'+(recent.length?'':'<p class="empty">No sessions logged yet. Tick today\u2019s machines on the Log tab and tap Save day.</p>')+'<div class="list">'+
  recent.map(function(k){var e=E[k],cc=countOf(e),kk=kcalOf(e),dd=parseKey(k),pp=PLAN[dd.getDay()];
   return '<button class="rs" data-day="'+k+'"><span class="rs-d"><b>'+dd.getDate()+'</b><span>'+dd.toLocaleDateString('en-GB',{weekday:'short'})+'</span></span><span class="grow"><b style="display:block;font-weight:600;font-size:15px">'+(pp.rest?'Extra session':esc(pp.title))+'</b><span class="cap">'+(cc?plural(cc,'exercise'):'Checked in')+(kk?' \u00b7 '+kk+' kcal':'')+'</span></span><span style="color:var(--mu);display:grid">'+svg(I.right,18)+'</span></button>';}).join('')+'</div></section>';
 return h;
}
function navHtml(){
 var t=[['log','Log',I.dumbbell],['meals','Meals',I.utensils],['progress','Progress',I.activity],['calendar','Calendar',I.calendar]];
 return t.map(function(x){return '<button data-tab="'+x[0]+'"'+(ui.tab===x[0]?' aria-current="page"':'')+'>'+svg(x[2],22)+x[1]+'</button>';}).join('');
}

function authView(){
 var h='<header class="hdr"><div class="mark"><b>FITHIT</b><i></i></div></header><section class="auth"><div class="kick v">Welcome back</div><h1>Sign in</h1>';
 if(auth.sent){h+='<p class="msg">We sent a sign-in link to <b>'+esc(auth.email)+'</b>. Open it on this device to continue. The link works once.</p>'+
  '<button class="clr" style="margin-top:18px" data-act="resend">Use a different email</button>';}
 else{h+='<p class="msg">Enter your email and we\u2019ll send you a link. No password needed. You stay signed in on this device.</p>'+
  '<form id="signin"><label class="field"><span>Email</span><input class="email" id="email" type="email" autocomplete="email" inputmode="email" required value="'+esc(auth.email)+'"></label>'+
  '<button class="save full" type="submit"'+(auth.busy?' disabled':'')+'>'+(auth.busy?'Sending\u2026':'Send sign-in link')+'</button></form>';}
 if(auth.error)h+='<p class="msg err" role="alert">'+esc(auth.error)+'</p>';
 return h+'</section>';
}
function render(){
 var nav=document.getElementById('nav');
 if(!auth.ready){document.getElementById('root').innerHTML='<div class="loading">Loading FitHit\u2026</div>';nav.hidden=true;return;}
 if(!auth.user){document.getElementById('root').innerHTML=authView();nav.hidden=true;return;}
 nav.hidden=false;
 if(ui.selected>today())ui.selected=today();
 var D=derive(),h=header(D);
 if(ui.tab==='log'||ui.tab==='meals')h+=switcher(D)+(ui.tab==='log'?logView(D):mealsView(D))+'<div class="bar" id="bar">'+saveBar()+'</div>';
 else if(ui.tab==='progress')h+=progressView(D);
 else h+=calendarView(D);
 document.getElementById('root').innerHTML=h;
 document.getElementById('nav').innerHTML=navHtml();
}
function rerender(){
 var a=document.activeElement,sel=null;
 if(a&&a.dataset){['m','inc','dec','meal','act','tab','day','kcal','extra'].some(function(k){if(a.dataset[k]){sel='[data-'+k+'="'+a.dataset[k]+'"]';return true;}});}
 render();
 if(sel){var el=document.querySelector(sel);if(el&&!el.disabled)el.focus({preventScroll:true});}
}
function partial(){
 var d=draftFor(ui.selected),b=document.getElementById('bar');if(b)b.innerHTML=saveBar();
 if(ui.tab==='meals'){var s=document.getElementById('m-sum');if(s)s.innerHTML=mealsSummary(d);
  var t=document.getElementById('m-tiles');if(t)t.innerHTML=mealTiles(d);
  var w=document.getElementById('m-week');if(w)w.innerHTML=proteinWeek(derive());}
}

/* ---------- toast ---------- */
var toastT;
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},2600);}

/* ---------- saving ---------- */
function save(){
 if(saving||!isDirty(ui.selected))return;
 var sel=ui.selected,norm=normalize(draftFor(sel)),empty=isEmpty(norm);
 saving=true;partial();
 var q=empty?sb.from('fithit_days').delete().eq('user_id',auth.user.id).eq('day',sel)
  :sb.from('fithit_days').upsert({user_id:auth.user.id,day:sel,data:norm,updated_at:new Date().toISOString()},{onConflict:'user_id,day'});
 q.then(function(res){
  saving=false;
  if(res.error){partial();toast(res.error.message&&/JWT|auth/i.test(res.error.message)?'You were signed out. Sign in again, then save.':'Couldn\u2019t save. Check your connection and save again.');return;}
  if(empty)delete state.entries[sel];else state.entries[sel]=norm;
  delete drafts[sel];cacheSet();rerender();toast('Day saved');
 },function(){saving=false;partial();toast('Couldn\u2019t save. Check your connection and save again.');});
}
function loadEntries(){
 return sb.from('fithit_days').select('day,data').order('day',{ascending:true}).then(function(res){
  if(res.error){toast('Couldn\u2019t load your days. Showing what\u2019s saved on this device.');return;}
  var out={};(res.data||[]).forEach(function(r){out[r.day]=r.data;});
  state.entries=out;auth.loaded=true;cacheSet();
  var a=document.activeElement;if(!(a&&a.tagName==='INPUT'))rerender();else partial();
 });
}
function setUser(user){
 var wasReady=auth.ready,prev=auth.user?auth.user.id:null,next=user?user.id:null;
 auth.user=user||null;auth.ready=true;
 if(wasReady&&prev===next)return;
 drafts={};state.entries={};auth.loaded=false;
 if(user){var c=cacheGet(user.id);if(c)state.entries=c;render();loadEntries();}
 else render();
}

/* ---------- events ---------- */
function goTo(tab){ui.tab=tab;render();window.scrollTo({top:0});}
document.addEventListener('click',function(ev){
 var t=ev.target.closest('button');if(!t||t.disabled)return;
 var ds=t.dataset,d;
 if(ds.tab){goTo(ds.tab);return;}
 if(ds.day){ui.selected=ds.day;ui.othersOpen=null;goTo('log');return;}
 if(ds.m){d=draftFor(ui.selected);var m=BY_ID[ds.m];
  if(m.g==='cardio'){if(has(d.cardio,m.id))delete d.cardio[m.id];else d.cardio[m.id]=null;}
  else{var i=d.machines.indexOf(m.id);if(i>-1)d.machines.splice(i,1);else d.machines.push(m.id);}
  if(countOf(d))d.gym=true;rerender();
  if(m.g==='cardio'&&has(d.cardio,m.id)){var inp=document.querySelector('[data-kcal="'+m.id+'"]');if(inp)inp.focus({preventScroll:true});}
  return;}
 if(ds.inc||ds.dec){d=draftFor(ui.selected);var id=ds.inc||ds.dec,cur=Number(d.meals[ui.meal][id])||0;
  cur=ds.inc?Math.min(20,cur+1):Math.max(0,cur-1);if(cur)d.meals[ui.meal][id]=cur;else delete d.meals[ui.meal][id];rerender();return;}
 if(ds.meal){ui.meal=ds.meal;rerender();return;}
 switch(ds.act){
  case 'prev':ui.selected=keyOf(addDays(parseKey(ui.selected),-1));ui.othersOpen=null;rerender();break;
  case 'next':if(ui.selected<today()){ui.selected=keyOf(addDays(parseKey(ui.selected),1));ui.othersOpen=null;rerender();}break;
  case 'gym':d=draftFor(ui.selected);if(isGymDay(d)){d.gym=false;d.machines=[];d.cardio={};}else d.gym=true;rerender();break;
  case 'others':var dd=draftFor(ui.selected),p=PLAN[parseKey(ui.selected).getDay()],ids=p.items||[];
   var auto=!ids.length||dd.machines.some(function(x){return ids.indexOf(x)<0;})||Object.keys(dd.cardio).some(function(x){return ids.indexOf(x)<0;});
   ui.othersOpen=!(ui.othersOpen!==null?ui.othersOpen:auto);rerender();break;
  case 'clear':d=draftFor(ui.selected);
   if(ui.tab==='meals'){d.meals={};d.extra={};ensure(d);}else{d.gym=false;d.machines=[];d.cardio={};}rerender();break;
  case 'save':save();break;
  case 'signout':sb.auth.signOut().then(function(){try{localStorage.removeItem(CACHE_KEY);}catch(e){}});break;
  case 'resend':auth.sent=false;auth.error='';render();break;
 }
});
document.addEventListener('input',function(ev){
 var t=ev.target,d;if(!t.dataset)return;
 if(t.dataset.kcal){d=draftFor(ui.selected);d.cardio[t.dataset.kcal]=t.value===''?null:t.value;partial();}
 else if(t.dataset.extra){d=draftFor(ui.selected);if(t.value===''||Number(t.value)<=0)delete d.extra[t.dataset.extra];else d.extra[t.dataset.extra]=t.value;partial();
  var row=t.closest('.row');if(row)row.classList.toggle('on',Number(t.value)>0);}
});
document.addEventListener('submit',function(ev){
 if(ev.target.id!=='signin')return;ev.preventDefault();
 var email=(document.getElementById('email').value||'').trim();if(!email)return;
 auth.email=email;auth.busy=true;auth.error='';render();
 sb.auth.signInWithOtp({email:email,options:{emailRedirectTo:window.location.origin,shouldCreateUser:true}}).then(function(res){
  auth.busy=false;
  if(res.error){auth.error=/rate|seconds/i.test(res.error.message)?'Too many links requested. Wait a minute, then try again.':'Couldn\u2019t send the link: '+res.error.message;}
  else auth.sent=true;
  render();
 });
});
document.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&ev.target.matches&&ev.target.matches('input'))ev.target.blur();});

/* ---------- start ---------- */
ui.selected=today();
render();
sb.auth.onAuthStateChange(function(_evt,session){setUser(session?session.user:null);});
sb.auth.getSession().then(function(r){setUser(r.data&&r.data.session?r.data.session.user:null);
 if(window.location.hash&&/access_token|error/.test(window.location.hash))history.replaceState(null,'',window.location.pathname);
});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&auth.user&&!saving&&!Object.keys(drafts).some(isDirty))loadEntries();});
