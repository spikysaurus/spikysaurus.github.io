const lasso={
  points:[],pos:{x:0,y:0},active:false,dragging:false,dash:0,
  resizing:null,handleSize:20,originalBuffer:null,transform:null,preRes:null,
  origBounds:null,rotation:0,rotating:false,startRotation:0,startAngle:0
};

function syncOverlay() {
  const rect = activeCanvas.getBoundingClientRect();
  lassoSelectOverlay.width = activeCanvas.width;
  lassoSelectOverlay.height = activeCanvas.height;
  lassoSelectOverlay.style.width = rect.width + "px";
  lassoSelectOverlay.style.height = rect.height + "px";
  lassoSelectOverlay.style.left = (rect.left + window.scrollX) + "px";
  lassoSelectOverlay.style.top = (rect.top + window.scrollY) + "px";
}

function getHandleAt(pos){
  if(!lasso.originalBuffer)return null;
  const {x,y}=lasso.pos,{width:w,height:h}=lasso.transform,hs=lasso.handleSize;
  const handles=[
    {id:'nw',x,y},{id:'n',x:x+w/2,y},{id:'ne',x:x+w,y},
    {id:'w',x,y:y+h/2},{id:'e',x:x+w,y:y+h/2},
    {id:'sw',x,y:y+h},{id:'s',x:x+w/2,y:y+h},{id:'se',x:x+w,y:y+h}
  ];
  const found=handles.find(p=>Math.abs(pos.x-p.x)<hs&&Math.abs(pos.y-p.y)<hs)?.id;
  if(found)return found;
  // rotation handle above top-center
  const rx=x+w/2,ry=y-30;
  if(Math.hypot(pos.x-rx,pos.y-ry)<hs)return 'rotate';
  return null;
}

function handleLasso(e,type){
  const pos=getMousePos(e);syncOverlay();
  if(type==='down'){
	  syncOverlay();
    const h=getHandleAt(pos);
    if(h==='rotate'){
      lasso.rotating=true;
      const cx=lasso.pos.x+lasso.transform.width/2,cy=lasso.pos.y+lasso.transform.height/2;
      lasso.startRotation=lasso.rotation;
      lasso.startAngle=Math.atan2(pos.y-cy,pos.x-cx);
    }
    else if(h){
      lasso.resizing=h;startX=pos.x;startY=pos.y;
      lasso.preRes={...lasso.pos,w:lasso.transform.width,h:lasso.transform.height};
    }
    else if(lasso.originalBuffer&&pos.x>lasso.pos.x&&pos.x<lasso.pos.x+lasso.transform.width&&pos.y>lasso.pos.y&&pos.y<lasso.pos.y+lasso.transform.height){
      lasso.dragging=true;startX=pos.x-lasso.pos.x;startY=pos.y-lasso.pos.y;
    }
    else{
      if(lasso.originalBuffer)commitLasso();
      lasso.active=true;lasso.points=[pos];
    }
  }
  if(type==='move'){
    if(lasso.rotating){
      const cx=lasso.pos.x+lasso.transform.width/2,cy=lasso.pos.y+lasso.transform.height/2;
      const currentAngle=Math.atan2(pos.y-cy,pos.x-cx);
      const delta=currentAngle-lasso.startAngle;
      lasso.rotation=lasso.startRotation+delta;
    }
    else if(lasso.resizing){
      const dx=pos.x-startX,dy=pos.y-startY,r=lasso.preRes;
      let newW=r.w,newH=r.h;
      if(lasso.resizing.includes('e'))newW=Math.max(10,r.w+dx);
      if(lasso.resizing.includes('s'))newH=Math.max(10,r.h+dy);
      if(lasso.resizing.includes('w')){newW=Math.max(10,r.w-dx);lasso.pos.x=r.x+(r.w-newW);}
      if(lasso.resizing.includes('n')){newH=Math.max(10,r.h-dy);lasso.pos.y=r.y+(r.h-newH);}
      if(e.shiftKey){const ratio=r.w/r.h;if(newW/newH>ratio)newW=Math.round(newH*ratio);else newH=Math.round(newW/ratio);}
      lasso.transform.width=newW;lasso.transform.height=newH;
    }
    if(lasso.active)lasso.points.push(pos);
    if(lasso.dragging){lasso.pos.x=pos.x-startX;lasso.pos.y=pos.y-startY;}
  }
  if(type==='up'){
    lasso.resizing=null;lasso.rotating=false;
    if(lasso.active&&lasso.points.length>5){
      const xs=lasso.points.map(p=>p.x),ys=lasso.points.map(p=>p.y),
        x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
      lasso.originalBuffer=document.createElement('canvas');
      lasso.originalBuffer.width=w;lasso.originalBuffer.height=h;
      const bCtx=lasso.originalBuffer.getContext('2d');
      bCtx.imageSmoothingEnabled=false;bCtx.save();bCtx.beginPath();
      lasso.points.forEach((p,i)=>i===0?bCtx.moveTo(p.x-x,p.y-y):bCtx.lineTo(p.x-x,p.y-y));
      bCtx.closePath();bCtx.clip();
      bCtx.drawImage(activeCanvas,x,y,w,h,0,0,w,h);bCtx.restore();
      activeCanvasCtx.save();activeCanvasCtx.setTransform(1,0,0,1,0,0);
      activeCanvasCtx.globalCompositeOperation='destination-out';
      activeCanvasCtx.beginPath();
      lasso.points.forEach((p,i)=>i===0?activeCanvasCtx.moveTo(p.x,p.y):activeCanvasCtx.lineTo(p.x,p.y));
      activeCanvasCtx.closePath();activeCanvasCtx.fill();activeCanvasCtx.restore();
      lasso.pos={x,y};lasso.transform={width:w,height:h};lasso.origBounds={x,y,w,h};
    }
    lasso.active=false;lasso.dragging=false;
  }
}

