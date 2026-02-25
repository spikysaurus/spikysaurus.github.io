function getFlipbookHTML(frames, width, height) {
return `<!DOCTYPE html>
<html>
<head>
<title>Flipbook Preview</title>
<meta name="viewport" content="width=device-width, initial-scale=1">


<style>
    :root{--bg-color:#fff;}
    body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a1a;color:#eee;font-family:sans-serif;}
    .main-container{display:flex;width:100%;height:100vh;}
    .canvas-wrapper{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;}
    canvas{background:var(--bg-color);border:2px solid #333;max-width:100%;max-height:80%;image-rendering:pixelated;}
    .controls-below{margin-top:10px;display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;}
    
    .controls-row{
    display:flex;gap:8px;
    justify-content:center;
    flex-direction: column; 
    align-items: center;
    text-align:center;
    }

	input[type=range] {
	  flex-grow: 1;
	  width: 100%;
	  max-width: none; 
	  min-width: 500px; 
	}

    
    .sidebar{width:350px;min-width:200px;max-width:500px;display:flex;flex-direction:column;background:#252525;border-left:1px solid #333;}
    .ui-panel{flex:1;padding:15px;display:flex;flex-direction:column;gap:15px;overflow-y:auto;}
    .resizer{width:8px;cursor:col-resize;background:#444;}
    
    .control-group{
		  display: flex;
		  flex-wrap: wrap;
		  flex-direction: row; 
		  gap:5px;
		}
		
	.control-group label {
		display: flex;
		align-items: center;
		}
    
    button,input{border:none;}
    button{padding:10px 15px;cursor:pointer;background:#4c4c4c;color:#fff;font-weight:bold;}
    button:hover{background:#a35293;}
    
    input{type=color}{width:32px;height:32px;}
    
    
    input[type=number]{
		text-align:center;
        width:auto;
        background:#1c1c1c;
        border:1px solid #5f5f5f;
        color:white;
        -webkit-appearance: none;
        -moz-appearance: textfield;
    }
    
    #loading,#exporting{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.9);color:#fff;z-index:100;}
    #exporting{display:none;}
    @media(max-width:768px){
      .main-container{flex-direction:column;}
      .canvas-wrapper{height:50vh;}
      .sidebar{width:100%;border-left:none;border-top:1px solid #333;}
      .resizer{height:6px;width:100%;cursor:row-resize;}
      input[type=range] { min-width: 100px; width: 90%; /* keep it usable but not edge-to-edge */ }
    }
</style>
</head>
<body>
<div id="loading"><h2>Caching Frames...</h2><p id="prog">0%</p></div>
<div id="exporting"><h2>Rendering...</h2><p id="expProg">0%</p></div>
<div class="main-container">
 <div class="canvas-wrapper">
   <canvas id="vp"></canvas>
   <div class="controls-below">
   
     <div class="controls-row">
     
		<div class="control-group">
			<input type="range" id="scrub" min="0" max="${frames.length-1}" value="0">
		</div>

		<div class="control-group">
			<button onclick="prev()">Prev Frame</button>
			<button id="playPause" onclick="togglePlay()">Pause</button>
			<button onclick="next()">Next Frame</button>
		</div>
		
		<div class="control-group">
			<label>FPS:</label><input type="number" id="fpsInp" value="24" min="1" max="60" onchange="updateFPS()">
			<button style="width:64px;text-align:center;"><span id="fnum">1</span>/${frames.length}</button>
		</div>
       
     </div>
   </div>
 </div>
 <div class="resizer" id="dragbar"></div>
 <div class="sidebar" id="sidebar">
   <div class="ui-panel">
   
      <div class="control-group">
		<input type="color" id="bgColor" value="#ffffff" onchange="updateBG()"><label>Background Color</label>
      </div>
      
     <div class="control-group">
		<input type="checkbox" id="bgTrans" onchange="updateBG()"><label>Transparent</label>
     </div>
     
     <div class="control-group">
		<label><input type="checkbox" id="aliasToggle">Smoothing</label><input type="number" id="smoothFactor" value="2" min="0" max="10">
     </div>
     
     <div class="control-group">
		<button onclick="exportVideo()">Export Video</button>
		<button onclick="exportZip()">Export Image Sequence</button>
	</div>
	
   </div>
 </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>


<script>
const frameData=${JSON.stringify(frames)},canvas=document.getElementById('vp'),ctx=canvas.getContext('2d');
canvas.width=${width};canvas.height=${height};ctx.imageSmoothingEnabled=false;
let imgObjects=[],currentFrame=0,isPlaying=true,fps=24,timer;
async function init(){for(let i=0;i<frameData.length;i++){const img=new Image();img.src=frameData[i];await img.decode();imgObjects.push(img);prog.innerText=Math.round((i/frameData.length)*100)+"%";}loading.style.display='none';render();startLoop();}
function render(){if(!imgObjects[currentFrame])return;ctx.clearRect(0,0,canvas.width,canvas.height);if(!bgTrans.checked){ctx.fillStyle=bgColor.value;ctx.fillRect(0,0,canvas.width,canvas.height);}const alias=aliasToggle.checked,strength=parseInt(smoothFactor.value)||0;if(alias&&strength>0&&'filter' in ctx){ctx.imageSmoothingEnabled=true;ctx.filter=\`blur(\${strength}px)\`;ctx.drawImage(imgObjects[currentFrame],0,0,canvas.width,canvas.height);ctx.filter='none';}else{ctx.imageSmoothingEnabled=alias;ctx.filter='none';ctx.drawImage(imgObjects[currentFrame],0,0,canvas.width,canvas.height);}fnum.innerText=currentFrame+1;scrub.value=currentFrame;}
function startLoop(){if(timer)clearTimeout(timer);if(isPlaying){currentFrame=(currentFrame+1)%imgObjects.length;render();}timer=setTimeout(()=>requestAnimationFrame(startLoop),1000/fps);}
function updateFPS(){fps=parseInt(fpsInp.value)||24;}
function togglePlay(){isPlaying=!isPlaying;playPause.innerText=isPlaying?"Pause":"Play";}
function next(){isPlaying=false;currentFrame=(currentFrame+1)%imgObjects.length;render();}
function prev(){isPlaying=false;currentFrame=(currentFrame-1+imgObjects.length)%imgObjects.length;render();}
scrub.oninput=e=>{isPlaying=false;currentFrame=parseInt(e.target.value);render();};
function updateBG(){document.documentElement.style.setProperty('--bg-color',bgTrans.checked?'transparent':bgColor.value);}
function exportVideo(){const transparent=bgTrans.checked,mime=transparent?'video/webm;codecs=vp9':'video/mp4',stream=canvas.captureStream(fps);let recorder;try{recorder=new MediaRecorder(stream,{mimeType:mime});}catch{recorder=new MediaRecorder(stream,{mimeType:'video/webm'});}const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>{exporting.style.display='none';const blob=new Blob(chunks,{type:recorder.mimeType});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=transparent?'Kertas_animation.webm':'Kertas_animation.mp4';link.click();};let frameIndex=0;recorder.start();exporting.style.display='flex';function step(){currentFrame=frameIndex;render();expProg.innerText=Math.round((frameIndex/imgObjects.length)*100)+"%";if(frameIndex<imgObjects.length-1){frameIndex++;setTimeout(step,1000/fps);}else{expProg.innerText="100%";setTimeout(()=>recorder.stop(),1000);}}isPlaying=false;frameIndex=0;step();}
async function exportZip(){exporting.style.display='flex';const zip=new JSZip();for(let i=0;i<imgObjects.length;i++){currentFrame=i;render();const data=canvas.toDataURL('image/png').split(',')[1];zip.file('frame_'+String(i+1).padStart(4,'0')+'.png',data,{base64:true});expProg.innerText=Math.round(((i+1)/imgObjects.length)*100)+"%";}const blob=await zip.generateAsync({type:'blob'});exporting.style.display='none';const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='Kertas_sequence.zip';link.click();}
init();
// Responsive sidebar resize
const dragbar=document.getElementById('dragbar'),sidebar=document.getElementById('sidebar');
dragbar.onpointerdown=e=>{e.preventDefault();document.onpointermove=ev=>{if(window.innerWidth>768){let w=window.innerWidth-ev.clientX;if(w<200)w=200;if(w>500)w=500;sidebar.style.width=w+'px';}else{let h=window.innerHeight-ev.clientY;if(h<150)h=150;if(h>window.innerHeight*0.8)h=window.innerHeight*0.8;sidebar.style.height=h+'px';sidebar.style.flex='none';}};document.onpointerup=()=>{document.onpointermove=null;};};
</script>



</body>
</html>

`

;}
