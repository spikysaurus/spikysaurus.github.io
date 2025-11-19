let fps=24,playing=false,layers=[],frameUnit=20;
const preview=document.getElementById("preview"),fpsInput=document.getElementById("fps"),
zoomInput=document.getElementById("zoom"),playBtn=document.getElementById("play"),
stopBtn=document.getElementById("stop"),addBtn=document.getElementById("add"),
delBtn=document.getElementById("delete"),capBtn=document.getElementById("capture"),
toggleCam=document.getElementById("toggleCam"),tracksDiv=document.getElementById("tracks"),
playhead=document.getElementById("playhead"),camera=document.getElementById("camera"),
timecodeLabel=document.getElementById("timecode"),head=document.createElement("div");
head.className="playhead-head";playhead.appendChild(head);

navigator.mediaDevices.getUserMedia({video:true}).then(s=>camera.srcObject=s).catch(console.error);
fpsInput.oninput=()=>fps=parseInt(fpsInput.value)||24;
zoomInput.oninput=()=>{frameUnit=parseInt(zoomInput.value);renderTracks();updateLayerStacking()};
toggleCam.onclick=()=>{camera.classList.toggle("hidden");toggleCam.textContent=camera.classList.contains("hidden")?"Show Cam":"Hide Cam"};

function buildRuler(n){let r=document.createElement("div");r.className="ruler";for(let i=0;i<n;i++){let t=document.createElement("div");t.className="tick";t.style.width=frameUnit+"px";t.textContent=i;r.appendChild(t)}return r}
function formatTimecode(f){let t=Math.floor(f/fps);return`${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}:${String(f%fps).padStart(2,"0")}`}
//function updateTimecode(){let f=Math.round(parseInt(playhead.style.left||0)/frameUnit),max=layers.reduce((a,l)=>l.frames.reduce((m,fr)=>Math.max(m,fr.start+fr.length),a),0);timecodeLabel.textContent=`${formatTimecode(f)} / ${formatTimecode(max)}`}
function updateTimecode(){let f=Math.round(parseInt(playhead.style.left||0)/frameUnit),max=layers.reduce((a,l)=>l.frames.reduce((m,fr)=>Math.max(m,fr.start+fr.length),a),0);timecodeLabel.textContent=`${formatTimecode(max)}`}
//function updateLayerStacking(){layers.forEach((l,idx)=>{if(l.img){l.img.style.position='absolute';l.img.style.top=0;l.img.style.left=0;l.img.style.zIndex=idx}})}
function updateLayerStacking(){
  layers.forEach((l,idx)=>{
    if(l.img){ // only update if it exists
      l.img.style.position='absolute';
      l.img.style.top=0;
      l.img.style.left=0;
      l.img.style.zIndex=idx;
    }
    else{}
  });
}