function commitLasso(){
  if(!lasso.originalBuffer) return;

  // --- SAFETY CHECK ---
  // Ensure the buffer is not empty and the target transform has area
  const tw = Math.round(lasso.transform.width);
  const th = Math.round(lasso.transform.height);
  const bw = lasso.originalBuffer.width;
  const bh = lasso.originalBuffer.height;

  if (bw === 0 || bh === 0 || Math.abs(tw) === 0 || Math.abs(th) === 0) {
    console.warn("Commit aborted: Selection size is zero.");
    resetLassoState();
    return;
  }
  // --------------------

  activeCanvasCtx.save();
  activeCanvasCtx.imageSmoothingEnabled = false;
  activeCanvasCtx.globalCompositeOperation = 'source-over'; 
  
  const cx = Math.round(lasso.pos.x + lasso.transform.width / 2);
  const cy = Math.round(lasso.pos.y + lasso.transform.height / 2);
  
  activeCanvasCtx.translate(cx, cy);
  activeCanvasCtx.rotate(lasso.rotation);

  try {
    activeCanvasCtx.drawImage(
      lasso.originalBuffer,
      -Math.round(tw / 2),
      -Math.round(th / 2),
      tw,
      th
    );
  } catch (e) {
    console.error("Failed to commit lasso drawImage:", e);
  }

  activeCanvasCtx.restore();
  
  // Update the drawing data
  if(activeDrawing) activeDrawing.data = activeCanvas.toDataURL();
  
  resetLassoState();
}

// Helper to keep code clean
function resetLassoState() {
  lasso.originalBuffer = null;
  lasso.transform = null;
  lasso.origBounds = null;
  lasso.rotation = 0;
}

