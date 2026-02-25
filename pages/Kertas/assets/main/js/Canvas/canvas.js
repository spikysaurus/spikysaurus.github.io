// 1. CONSTANTS & INITIALIZATION
const canvasWidthInput = document.getElementById('canvasWidthInput');
const canvasHeightInput = document.getElementById('canvasHeightInput');
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const activeCanvas = document.getElementById('canvas');
const activeCanvasCtx = activeCanvas.getContext('2d');
const backdropCanvas = document.getElementById('backdropCanvas');
const backdropCanvasCtx = backdropCanvas.getContext('2d');
const backgroundColorCanvas = document.getElementById('backgroundColorCanvas');

const container = document.getElementById("canvasContainer");
// Live collection: automatically includes dynamic track-layers from the bridge
const canvases = document.getElementsByClassName("canvases");

// Set internal resolution for all core canvases
[activeCanvas, backdropCanvas, backgroundColorCanvas].forEach(c => {
  if (c) {
    c.width = CANVAS_WIDTH;
    c.height = CANVAS_HEIGHT;
  }
});

function resizeCanvases(w = CANVAS_WIDTH, h = CANVAS_HEIGHT) {
  // 1. Loop through all canvases to preserve content
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    const ctx = canvas.getContext('2d');

    // Create a temporary "backup" canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Copy current drawing to backup
    tempCtx.drawImage(canvas, 0, 0);

    // 2. Resize the actual canvas (This clears it)
    canvas.width = w;
    canvas.height = h;

    // 3. Draw the backup back (stays at top-left 0,0)
    ctx.drawImage(tempCanvas, 0, 0);
  }

  // 4. Update CSS and Metadata
  const container = document.getElementById("canvasContainer");
  if (container) {
    container.style.setProperty('--canvas-width', `${w}px`);
    container.style.setProperty('--canvas-height', `${h}px`);
  }

  if (activeDrawing) {
    activeDrawing.width = w;
    activeDrawing.height = h;
    // Update the data string so future pointerup events don't save a blank canvas
    activeDrawing.data = activeCanvas.toDataURL("image/png");
  }
}


const canvasResizeBtn = document.getElementById('canvasResizeBtn');
canvasResizeBtn.addEventListener("click", (e) => {
resizeCanvases(canvasWidthInput.value, canvasHeightInput.value);
});

const canvasRefreshBtn = document.getElementById('canvasRefreshBtn');
canvasRefreshBtn.addEventListener("click", (e) => {
	canvasRefreshInputValues()
});

function canvasRefreshInputValues(){
	canvasWidthInput.value = activeCanvas.width;
	canvasHeightInput.value = activeCanvas.height;
	}

let lastX = null, lastY = null;
let levels = {}, levelCount = 0, activeLevel = null, activeDrawing = null, activeDrawingIndex = -1, backdropData = null;


let activeTool = "ToolBrush"; 
let previousTool = "ToolBrush";
let isDrawing = false;
let isDragging = false; 
let brush_size = 1;
let eraser_size = 15;
let brush_opacity = 1;
let brush_aliasing = true;
let drawBehind; 

//--- Asset Sync ---
// Updates the active drawing on #canvas and triggers the merged layer bridge
function setactiveDrawing(c) {
  const img = new Image();
  img.onload = () => {
    // Clear the active drawing layer only
    activeCanvasCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    activeCanvasCtx.drawImage(img, 0, 0);
    
    // Sync the background/foreground track layers (the merged view)
    if (window.xsheetCanvasBridge) {
        window.xsheetCanvasBridge.syncCanvasStack();
    }
  };
  img.src = c.data;
  activeDrawing = c;
  
  if (typeof activeLevel !== 'undefined' && levels[activeLevel]) {
    activeDrawingIndex = levels[activeLevel].indexOf(c);
  }

  const label = document.getElementById('activeDrawingLabel');
  if (label) label.textContent = `Active Drawing: ${c.name.replace(/\.png$/, "")}`;
  
  activeCanvas.style.cursor = "crosshair";
  
  // Update sidebar UI highlights
  document.querySelectorAll('.drawing input').forEach(el => el.classList.remove('active'));
  const list = document.querySelector(`[data-label="${activeLevel}"] .drawing-list`);
  if (list) {
    list.querySelectorAll('.drawing').forEach(div => {
      const input = div.querySelector('input');
      if (input.value.trim() === c.name.replace(/\.png$/, "")) input.classList.add('active');
    });
  }
}

// --- Drawing Functions ---
function circ(x, y, s, c, a) {
activeCanvasCtx.globalCompositeOperation = drawBehind ? "destination-over" : "source-over";
  activeCanvasCtx.globalAlpha = a;
  activeCanvasCtx.fillStyle = c;
  if (brush_aliasing) {
    const size = Math.round(s);
    activeCanvasCtx.fillRect(Math.floor(x - size / 2), Math.floor(y - size / 2), size, size);
  } else {
    activeCanvasCtx.beginPath();
    activeCanvasCtx.arc(x, y, s / 2, 0, Math.PI * 2);
    activeCanvasCtx.fill();
  }
  activeCanvasCtx.globalAlpha = 1;
}