function renderTracks(){
 tracksDiv.querySelectorAll(".track").forEach(e=>e.remove());
 layers.forEach((layer,idx)=>{
   let inputId="file-upload-"+idx;
   let track=document.createElement("div");track.className="track";
   track.innerHTML=`<div class="track-header">
     <style>input[type=file]{display:none}.custom-file-upload{border:1px solid #ccc;display:inline-block;padding:6px 12px;cursor:pointer}</style>
     <label for="${inputId}" class="custom-file-upload">Import Images</label>
     <input id="${inputId}" type="file" multiple />
     <div class="track-label" draggable="true" style="margin-left:10px;">${layer.name}</div>
   </div>`;
   let strip=document.createElement("div");strip.className="track-strip";track.append(buildRuler(200),strip);
   track.querySelector(".track-label").onclick=()=>track.classList.toggle("selected"); updateLevelStrip();

   layer.frames.forEach((fr,fidx)=>{
     let block=document.createElement("div");block.className="frame-block";block.textContent=fidx+1;
     block.style.left=fr.start*frameUnit+"px";block.style.width=fr.length*frameUnit+"px";
     let left=document.createElement("div");left.className="handle left";left.style.display="none";
     let right=document.createElement("div");right.className="handle right";right.style.display="none";
     block.append(left,right);strip.appendChild(block);
     block.onclick=ev=>{if(!ev.target.classList.contains("handle")){block.classList.toggle("selected");block.querySelectorAll(".handle").forEach(h=>h.style.display=block.classList.contains("selected")?"block":"none")}};
     // drag/resize handlers omitted for brevity (same as your original)
   });
track.querySelector("input").onchange = e => {
  let end = layer.frames.reduce((m,f)=>Math.max(m,f.start+f.length),0);
  [...e.target.files].forEach(file=>{
    let url = URL.createObjectURL(file);
    layer.frames.push({url,start:end,length:1});
    end++;

    const img = new Image();
img.onload = () => {
  const c = document.createElement("canvas");
  c.width = preview.clientWidth;
  c.height = preview.clientHeight;
  const ctx = c.getContext("2d");

  // same crop/fit logic as camera
  const scale = Math.max(
    c.width / img.width,
    c.height / img.height
  );
  const sw = img.width * scale;
  const sh = img.height * scale;
  const dx = (c.width - sw) / 2;
  const dy = (c.height - sh) / 2;

  ctx.drawImage(img, dx, dy, sw, sh);

  // store canvas as preview element
  layer.img = c;
  preview.appendChild(c);
};
img.src = url;

  });
  renderTracks();
  updateTimecode();
  updateLevelStrip();
};


//   track.querySelector("input").onchange=e=>{
//     let end=layer.frames.reduce((m,f)=>Math.max(m,f.start+f.length),0);
//     [...e.target.files].forEach(file=>{
//       let url=URL.createObjectURL(file);
//       layer.frames.push({url,start:end,length:1});end++;
//     });
//     renderTracks();updateTimecode();updateLayerStacking();
//   };

   let label=track.querySelector(".track-label");label.ondragstart=e=>e.dataTransfer.setData("index",idx);
   track.ondragover=e=>{e.preventDefault();track.classList.add("drag-over")};
   track.ondragleave=()=>track.classList.remove("drag-over");
   track.ondrop=e=>{e.preventDefault();track.classList.remove("drag-over");let from=parseInt(e.dataTransfer.getData("index")),to=idx;if(from!==to){layers.splice(to,0,layers.splice(from,1)[0]);renderTracks();updateTimecode();updateLayerStacking()}};tracksDiv.appendChild(track);
 });
 updateTimecode();updateLayerStacking();updateLevelStrip();
}
//unshhift - push
addBtn.onclick=()=>{layers.push({name:"Track "+(layers.length+1),frames:[]});renderTracks();updateLayerStacking()};
delBtn.onclick=()=>{let sel=[...tracksDiv.querySelectorAll(".track.selected")];if(sel.length){sel.forEach(tr=>{let idx=[...tracksDiv.querySelectorAll(".track")].indexOf(tr);if(idx>-1)layers.splice(idx,1)});renderTracks();updateLayerStacking();return}layers.forEach((layer,idx)=>{layer.frames=layer.frames.filter((fr,fidx)=>![...tracksDiv.querySelectorAll(".track")][idx].querySelectorAll(".frame-block")[fidx].classList.contains("selected"))});renderTracks();updateLayerStacking()};