function drawLassoUI() {
  if (lasso.active || lasso.originalBuffer) syncOverlay();

  const lassoSelectOverlayCtx = lassoSelectOverlay.getContext('2d');
  lassoSelectOverlayCtx.clearRect(0, 0, lassoSelectOverlay.width, lassoSelectOverlay.height);

  // 1. Exit if nothing is active
  if (!lasso.active && !lasso.originalBuffer) {
    requestAnimationFrame(drawLassoUI);
    return;
  }

  // 2. STRICT SIZE VALIDATION
  // Prevents "InvalidStateError" by ensuring width/height are not 0
  const MIN_DRAW_SIZE = 0.5; // Anything smaller than half a pixel is ignored
  
  let isValidSelection = false;
  if (lasso.active && lasso.points.length > 1) {
    isValidSelection = true; 
  } else if (lasso.originalBuffer) {
    const w = Math.abs(lasso.transform.width);
    const h = Math.abs(lasso.transform.height);
    const bw = lasso.originalBuffer.width;
    const bh = lasso.originalBuffer.height;
    
    // Check if both the buffer AND the intended draw area are valid sizes
    if (w > MIN_DRAW_SIZE && h > MIN_DRAW_SIZE && bw > 0 && bh > 0) {
      isValidSelection = true;
    }
  }

  // If it's just a click or 0-size, stop here
  if (!isValidSelection) {
    requestAnimationFrame(drawLassoUI);
    return;
  }

  lassoSelectOverlayCtx.save();
  lassoSelectOverlayCtx.setLineDash([5, 5]);
  lassoSelectOverlayCtx.lineDashOffset = lasso.dash -= 0.5;
  lassoSelectOverlayCtx.imageSmoothingEnabled = false;

  if (typeof flipH !== "undefined" && typeof flipV !== "undefined") {
    lassoSelectOverlayCtx.translate(flipH === -1 ? lassoSelectOverlay.width : 0, flipV === -1 ? lassoSelectOverlay.height : 0);
    lassoSelectOverlayCtx.scale(flipH, flipV);
  }

  if (lasso.active) {
    lassoSelectOverlayCtx.strokeStyle = "blue";
    lassoSelectOverlayCtx.beginPath();
    lasso.points.forEach((p, i) => i === 0 ? lassoSelectOverlayCtx.moveTo(p.x, p.y) : lassoSelectOverlayCtx.lineTo(p.x, p.y));
    lassoSelectOverlayCtx.closePath();
    lassoSelectOverlayCtx.stroke();
  } 
  else if (lasso.originalBuffer) {
    const { x, y } = lasso.pos;
    const { width: w, height: h } = lasso.transform;
    const cx = Math.round(x + w / 2), cy = Math.round(y + h / 2);

    lassoSelectOverlayCtx.translate(cx, cy);
    lassoSelectOverlayCtx.rotate(lasso.rotation);

    // Final safety check specifically for drawImage
    try {
        lassoSelectOverlayCtx.drawImage(lasso.originalBuffer, -Math.round(w / 2), -Math.round(h / 2), Math.round(w), Math.round(h));
    } catch (e) {
        console.warn("Skipping drawImage due to invalid dimensions:", e);
    }

    lassoSelectOverlayCtx.strokeStyle = "blue";
    lassoSelectOverlayCtx.strokeRect(-w / 2, -h / 2, w, h);
    lassoSelectOverlayCtx.strokeStyle = "black";
    lassoSelectOverlayCtx.lineDashOffset += 5;
    lassoSelectOverlayCtx.strokeRect(-w / 2, -h / 2, w, h);

    // Path drawing logic
    const { x: ox, y: oy, w: ow, h: oh } = lasso.origBounds;
    if (ow > 0 && oh > 0) { // Prevent division by zero
        const scaleX = w / ow, scaleY = h / oh;
        lassoSelectOverlayCtx.strokeStyle = "blue";
        lassoSelectOverlayCtx.beginPath();
        lasso.points.forEach((p, i) => {
            const sx = (p.x - ox) * scaleX - w / 2, sy = (p.y - oy) * scaleY - h / 2;
            i === 0 ? lassoSelectOverlayCtx.moveTo(sx, sy) : lassoSelectOverlayCtx.lineTo(sx, sy);
        });
        lassoSelectOverlayCtx.closePath();
        lassoSelectOverlayCtx.stroke();
    }

    // Handles
    lassoSelectOverlayCtx.setLineDash([]);
    lassoSelectOverlayCtx.fillStyle = "white";
    lassoSelectOverlayCtx.strokeStyle = "black";
    const hs = lasso.handleSize;
    [{ px: -w / 2, py: -h / 2 }, { px: 0, py: -h / 2 }, { px: w / 2, py: -h / 2 }, { px: -w / 2, py: 0 }, { px: w / 2, py: 0 },
    { px: -w / 2, py: h / 2 }, { px: 0, py: h / 2 }, { px: w / 2, py: h / 2 }]
      .forEach(p => {
        lassoSelectOverlayCtx.fillRect(p.px - hs / 2, p.py - hs / 2, hs, hs);
        lassoSelectOverlayCtx.strokeRect(p.px - hs / 2, p.py - hs / 2, hs, hs);
      });

    // Rotation handle
    lassoSelectOverlayCtx.beginPath();
    lassoSelectOverlayCtx.arc(0, -h / 2 - 30, hs / 2, 0, Math.PI * 2);
    lassoSelectOverlayCtx.fillStyle = "white";
    lassoSelectOverlayCtx.fill();
    lassoSelectOverlayCtx.strokeStyle = "black";
    lassoSelectOverlayCtx.stroke();
  }

  lassoSelectOverlayCtx.restore();
  requestAnimationFrame(drawLassoUI);
}


