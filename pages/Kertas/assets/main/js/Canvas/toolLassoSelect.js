
// LASSO state
const lasso={
  points:[],pos:{x:0,y:0},active:false,dragging:false,dash:0,
  resizing:null,handleSize:8,originalBuffer:null,transform:null,preRes:null,
  origBounds:null,rotation:0,rotating:false,startRotation:0,startAngle:0
};

// Overlay canvas
const overlay=document.createElement('canvas');
overlay.id="lassoOverlay";
container.appendChild(overlay);

function syncOverlay(){
  const r=activeCanvas.getBoundingClientRect(),c=container.getBoundingClientRect();
  overlay.width=activeCanvas.width;overlay.height=activeCanvas.height;
  Object.assign(overlay.style,{
    position:"absolute",left:(r.left-c.left)+"px",top:(r.top-c.top)+"px",
    width:r.width+"px",height:r.height+"px",pointerEvents:"none",zIndex:"100",transform:"none"
  });
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
  if(!lasso.originalBuffer)return;
  activeCanvasCtx.save();
  activeCanvasCtx.imageSmoothingEnabled=false;
  activeCanvasCtx.globalCompositeOperation='source-over'; // draw over, not clear
  const cx=Math.round(lasso.pos.x+lasso.transform.width/2);
  const cy=Math.round(lasso.pos.y+lasso.transform.height/2);
  activeCanvasCtx.translate(cx,cy);
  activeCanvasCtx.rotate(lasso.rotation);
  activeCanvasCtx.drawImage(
    lasso.originalBuffer,
    -Math.round(lasso.transform.width/2),
    -Math.round(lasso.transform.height/2),
    Math.round(lasso.transform.width),
    Math.round(lasso.transform.height)
  );
  activeCanvasCtx.restore();
  lasso.originalBuffer=null;
  lasso.transform=null;
  lasso.origBounds=null;
  lasso.rotation=0;
  if(activeDrawing)activeDrawing.data=activeCanvas.toDataURL();
}


function drawLassoUI(){
  const oCtx=overlay.getContext('2d');
  oCtx.clearRect(0,0,overlay.width,overlay.height);
  if(!lasso.active&&!lasso.originalBuffer){requestAnimationFrame(drawLassoUI);return;}
  oCtx.save();oCtx.setLineDash([5,5]);oCtx.lineDashOffset=lasso.dash-=0.5;oCtx.imageSmoothingEnabled=false;
  
  if (typeof flipH !== "undefined" && typeof flipV !== "undefined") { oCtx.translate( flipH === -1 ? overlay.width : 0, flipV === -1 ? overlay.height : 0 ); oCtx.scale(flipH, flipV); }
  if(lasso.active){
    oCtx.strokeStyle="blue";oCtx.beginPath();
    lasso.points.forEach((p,i)=>i===0?oCtx.moveTo(p.x,p.y):oCtx.lineTo(p.x,p.y));
    oCtx.closePath();oCtx.stroke();
  }
  else if(lasso.originalBuffer){
    const {x,y}=lasso.pos,{width:w,height:h}=lasso.transform;
    const cx=Math.round(x+w/2),cy=Math.round(y+h/2);
    oCtx.translate(cx,cy);oCtx.rotate(lasso.rotation);
    oCtx.drawImage(lasso.originalBuffer,-Math.round(w/2),-Math.round(h/2),Math.round(w),Math.round(h));
    oCtx.strokeStyle="blue";oCtx.strokeRect(-w/2,-h/2,w,h);
    oCtx.strokeStyle="black";oCtx.lineDashOffset+=5;oCtx.strokeRect(-w/2,-h/2,w,h);
    const {x:ox,y:oy,w:ow,h:oh}=lasso.origBounds;const scaleX=w/ow,scaleY=h/oh;
    oCtx.strokeStyle="blue";oCtx.beginPath();
    lasso.points.forEach((p,i)=>{
      const sx=(p.x-ox)*scaleX-w/2,sy=(p.y-oy)*scaleY-h/2;
      i===0?oCtx.moveTo(sx,sy):oCtx.lineTo(sx,sy);
    });
    oCtx.closePath();oCtx.stroke();
    // handles
    oCtx.setLineDash([]);oCtx.fillStyle="white";oCtx.strokeStyle="black";const hs=lasso.handleSize;
    [{px:-w/2,py:-h/2},{px:0,py:-h/2},{px:w/2,py:-h/2},{px:-w/2,py:0},{px:w/2,py:0},
     {px:-w/2,py:h/2},{px:0,py:h/2},{px:w/2,py:h/2}]
      .forEach(p=>{oCtx.fillRect(p.px-hs/2,p.py-hs/2,hs,hs);oCtx.strokeRect(p.px-hs/2,p.py-hs/2,hs,hs);});
    // rotation handle
    oCtx.beginPath();oCtx.arc(0,-h/2-30,hs/2,0,Math.PI*2);
    oCtx.fillStyle="white";oCtx.fill();oCtx.strokeStyle="black";oCtx.stroke();
  }
  oCtx.restore();requestAnimationFrame(drawLassoUI);
}
drawLassoUI();

// Keyboard & Pointer
window.addEventListener('keydown', e=>{
  if(e.target.tagName!=='INPUT'){
    const key = e.key.toLowerCase();

    // Toggle lasso tool with "L"
    if(key==='v'){
      activeTool==="ToolLasso" ? (commitLasso(), switchTool("ToolBrush")) : switchTool("ToolLasso");
    }

    // Mirror horizontally with "M"
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

    // Mirror vertically with "Shift+M"
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
	  activeCanvasCtx.drawImage(
		lasso.originalBuffer,
		-Math.round(lasso.transform.width / 2),
		-Math.round(lasso.transform.height / 2),
		Math.round(lasso.transform.width),
		Math.round(lasso.transform.height)
	  );
	  activeCanvasCtx.restore();

	  // Reset lasso state after erasing
	  lasso.originalBuffer = null;
	  lasso.transform = null;
	  lasso.origBounds = null;
	  lasso.rotation = 0;

	  if(activeDrawing) activeDrawing.data = activeCanvas.toDataURL();
	}

  }
});


activeCanvas.addEventListener('pointerdown',e=>{
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

activeCanvas.addEventListener('pointermove',e=>{
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

activeCanvas.addEventListener('pointerup',e=>{
  if(activeTool==="ToolLasso"){
    lasso.rotating=false;
    handleLasso(e,'up');
  }
});