const exposePlusBtn=document.getElementById("exposePlus"),exposeMinusBtn=document.getElementById("exposeMinus"),
moveLeftBtn=document.getElementById("moveLeft"),moveRightBtn=document.getElementById("moveRight");
function getSelectedBlocks(){return[...document.querySelectorAll(".frame-block.selected")]}
exposePlusBtn.onclick=()=>{getSelectedBlocks().forEach(el=>{const strip=el.closest(".track-strip"),trackEl=strip.parentElement,trackIndex=[...tracksDiv.querySelectorAll(".track")].indexOf(trackEl),blocks=[...strip.querySelectorAll(".frame-block")],i=blocks.indexOf(el),layer=layers[trackIndex];let w=parseInt(el.style.width)+frameUnit;el.style.width=w+"px";layer.frames[i].length+=1;for(let j=i+1;j<blocks.length;j++){const b=blocks[j];b.style.left=(parseInt(b.style.left)+frameUnit)+"px";layer.frames[j].start+=1}});updateTimecode()};
exposeMinusBtn.onclick=()=>{getSelectedBlocks().forEach(el=>{const strip=el.closest(".track-strip"),trackEl=strip.parentElement,trackIndex=[...tracksDiv.querySelectorAll(".track")].indexOf(trackEl),blocks=[...strip.querySelectorAll(".frame-block")],i=blocks.indexOf(el),layer=layers[trackIndex];let w=parseInt(el.style.width);if(w>frameUnit){el.style.width=w-frameUnit+"px";layer.frames[i].length-=1;for(let j=i+1;j<blocks.length;j++){const b=blocks[j];b.style.left=(parseInt(b.style.left)-frameUnit)+"px";layer.frames[j].start-=1}}});updateTimecode()};
moveLeftBtn.onclick=()=>{getSelectedBlocks().forEach(el=>{const strip=el.closest(".track-strip"),trackEl=strip.parentElement,trackIndex=[...tracksDiv.querySelectorAll(".track")].indexOf(trackEl),blocks=[...strip.querySelectorAll(".frame-block")],i=blocks.indexOf(el),layer=layers[trackIndex];let left=parseInt(el.style.left);if(left>=frameUnit){el.style.left=(left-frameUnit)+"px";layer.frames[i].start-=1}});updateTimecode()};
moveRightBtn.onclick=()=>{getSelectedBlocks().forEach(el=>{const strip=el.closest(".track-strip"),trackEl=strip.parentElement,trackIndex=[...tracksDiv.querySelectorAll(".track")].indexOf(trackEl),blocks=[...strip.querySelectorAll(".frame-block")],i=blocks.indexOf(el),layer=layers[trackIndex];let left=parseInt(el.style.left)+frameUnit;el.style.left=left+"px";layer.frames[i].start+=1});updateTimecode()};



const exportZipBtn = document.getElementById("exportZip");

async function renderFrameToCanvas(frameIndex, canvas, ctx) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  layers.forEach(layer=>{
    layer.frames.forEach(fr=>{
      if(frameIndex>=fr.start && frameIndex<fr.start+fr.length){
        let img=new Image();
        img.src=fr.url;
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
      }
    });
  });
}





const levelStripBtn = document.getElementById("levelStripBtn");
const levelStripPanel = document.getElementById("levelStripPanel");
const levelStripContent = document.getElementById("levelStripContent");

levelStripBtn.onclick = () => {
  levelStripPanel.classList.toggle("open");
  if(levelStripPanel.classList.contains("open")) updateLevelStrip();
};

function getSelectedTrackIndex(){
  const tracks=[...tracksDiv.querySelectorAll(".track")];
  return tracks.findIndex(t=>t.classList.contains("selected"));
}

function updateLevelStrip(){
  levelStripContent.innerHTML="";
  const idx=getSelectedTrackIndex();
  if(idx<0) return; // no track selected
  const layer=layers[idx];
  layer.frames.forEach((fr,i)=>{
    const frameDiv=document.createElement("div");
    frameDiv.className="level-frame";
    const img=document.createElement("img");
    img.src=fr.url;
    frameDiv.appendChild(img);
    frameDiv.title=`Frame ${i+1}`;
    frameDiv.onclick=()=>{
      playhead.style.left=(fr.start*frameUnit)+"px";
      updateTimecode();
    };
    levelStripContent.appendChild(frameDiv);
  });
}



