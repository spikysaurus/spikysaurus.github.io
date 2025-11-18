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
function updateTimecode(){let f=Math.round(parseInt(playhead.style.left||0)/frameUnit),max=layers.reduce((a,l)=>l.frames.reduce((m,fr)=>Math.max(m,fr.start+fr.length),a),0);timecodeLabel.textContent=`${formatTimecode(f)} / ${formatTimecode(max)}`}
function updateLayerStacking(){layers.forEach((l,idx)=>{if(l.img){l.img.style.position='absolute';l.img.style.top=0;l.img.style.left=0;l.img.style.zIndex=idx}})}

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
   track.querySelector(".track-label").onclick=()=>track.classList.toggle("selected");

   layer.frames.forEach((fr,fidx)=>{
     let block=document.createElement("div");block.className="frame-block";block.textContent=fidx+1;
     block.style.left=fr.start*frameUnit+"px";block.style.width=fr.length*frameUnit+"px";
     let left=document.createElement("div");left.className="handle left";left.style.display="none";
     let right=document.createElement("div");right.className="handle right";right.style.display="none";
     block.append(left,right);strip.appendChild(block);
     block.onclick=ev=>{if(!ev.target.classList.contains("handle")){block.classList.toggle("selected");block.querySelectorAll(".handle").forEach(h=>h.style.display=block.classList.contains("selected")?"block":"none")}};
     // drag/resize handlers omitted for brevity (same as your original)
   });

   track.querySelector("input").onchange=e=>{
     let end=layer.frames.reduce((m,f)=>Math.max(m,f.start+f.length),0);
     [...e.target.files].forEach(file=>{
       let url=URL.createObjectURL(file);
       layer.frames.push({url,start:end,length:1});end++;
     });
     renderTracks();updateTimecode();updateLayerStacking();
   };

   let label=track.querySelector(".track-label");label.ondragstart=e=>e.dataTransfer.setData("index",idx);
   track.ondragover=e=>{e.preventDefault();track.classList.add("drag-over")};
   track.ondragleave=()=>track.classList.remove("drag-over");
   track.ondrop=e=>{e.preventDefault();track.classList.remove("drag-over");let from=parseInt(e.dataTransfer.getData("index")),to=idx;if(from!==to){layers.splice(to,0,layers.splice(from,1)[0]);renderTracks();updateTimecode();updateLayerStacking()}};tracksDiv.appendChild(track);
 });
 updateTimecode();updateLayerStacking();
}

addBtn.onclick=()=>{layers.unshift({name:"Track "+(layers.length+1),frames:[]});renderTracks();updateLayerStacking()};
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

async function collectFrames() {
  const canvas=document.createElement("canvas");
  canvas.width=640; canvas.height=480;
  const ctx=canvas.getContext("2d");
  const blobs=[];
  const total=layers.reduce((m,l)=>l.frames.reduce((mm,f)=>Math.max(mm,f.start+f.length),m),0);
  for(let i=0;i<total;i++){
    await renderFrameToCanvas(i,canvas,ctx);
    const blob=await new Promise(res=>canvas.toBlob(res,"image/png"));
    blobs.push({name:`frame_${String(i).padStart(4,"0")}.png`,blob});
  }
  return blobs;
}

exportZipBtn.onclick=async()=>{
  const frames=await collectFrames();
  const zip=new JSZip();
  frames.forEach(f=>zip.file(f.name,f.blob));
  const content=await zip.generateAsync({type:"blob"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(content);
  a.download="sequence.zip";
  a.click();
};

