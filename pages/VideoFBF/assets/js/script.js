const video=document.getElementById('video'),
fileInput=document.getElementById('fileInput'),
nextBtn=document.getElementById('nextFrame'),
prevBtn=document.getElementById('prevFrame'),
saveBtn=document.getElementById('saveFrame'),
frameDisplay=document.getElementById('frameDisplay');
let fps=30,frameDuration=1/fps,videoFileName="video";

function detectFPS(v){let last=null,count=0;
 function step(now,md){if(last!==null){const d=md.mediaTime-last;if(d>0){fps=Math.round(1/d);frameDuration=1/fps}}
 last=md.mediaTime;if(count++<10)v.requestVideoFrameCallback(step);}v.requestVideoFrameCallback(step);}
function startFrameUpdates(){function update(now,md){
 const frame=Math.floor((md.mediaTime||0)*fps);
 frameDisplay.textContent=`${frame}`;
 video.requestVideoFrameCallback(update);}
 video.requestVideoFrameCallback(update);}
function loadVideo(f){if(f){
   videoFileName=f.name.replace(/\.[^/.]+$/,""); // strip extension
   video.src=URL.createObjectURL(f);
   video.load();
   video.addEventListener('loadeddata',()=>{detectFPS(video);startFrameUpdates();video.play().catch(err=>console.error(err))},{once:true});
 }}
fileInput.addEventListener('change',e=>loadVideo(e.target.files[0]));
document.body.addEventListener('dragover',e=>{e.preventDefault()});
document.body.addEventListener('drop',e=>{e.preventDefault();loadVideo(e.dataTransfer.files[0])});

function nextFrame(){video.pause();video.currentTime+=frameDuration}
function prevFrame(){video.pause();video.currentTime=Math.max(0,video.currentTime-frameDuration)}
nextBtn.addEventListener('click',nextFrame);
prevBtn.addEventListener('click',prevFrame);
document.addEventListener('keydown',e=>{
 if(e.key==='.'){nextFrame();e.preventDefault()}
 else if(e.key===','){prevFrame();e.preventDefault()}
});

// Save current frame as PNG with video name + frame number
//saveBtn.addEventListener('click',()=>{
// const canvas=document.createElement('canvas');
// canvas.width=video.videoWidth;canvas.height=video.videoHeight;
// const ctx=canvas.getContext('2d');
// ctx.drawImage(video,0,0,canvas.width,canvas.height);
// const frameNum=Math.floor(video.currentTime*fps);
// const link=document.createElement('a');
// link.download=`${videoFileName}_${frameNum}.png`;
// link.href=canvas.toDataURL('image/png');
// link.click();
//});

saveBtn.addEventListener('click', () => {
  // Ensure video metadata is loaded
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.warn("Video not ready yet!");
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  // Draw current frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Compute frame number
  const frameNum = Math.floor(video.currentTime * fps);

  // Save as PNG
  const link = document.createElement('a');
  link.download = `${videoFileName}_${frameNum}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

