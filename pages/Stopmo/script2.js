// --- script2.js ---
// Playback, playhead, capture, export GIF

// helper: scroll timeline so playhead is visible
function scrollToPlayhead(){
  const x=parseInt(playhead.style.left)||0;
  const right=tracksDiv.scrollLeft+tracksDiv.clientWidth;
  if(x>right-40)tracksDiv.scrollLeft=x-40;
  if(x<tracksDiv.scrollLeft)tracksDiv.scrollLeft=x;
}

// helper: select block
function selectBlock(trackIndex,frameIndex){
  const track=[...tracksDiv.querySelectorAll('.track')][trackIndex];
  if(!track)return;
  const blocks=[...track.querySelectorAll('.frame-block')];
  const target=blocks[frameIndex];
  if(!target)return;
  blocks.forEach(b=>b.classList.remove('selected'));
  target.classList.add('selected');
}

// helper: jump playhead
function jumpPlayhead(frame){
  playhead.style.left=(frame*frameUnit)+'px';
  scrubToFrame(frame);
  scrollToPlayhead();
}

// capture webcam frame
capBtn.onclick=()=>{
  const c=document.createElement('canvas');
  c.width=camera.videoWidth||320; c.height=camera.videoHeight||240;
  c.getContext('2d').drawImage(camera,0,0);
  const url=c.toDataURL('image/png');

  if(layers.length===0){
    layers.push({name:"Track 1",frames:[{url,start:0,length:1}]});
    renderTracks();
    selectBlock(0,0);jumpPlayhead(0);return;
  }
  const sel=document.querySelector('.frame-block.selected');
  if(!sel){
    const end=layers[0].frames.reduce((a,f)=>Math.max(a,f.start+f.length),0);
    layers[0].frames.push({url,start:end,length:1});
    renderTracks();
    selectBlock(0,layers[0].frames.length-1);jumpPlayhead(end);return;
  }
  const trackEl=sel.closest('.track');
  const ti=[...tracksDiv.querySelectorAll('.track')].indexOf(trackEl);
  const fi=[...trackEl.querySelectorAll('.frame-block')].indexOf(sel);
  const sf=layers[ti].frames[fi];const ns=sf.start+sf.length;
  layers[ti].frames.splice(fi+1,0,{url,start:ns,length:1});
  renderTracks();
  selectBlock(ti,fi+1);jumpPlayhead(ns);
};

// playback loop
async function play(){
  playing=true;
  let f=0,max=Math.max(...layers.map(l=>l.frames.reduce((a,c)=>Math.max(a,c.start+c.length),0)));
  layers.forEach(l=>{if(!l.img){l.img=document.createElement('img');preview.appendChild(l.img)}});
  while(playing){
    layers.forEach(l=>{
      const a=l.frames.find(fr=>f>=fr.start&&f<fr.start+fr.length);
      if(a){l.img.src=a.url;l.img.style.display='block'}else l.img.style.display='none';
    });
    const snappedLeft=Math.round((f*frameUnit)/frameUnit)*frameUnit;
    playhead.style.left=snappedLeft+'px';
    scrollToPlayhead();
    await new Promise(r=>setTimeout(r,1000/fps));
    f=(f+1)%max;
  }
}
playBtn.onclick=()=>{if(!playing)play()};
stopBtn.onclick=()=>playing=false;

// playhead drag
head.onmousedown=e=>{
  let sx=e.clientX,ol=parseInt(playhead.style.left)||0;
  const mv=ev=>{
    let nl=Math.max(0,Math.round((ol+(ev.clientX-sx))/frameUnit)*frameUnit);
    playhead.style.left=nl+'px';
    scrubToFrame(nl/frameUnit);
    scrollToPlayhead();
  };
  const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up)};
  document.addEventListener('mousemove',mv);
  document.addEventListener('mouseup',up);
};

// scrub preview
function scrubToFrame(f){
  layers.forEach(l=>{
    const a=l.frames.find(fr=>f>=fr.start&&f<fr.start+fr.length);
    if(a){l.img.src=a.url;l.img.style.display='block'}else l.img.style.display='none';
  });
}

// export GIF (requires gif.js library)
function exportGIF(){
  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: 'gif.worker.js'
  });

  const maxFrame = Math.max(...layers.map(l=>l.frames.reduce((a,f)=>Math.max(a,f.start+f.length),0)));

  // preload cache
  const cache = {};
  const promises = [];

  layers.forEach(l=>{
    l.frames.forEach(fr=>{
      if(!cache[fr.url]){
        cache[fr.url] = new Image();
        cache[fr.url].src = fr.url;
        promises.push(new Promise(res=>{
          cache[fr.url].onload = res;
        }));
      }
    });
  });

  Promise.all(promises).then(()=>{
    for(let f=0; f<maxFrame; f++){
      const canvas=document.createElement('canvas');
      canvas.width=preview.clientWidth; canvas.height=preview.clientHeight;
      const ctx=canvas.getContext('2d');

      layers.forEach(l=>{
        const a=l.frames.find(fr=>f>=fr.start&&f<fr.start+fr.length);
        if(a){
          const img=cache[a.url];
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
        }
      });

      gif.addFrame(canvas,{delay:1000/fps});
    }

    gif.on('finished',blob=>{
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=url;
      link.download='animation.gif';
      link.click();
    });

    gif.render();
  });
}


// attach export button
document.getElementById('exportGif').onclick = exportGIF;