function line(x0, y0, x1, y1, s, c, a) {
//activeCanvasCtx.globalCompositeOperation = drawBehind ? "destination-over" : "source-over";
  activeCanvasCtx.globalAlpha = a;
  activeCanvasCtx.fillStyle = c;
  if (brush_aliasing) {
    const dx = x1 - x0, dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.ceil(dist / (s * 0.5))); 
    const size = Math.round(s);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x0 + dx * t), y = Math.round(y0 + dy * t);
      activeCanvasCtx.fillRect(Math.floor(x - size / 2), Math.floor(y - size / 2), size, size);
    }
  } else {
    activeCanvasCtx.strokeStyle = c;
    activeCanvasCtx.lineWidth = s;
    activeCanvasCtx.lineCap = "round";
    activeCanvasCtx.beginPath();
    activeCanvasCtx.moveTo(x0, y0);
    activeCanvasCtx.lineTo(x1, y1);
    activeCanvasCtx.stroke();
  }
  activeCanvasCtx.globalAlpha = 1;
}

let strokePoints = [];

function switchTool(tool, temporary = false) {
  if (tool !== activeTool) {
    if (!temporary) previousTool = tool;
    activeTool = tool;
    isDrawing = false;
    isDragging = false;
    strokePoints = [];
  }
}

/// --- 1. GLOBAL STATE ---
let currentScale, currentTop, currentLeft;
let startX, startY, startTop, startLeft, startScale;

// Flip State: 1 is normal, -1 is mirrored
let flipH = 1;
let flipV = 1;

/**
 * --- 2. INITIALIZATION & TRANSFORMS ---
 */
function initializeTransformState() {
  if (!activeCanvas) return;
  const rect = activeCanvas.getBoundingClientRect();
  const parentRect = container.getBoundingClientRect();
  currentTop = rect.top - parentRect.top + rect.height / 2;
  currentLeft = rect.left - parentRect.left + rect.width / 2;
  const style = window.getComputedStyle(activeCanvas);
  const matrix = new WebKitCSSMatrix(style.transform);
  currentScale = Math.abs(matrix.a) || 1; 
}

initializeTransformState();

function applyTransforms() {
	const isFlipped = flipH === -1 || flipV === -1;
  for (let i = 0; i < canvases.length; i++) {
    canvases[i].style.top = `${currentTop}px`;
    canvases[i].style.left = `${currentLeft}px`;
    const scaleX = currentScale * flipH;
    const scaleY = currentScale * flipV;
    canvases[i].style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
    if (isFlipped) {
      canvases[i].style.outline = "4px solid #adadad";
      //~ canvases[i].style.outlineOffset = "2px"; 
    } else {
      canvases[i].style.outline = "none";
    }
  }
}

function resetTransform() {
  const parentRect = container.getBoundingClientRect();
  currentScale = 1;
  flipH = 1;
  flipV = 1;
  currentLeft = parentRect.width / 2;
  currentTop = parentRect.height / 2;
  applyTransforms();
}

//~ function getMousePos(e) {
	
  //~ const rect = activeCanvas.getBoundingClientRect();
  
  //~ // 1. Get raw distance from the top-left of the BOUNDING BOX
  //~ let mouseX = e.clientX - rect.left;
  //~ let mouseY = e.clientY - rect.top;

  //~ // 2. If flipped, we need to measure from the opposite edge of the box
  //~ if (flipH === -1) {
    //~ mouseX = rect.width - mouseX;
  //~ }
  //~ if (flipV === -1) {
    //~ mouseY = rect.height - mouseY;
  //~ }

  //~ // 3. Scale coordinates based on internal resolution vs display size
  //~ const scaleX = activeCanvas.width / rect.width;
  //~ const scaleY = activeCanvas.height / rect.height;

  //~ return {
    //~ x: mouseX * scaleX,
    //~ y: mouseY * scaleY
  //~ };
//~ }
function getMousePos(e) {
    const rect = activeCanvas.getBoundingClientRect();
    
    // 1. Get position relative to the VISUAL box (this includes CSS zoom)
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    // 2. Scale coordinates based on internal resolution vs display size
    // This ratio AUTOMATICALLY handles CSS zoom because rect.width 
    // grows/shrinks when you zoom, but activeCanvas.width does not.
    const scaleX = activeCanvas.width / rect.width;
    const scaleY = activeCanvas.height / rect.height;

    // Apply the scale first to get into "Internal Pixel Space"
    let x = mouseX * scaleX;
    let y = mouseY * scaleY;

    // 3. Handle Flipping in "Internal Pixel Space"
    // We use activeCanvas.width because we are now in the internal coordinate system
    if (flipH === -1) {
        x = activeCanvas.width - x;
    }
    if (flipV === -1) {
        y = activeCanvas.height - y;
    }

    return { x, y };
}



