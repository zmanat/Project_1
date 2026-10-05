'use strict';
const scenes = {
  dawn: {src:'assets/dawn-river-v1.webp', time:'07:10 · РАССВЕТ', caption:'Туман над рекой. Впереди — целый день.', alt:'Рассвет над тихой рекой, садовая калитка и дом среди осенних деревьев'},
  evening: {src:'assets/house-concept-v1.webp', time:'18:20 · ЗАКАТ', caption:'Когда солнце задерживается в листве.', alt:'Дом в осеннем саду в тёплом свете заката'},
  night: {src:'assets/night-garden-v1.webp', time:'21:30 · НОЧЬ', caption:'Огоньки в саду знают дорогу домой.', alt:'Ночной сад с подсвеченной дорожкой, тёплыми окнами дома и звёздами'}
};
const tabs = [...document.querySelectorAll('[data-scene]')];
function chooseScene(tab) {
  const data=scenes[tab.dataset.scene];
  tabs.forEach(t=>{t.setAttribute('aria-selected', String(t===tab));t.tabIndex=t===tab?0:-1;});
  const img=document.getElementById('garden-image');
  img.src=data.src;img.alt=data.alt;
  document.getElementById('garden-time').textContent=data.time;
  document.getElementById('garden-caption').textContent=data.caption;
  document.getElementById('garden-panel').setAttribute('aria-labelledby',tab.id);
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>chooseScene(tab));
  tab.addEventListener('keydown',e=>{
    let next;
    if(e.key==='ArrowRight') next=(index+1)%tabs.length;
    if(e.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
    if(e.key==='Home') next=0;
    if(e.key==='End') next=tabs.length-1;
    if(next!==undefined){e.preventDefault();tabs[next].focus();chooseScene(tabs[next]);}
  });
});
const room=document.getElementById('room');
const timeToggle=document.getElementById('time-toggle');
const clockHotspot=document.getElementById('clock-hotspot');
const status=document.getElementById('scene-status');
const dialog=document.getElementById('phone-dialog');
let ringTimeout;
let audioContext;
let soundOn=false;
let natureTimer;
let dayBus;
let nightBus;
function tone(frequency,duration,volume=.04){
  if(!soundOn||!audioContext)return;
  const osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type='sine';osc.frequency.value=frequency;
  gain.gain.setValueAtTime(volume,audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);
  osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);
}
function ringPhone(){
  clearTimeout(ringTimeout);room.classList.remove('ringing');
  void room.offsetWidth;room.classList.add('ringing');
  tone(740,.5);setTimeout(()=>tone(980,.4),160);
  ringTimeout=setTimeout(()=>room.classList.remove('ringing'),2000);
}
function openPhone(){
  ringPhone();if(!dialog.open)dialog.showModal();
}
function toggleTime(){
  const night=room.classList.toggle('is-night');room.classList.add('clock-running');
  timeToggle.setAttribute('aria-pressed',String(night));clockHotspot.setAttribute('aria-pressed',String(night));
  timeToggle.textContent=night?'Вернуть день':'Зажечь вечер';
  clockHotspot.setAttribute('aria-label',night?'Часы: сменить ночь на день':'Часы: зажечь вечерний сад и свет в комнате');
  document.getElementById('scene-label').textContent=night?'Вечер при свечах':'Солнечный день';
  status.textContent=night?'В саду загорелись фонари и гирлянды, в комнате — свечи и лампы.':'За окном снова день. Маятник качается.';
  updateAmbience();
}
timeToggle.addEventListener('click',toggleTime);clockHotspot.addEventListener('click',toggleTime);
document.getElementById('phone-hotspot').addEventListener('click',openPhone);
document.getElementById('mobile-phone').addEventListener('click',openPhone);
document.querySelectorAll('a[href="#contact"]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  room.scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});
  history.replaceState(null,'','#contact');
  setTimeout(ringPhone,reduced?50:700);
}));
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
// Nature ambience is synthesized locally: no streaming or external requests.
function setupNature(){
  dayBus=audioContext.createGain();nightBus=audioContext.createGain();
  dayBus.gain.value=0;nightBus.gain.value=0;
  dayBus.connect(audioContext.destination);nightBus.connect(audioContext.destination);
}
function updateAmbience(){
  if(!audioContext||!dayBus)return;
  const now=audioContext.currentTime;
  const night=room.classList.contains('is-night');
  [dayBus,nightBus].forEach(bus=>bus.gain.cancelScheduledValues(now));
  dayBus.gain.setTargetAtTime(soundOn&&!night?.22:0,now,.55);
  nightBus.gain.setTargetAtTime(soundOn&&night?.15:0,now,.55);
  const label=!soundOn?'Звуки сада':night?'Сверчки · вкл.':'Птицы · вкл.';
  document.getElementById('sound-toggle').textContent=label;
}
function bird(start,pitch,length){
  const osc=audioContext.createOscillator();const gain=audioContext.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(pitch,start);
  osc.frequency.exponentialRampToValueAtTime(pitch*1.45,start+length*.35);
  osc.frequency.exponentialRampToValueAtTime(pitch*.8,start+length);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.22,start+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,start+length);
  osc.connect(gain);gain.connect(dayBus);osc.start(start);osc.stop(start+length+.01);
}
function crickets(start){
  for(let i=0;i<5;i++){
    const t=start+i*.07;const osc=audioContext.createOscillator();const gain=audioContext.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(4100+Math.random()*160,t);
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.12,t+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,t+.045);
    osc.connect(gain);gain.connect(nightBus);osc.start(t);osc.stop(t+.05);
  }
}
function naturePhrase(){
  if(!soundOn)return;
  if(!document.hidden){
    const t=audioContext.currentTime+.05;
    const pitch=1800+Math.random()*1100;
    for(let i=0;i<3;i++)bird(t+i*.23,pitch*(1+Math.random()*.15),.1+Math.random()*.12);
    if(Math.random()>.45)bird(t+1.1,pitch*.83,.23);
    crickets(t);crickets(t+1.15);crickets(t+2.05);
  }
  natureTimer=setTimeout(naturePhrase,2800+Math.random()*600);
}
document.getElementById('sound-toggle').addEventListener('click',async function(){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){status.textContent='Звук недоступен в этом браузере.';return;}
  if(!audioContext){audioContext=new Audio();setupNature();}
  try{await audioContext.resume();}catch{status.textContent='Браузер не разрешил включить звук.';return;}
  soundOn=!soundOn;this.setAttribute('aria-pressed',String(soundOn));
  clearTimeout(natureTimer);updateAmbience();
  if(soundOn)naturePhrase();
  status.textContent=soundOn?'Звуки сада включены: днём птицы, ночью сверчки.':'Звуки сада выключены.';
});
document.addEventListener('visibilitychange',()=>{
  if(!audioContext||!dayBus)return;
  if(document.hidden){dayBus.gain.setTargetAtTime(0,audioContext.currentTime,.2);nightBus.gain.setTargetAtTime(0,audioContext.currentTime,.2);}
  else updateAmbience();
});

const stoveToggle=document.getElementById('stove-toggle');
const stoveHotspot=document.getElementById('stove-hotspot');
function toggleStove(){
  const open=room.classList.toggle('stove-open');
  [stoveToggle,stoveHotspot].forEach(button=>button.setAttribute('aria-pressed',String(open)));
  const label=open?'Закрыть печь':'Открыть печь';
  stoveToggle.textContent=label;stoveHotspot.querySelector('span').textContent=label;
  stoveHotspot.setAttribute('aria-label',open?'Закрыть дверцу печи':'Открыть дверцу печи и увидеть огонь');
  status.textContent=open?'Дверца печи открыта. Внутри горят дрова.':'Дверца печи закрыта.';
}
stoveToggle.addEventListener('click',toggleStove);
stoveHotspot.addEventListener('click',toggleStove);