drawLassoUI();

// Keyboard & Pointer
window.addEventListener('keydown', e=>{
  if(e.target.tagName!=='INPUT'){
    const key = e.key.toLowerCase();

    // Switch tool
    if(key==='v'){
      activeTool==="ToolLasso" ? (commitLasso(), switchTool("ToolBrush")) : switchTool("ToolLasso");
    }

    // Mirror horizontal
    if(key==='m' && !e.shiftKey && lasso.originalBuffer){
      const buf = document.createElement('canvas');
      buf.width = lasso.originalBuffer.width;
      buf.height = lasso.originalBuffer.height;
      const ctx = buf.getContext('2d');
      ctx.translate(buf.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(lasso.originalBuffer, 0, 0);
      lasso.originalBuffer = buf;

      // Mirror polygon points horizontally
      const {x:ox,y:oy,w:ow} = lasso.origBounds;
      lasso.points = lasso.points.map(p => ({
        x: ox + ow - (p.x - ox),
        y: p.y
      }));
    }

    // Mirror vertical
    if(key==='m' && e.shiftKey && lasso.originalBuffer){
      const buf = document.createElement('canvas');
      buf.width = lasso.originalBuffer.width;
      buf.height = lasso.originalBuffer.height;
      const ctx = buf.getContext('2d');
      ctx.translate(0, buf.height);
      ctx.scale(1, -1);
      ctx.drawImage(lasso.originalBuffer, 0, 0);
      lasso.originalBuffer = buf;

      // Mirror polygon points vertically
      const {x:ox,y:oy,h:oh} = lasso.origBounds;
      lasso.points = lasso.points.map(p => ({
        x: p.x,
        y: oy + oh - (p.y - oy)
      }));
    }
    
    // Erase inside selection with "X"
	if(key==='x' && lasso.originalBuffer){
	  activeCanvasCtx.save();
	  activeCanvasCtx.globalCompositeOperation = 'destination-out';
	  activeCanvasCtx.translate(
		lasso.pos.x + lasso.transform.width / 2,
		lasso.pos.y + lasso.transform.height / 2
	  );
	  activeCanvasCtx.rotate(lasso.rotation);
	  activeCanvasCtx.drawImage(lasso.originalBuffer,-Math.round(lasso.transform.width / 2),-Math.round(lasso.transform.height / 2),Math.round(lasso.transform.width),Math.round(lasso.transform.height)
	  );
	  activeCanvasCtx.restore();
	  // Reset lasso state after erasing
	  lasso.originalBuffer = null;lasso.transform = null;lasso.origBounds = null;lasso.rotation = 0;
	  if(activeDrawing) activeDrawing.data = activeCanvas.toDataURL();
	}

  }
});

window.addEventListener('pointerdown',e=>{
  if(activeTool==="ToolLasso"){
    const pos=getMousePos(e);
    const handle=getHandleAt(pos);
    if(handle==='rotate'){
      const cx=lasso.pos.x+lasso.transform.width/2;
      const cy=lasso.pos.y+lasso.transform.height/2;
      lasso.rotating=true;
      lasso.startRotation=lasso.rotation;
      lasso.startAngle=Math.atan2(pos.y-cy,pos.x-cx);
    }
    handleLasso(e,'down');
  } else if(lasso.originalBuffer){
commitLasso();
  }
});

window.addEventListener('pointermove',e=>{
  if(activeTool==="ToolLasso"){
    if(lasso.rotating){
      const pos=getMousePos(e);
      const cx=lasso.pos.x+lasso.transform.width/2;
      const cy=lasso.pos.y+lasso.transform.height/2;
      const currentAngle=Math.atan2(pos.y-cy,pos.x-cx);
      const delta=currentAngle-lasso.startAngle;
      lasso.rotation=lasso.startRotation+delta;
    } else {
      handleLasso(e,'move');
    }
  }
});

window.addEventListener('pointerup',e=>{
  if(activeTool==="ToolLasso"){
    lasso.rotating=false;
    handleLasso(e,'up');
  }
});