window.addEventListener("pointerdown", e => {
  const isBrushOrEraser = activeTool === "ToolBrush" || activeTool === "ToolEraser";
  
  if (isBrushOrEraser && activeDrawing) {
    isDrawing = true;
    const pos = getMousePos(e); 
    lastX = pos.x; 
    lastY = pos.y;
    
    const rect = activeCanvas.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && 
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
        
      if (activeTool === "ToolBrush") {
        circ(lastX, lastY, brush_size, window.colorPicker.activeColor, brush_opacity);
      } else if (activeTool === "ToolEraser") {
        activeCanvasCtx.clearRect(lastX - eraser_size/2, lastY - eraser_size/2, eraser_size, eraser_size);
      }
      strokePoints.push([lastX, lastY, lastX, lastY]);
    }
  }
});

window.addEventListener("pointermove", e => {
  const isBrushOrEraser = activeTool === "ToolBrush" || activeTool === "ToolEraser";
  const isOverCanvas = canvasContainer.contains(e.target);

  if (isBrushOrEraser && isOverCanvas) {
    brushCursor.style.display = "block";
    brushCursor.style.left = `${e.clientX}px`;
    brushCursor.style.top = `${e.clientY}px`;
    if (typeof updateCursorSize === 'function') updateCursorSize();
  } else {
    brushCursor.style.display = "none";
  }

  if (isDrawing && activeDrawing) {
    const pos = getMousePos(e);
    strokePoints.push([lastX, lastY, pos.x, pos.y]);
    lastX = pos.x; 
    lastY = pos.y;
  }

  // Pan/Zoom Handling
  if (isDragging) {
    if (activeTool === "ToolPan") {
      currentLeft = startLeft + (e.clientX - startX);
      currentTop = startTop + (e.clientY - startY);
    } 
    else if (activeTool === "ToolZoom") {
      const dy = e.clientY - startY;
      currentScale = Math.max(0.1, startScale - dy * 0.01);
    }
    applyTransforms();
  }
});

document.addEventListener("mousedown", e => {
  if (activeTool === "ToolPan" || activeTool === "ToolZoom") {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startTop = currentTop;
    startLeft = currentLeft;
    startScale = currentScale;
    e.preventDefault();
  }
});

window.addEventListener("pointerup", () => {
  if (isDrawing && activeDrawing) {
    isDrawing = false;
    activeDrawing.data = activeCanvas.toDataURL("image/png");
  }
  isDragging = false;
});

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  // "/" (slash) for Flip Horizontal
  if (e.key === "/") {
    e.preventDefault(); // Prevent browser search shortcut
    flipH *= -1;
    applyTransforms();
  } 
  // "?" (Shift + slash) for Flip Vertical
  else if (e.key === "?") {
    e.preventDefault();
    flipV *= -1;
    applyTransforms();
  } 
  // "0" to Reset View
  else if (e.key === "0") {
    resetTransform();
  }
});

function renderStrokes() {
  if (strokePoints.length > 0) {
    for (const [x0, y0, x1, y1] of strokePoints) {
      if (activeTool === "ToolBrush") {
        activeCanvasCtx.globalCompositeOperation = drawBehind ? "destination-over" : "source-over";
        line(x0, y0, x1, y1, brush_size, window.colorPicker.activeColor, brush_opacity);
        activeCanvasCtx.globalCompositeOperation = "source-over";
      } 
      else if (activeTool === "ToolEraser") {
        activeCanvasCtx.globalCompositeOperation = "destination-out";
        line(x0, y0, x1, y1, eraser_size, "rgba(0,0,0,1)", 1);
        activeCanvasCtx.globalCompositeOperation = "source-over";
      }
    }
    strokePoints = [];
  }
  requestAnimationFrame(renderStrokes);
}

requestAnimationFrame(renderStrokes);

// --- Shortcuts & Utility ---
const drawBehindLabel = document.getElementById("drawBehindLabel");
const imageRenderingLabel = document.getElementById("imageRenderingLabel");
pixelatedCanvas = false;
// Initial opacity (range 0 to 1)
let currentBackdropOpacity = 1;

