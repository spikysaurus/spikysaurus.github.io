// --- script1.js ---
// Core setup and track/frame management

let fps=24,playing=false,layers=[],frameUnit=20;
const preview=document.getElementById('preview'),
 fpsInput=document.getElementById('fps'),zoomInput=document.getElementById('zoom'),
 playBtn=document.getElementById('play'),stopBtn=document.getElementById('stop'),
 addBtn=document.getElementById('add'),delBtn=document.getElementById('delete'),
 capBtn=document.getElementById('capture'),toggleCam=document.getElementById('toggleCam'),
 tracksDiv=document.getElementById('tracks'),playhead=document.getElementById('playhead'),
 camera=document.getElementById('camera');

const head=document.createElement('div');head.className='playhead-head';playhead.appendChild(head);
navigator.mediaDevices.getUserMedia({video:true}).then(s=>camera.srcObject=s).catch(console.error);

fpsInput.oninput=()=>fps=parseInt(fpsInput.value)||24;
zoomInput.oninput=()=>{frameUnit=parseInt(zoomInput.value);renderTracks()};
toggleCam.onclick=()=>{camera.classList.toggle('hidden');toggleCam.textContent=camera.classList.contains('hidden')?"👁 Show Camera":"🙈 Hide Camera"};

const buildRuler=n=>{let r=document.createElement('div');r.className='ruler';
 for(let i=0;i<n;i++){let t=document.createElement('div');t.className='tick';t.style.width=frameUnit+'px';t.textContent=i;r.appendChild(t)}return r};

function renderTracks(){
 tracksDiv.querySelectorAll('.track').forEach(t=>t.remove());
 layers.forEach((layer,i)=>{
  const track=document.createElement('div');track.className='track';
  track.innerHTML=`<div class="track-header"><input type="file" multiple><div class="track-label" draggable="true">${layer.name}</div></div>`;
  const strip=document.createElement('div');strip.className='track-strip';track.append(buildRuler(200),strip);
  track.querySelector('.track-label').onclick=()=>track.classList.toggle('selected');

  layer.frames.forEach((f,j)=>{
   const b=document.createElement('div');b.className='frame-block';b.textContent="F"+(j+1);
   b.style.left=(f.start*frameUnit)+'px';b.style.width=(f.length*frameUnit)+'px';
   const hl=document.createElement('div');hl.className='handle left',hr=document.createElement('div');hr.className='handle right';
   b.append(hl,hr);strip.appendChild(b);
   b.onclick=e=>{if(!e.target.classList.contains('handle')) b.classList.toggle('selected')};

   // multi-drag
   b.onmousedown=e=>{
    if(e.target.classList.contains('handle'))return;
    let trackBlocks=[...strip.querySelectorAll('.frame-block')],
        selBlocks=trackBlocks.filter(bl=>bl.classList.contains('selected'));
    if(!selBlocks.length)selBlocks=[b];
    let sx=e.clientX,orig=selBlocks.map(bl=>parseInt(bl.style.left));
    const mv=ev=>{let dx=ev.clientX-sx;
     selBlocks.forEach((bl,k)=>{let nl=Math.max(0,Math.round((orig[k]+dx)/frameUnit)*frameUnit);
      bl.style.left=nl+'px';layer.frames[trackBlocks.indexOf(bl)].start=nl/frameUnit})};
    const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up)};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
   };

   // resize left
   hl.onmousedown=e=>{
    let sx=e.clientX,ol=parseInt(b.style.left),ow=parseInt(b.style.width);
    const mv=ev=>{let nl=Math.round((ol+ev.clientX-sx)/frameUnit)*frameUnit,
     nw=Math.max(frameUnit,ow-(ev.clientX-sx));
     b.style.left=nl+'px';b.style.width=Math.round(nw/frameUnit)*frameUnit+'px';
     f.start=nl/frameUnit;f.length=parseInt(b.style.width)/frameUnit};
    const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up)};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
   };

   // resize right
   hr.onmousedown=e=>{
    let sx=e.clientX,ow=parseInt(b.style.width);
    const mv=ev=>{let nw=Math.max(frameUnit,Math.round((ow+(ev.clientX-sx))/frameUnit)*frameUnit);
     b.style.width=nw+'px';f.length=nw/frameUnit};
    const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up)};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
   };
  });

  track.querySelector('input').onchange=()=>{
   let end=layer.frames.reduce((a,f)=>Math.max(a,f.start+f.length),0);
   [...track.querySelector('input').files].forEach(fl=>{let url=URL.createObjectURL(fl);layer.frames.push({url,start:end,length:1});end++});
   renderTracks();
  };

  const label=track.querySelector('.track-label');
  label.ondragstart=e=>e.dataTransfer.setData('index',i);
  track.ondragover=e=>{e.preventDefault();track.classList.add('drag-over')};
  track.ondragleave=()=>track.classList.remove('drag-over');
  track.ondrop=e=>{e.preventDefault();track.classList.remove('drag-over');
   let from=parseInt(e.dataTransfer.getData('index')),to=i;
   if(from!==to){layers.splice(to,0,layers.splice(from,1)[0]);renderTracks()}};tracksDiv.appendChild(track);
 });
}

addBtn.onclick=()=>{layers.push({name:"Track "+(layers.length+1),frames:[]});renderTracks()};
delBtn.onclick=()=>{
 let selTracks=[...tracksDiv.querySelectorAll('.track.selected')];
 if(selTracks.length){selTracks.forEach(t=>{let idx=[...tracksDiv.querySelectorAll('.track')].indexOf(t);if(idx>-1)layers.splice(idx,1)});renderTracks();return}
 layers.forEach((l,li)=>{l.frames=l.frames.filter((fr,j)=>{let blocks=[...tracksDiv.querySelectorAll('.track')][li].querySelectorAll('.frame-block');return !blocks[j].classList.contains('selected')})});
 renderTracks();
};