document.addEventListener("keydown", e => {
	const isEditing = isUserEditing(e);
	if (isEditing) return;
  // Temporarily tool switching
  if (e.code === "Space") {
    e.preventDefault(); // Prevent page scroll
    switchTool("ToolPan", true);
  }
  else if (e.key.toLowerCase() === "z") {
    switchTool("ToolZoom", true);
  } 
  else if (e.ctrlKey) {
    switchTool("ToolEraser", true);
  }
  
  // Update Brush and Eraser Size Shortcuts
  if (e.key === "[" || e.key === "]") {
    updateCursorSize();
    if (e.ctrlKey || e.metaKey) e.preventDefault();

    if (e.key === "[") {
      if (activeTool === "ToolBrush") { brush_size = Math.max(1, brush_size - 1); updateBrushSizeLabel(); }
      else if (activeTool === "ToolEraser") { eraser_size = Math.max(1, eraser_size - 1); updateEraserSizeLabel(); }
    } else {
      if (activeTool === "ToolBrush") { brush_size += 1; updateBrushSizeLabel(); }
      else if (activeTool === "ToolEraser") { eraser_size += 1; updateEraserSizeLabel(); }
    }
  }

  // Permanent tool Switch shortcuts
	if (e.key.toLowerCase() === "e") {
		switchTool("ToolEraser");
	} 
  
  if (e.key.toLowerCase() === "w") {
    switchTool("ToolBrush");
  } 
  
  if (event.key.toLowerCase() === "a") {
    brush_aliasing = !brush_aliasing;
    
    const aliasingToggle = document.getElementById('aliasingToggle');
    if (aliasingToggle) aliasingToggle.checked = brush_aliasing;
    updateAliasingLabel();
  }
  

  if (event.key.toLowerCase() === "b") {
    event.preventDefault(); // Prevent browser "Bold" or search shortcuts
    drawBehind = !drawBehind;
    // Update the label text
    drawBehindLabel.textContent = drawBehind ? "true" : "false";
  }

  // Toggle Rendering Shortcut (Key: 'R')
  if (e.key.toLowerCase() === 'r') {
    // Loop through the live collection of canvases
    for (let i = 0; i < canvases.length; i++) {
      canvases[i].classList.toggle('pixelated-rendering');
    }
    pixelatedCanvas = !pixelatedCanvas;
    if (pixelatedCanvas){imageRenderingLabel.textContent = true}
	else{imageRenderingLabel.textContent = false}
  }
  
});


window.addEventListener('keydown', (e) => {
const isEditing = isUserEditing(e);
	if (isEditing) return;
  // Increase opacity by 10% 
  if (e.key === '}') {
    currentBackdropOpacity = Math.min(1, currentBackdropOpacity + 0.1);
    backdropCanvas.style.opacity = currentBackdropOpacity;
  } 
  // Decrease opacity by 10%
  else if (e.key === '{') {
    currentBackdropOpacity = Math.max(0, currentBackdropOpacity - 0.1);
    backdropCanvas.style.opacity = currentBackdropOpacity;
  } 
  // Reset opacity to 100%
  else if (e.key === '\\') {
    currentBackdropOpacity = 1;
    backdropCanvas.style.opacity = currentBackdropOpacity;
  }
  // opacity 0%
  else if (e.key === '|') {
    currentBackdropOpacity = 0;
    backdropCanvas.style.opacity = currentBackdropOpacity;
  }
});
document.addEventListener("keyup", e => {
  // 2. Switch back to Brush ONLY if Control is released 
  // and we are currently using the Eraser
  if (e.key === "Control" && activeTool === "ToolEraser") {
    switchTool("ToolBrush");
  }

  // Your existing space/zoom logic
  if (e.code === "Space" && activeTool === "ToolPan") {
    switchTool("ToolBrush");
  }
  if (e.key.toLowerCase() === "z" && activeTool === "ToolZoom") {
    switchTool("ToolBrush");
  }
});

const brushCursor = document.getElementById('brushCursor');

function updateCursorSize() {
  if (!brushCursor) return;
  
  // Calculate size based on current tool and zoom scale
  // Note: startScale is your current zoom level
  const size = (activeTool === "ToolEraser" ? eraser_size : brush_size) * startScale;
  
  brushCursor.style.width = `${size}px`;
  brushCursor.style.height = `${size}px`;
  
  // Change shape for Aliased (Pixel) vs Smooth (Circle)
  brushCursor.style.borderRadius = brush_aliasing ? "0" : "50%";
}

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
    if(key==='l'){
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



function updateBrushSizeLabel() { const l = document.getElementById("brushSizeLabel"); if (l) l.textContent = brush_size; }
function updateEraserSizeLabel() { const l = document.getElementById("eraserSizeLabel"); if (l) l.textContent = eraser_size; }
function updateAliasingLabel() { const l = document.getElementById("aliasingLabel"); if (l) l.textContent = brush_aliasing; }

document.addEventListener("DOMContentLoaded", () => {
  updateBrushSizeLabel();
  drawBehindLabel.textContent = "false";
  updateEraserSizeLabel();
  updateAliasingLabel();
  imageRenderingLabel.textContent = "false";
  
});


