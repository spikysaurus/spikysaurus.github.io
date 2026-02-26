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

function resizeCanvases(w, h, anchor) {
  const oldW = activeCanvas.width;
  const oldH = activeCanvas.height;

  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    const ctx = canvas.getContext('2d');

    // Backup current content
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = oldW;
    tempCanvas.height = oldH;
    tempCanvas.getContext('2d').drawImage(canvas, 0, 0);

    // Resize (clears canvas)
    canvas.width = w;
    canvas.height = h;

    let offsetX = 0;
    let offsetY = 0;

    // Anchor logic
    switch (anchor) {
      case 'tr': // anchor bottom-left
        offsetX = 0;
        offsetY = h - oldH;
        break;
      case 'tl': // anchor bottom-right
        offsetX = w - oldW;
        offsetY = h - oldH;
        break;
      case 'br': // anchor top-left
        offsetX = 0;
        offsetY = 0;
        break;
      case 'bl': // anchor top-right
        offsetX = w - oldW;
        offsetY = 0;
        break;
      default: // fallback to center
        offsetX = (w - oldW) / 2;
        offsetY = (h - oldH) / 2;
    }

    ctx.drawImage(tempCanvas, offsetX, offsetY);
  }

  const container = document.getElementById("canvasContainer");
  if (container) {
    container.style.setProperty('--canvas-width', `${w}px`);
    container.style.setProperty('--canvas-height', `${h}px`);
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
  if (e.ctrlKey && e.code === "Space") {
    e.preventDefault();
    previousTool = activeTool;
    switchTool("ToolZoom", true);
  } 
  else if (e.code === "Space") {
    e.preventDefault();
    previousTool = activeTool;
    switchTool("ToolPan", true);
  } 
  else if (e.ctrlKey) {
    if (activeTool === "ToolBrush") {
      previousTool = activeTool;
      switchTool("ToolEraser", true);
    } else if (activeTool === "ToolLassoFill") {
      previousTool = activeTool;
      switchToLasso(true, true);
    }
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
  
  if (e.key.toLowerCase() === "a") {
    brush_aliasing = !brush_aliasing;
    
    const aliasingToggle = document.getElementById('aliasingToggle');
    if (aliasingToggle) aliasingToggle.checked = brush_aliasing;
    updateAliasingLabel();
  }
  
  if (e.key.toLowerCase() === "b") {
    e.preventDefault(); // Prevent browser "Bold" or search shortcuts
    drawBehind = !drawBehind;
    drawBehindLabel.textContent = drawBehind ? "true" : "false";
  }

  // Toggle Rendering Shortcut (Key: 'R')
  if (e.key.toLowerCase() === 'r') {
    for (let i = 0; i < canvases.length; i++) {
      canvases[i].classList.toggle('pixelated-rendering');
    }
    pixelatedCanvas = !pixelatedCanvas;
    imageRenderingLabel.textContent = pixelatedCanvas ? true : false;
  }

  // New: D → switch to Lasso Fill tool
  if (e.key.toLowerCase() === "d") {
    switchTool("ToolLassoFill");
  }
});

document.addEventListener("keyup", e => {
  // Switch back when Control is released
  if (e.key === "Control") {
    if (activeTool === "ToolEraser") {
      switchTool("ToolBrush"); // restore brush
    } else if (activeTool === "ToolLassoErase") {
      switchTool("ToolLassoFill"); // restore lasso fill
    }
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

//STRAIGHT LINE FOR BRUSH using SHIFT
let isShiftDown = false;
let shiftStartX = null, shiftStartY = null; // Track the anchor point for Shift

window.addEventListener("keydown", e => { 
  if (e.key === "Shift" && !isShiftDown) {
    isShiftDown = true;
    // Lock the start point to the last known mouse position when Shift is first pressed
    shiftStartX = lastX; 
    shiftStartY = lastY;
  }
});

window.addEventListener("keyup", e => { 
  if (e.key === "Shift") {
    isShiftDown = false;
    shiftStartX = null;
    shiftStartY = null;
  }
});

window.addEventListener("pointermove", e => {
  if (!isDrawing) return;
  const pos = getMousePos(e);

  if (isShiftDown) {
    // 1. Calculate the start point: Use the locked Shift anchor, 
    // or fall back to the very first point of the current stroke.
    const x0 = shiftStartX ?? (strokePoints.length ? strokePoints[0][0] : pos.x);
    const y0 = shiftStartY ?? (strokePoints.length ? strokePoints[0][1] : pos.y);

    if (activeTool === "ToolBrush") {
      // Note: For a "preview" effect, you would typically clear a temp canvas here.
      line(x0, y0, pos.x, pos.y, brush_size, window.colorPicker.activeColor, brush_opacity);
    } else if (activeTool === "ToolEraser") {
      activeCanvasCtx.save();
      activeCanvasCtx.globalCompositeOperation = "destination-out";
      line(x0, y0, pos.x, pos.y, eraser_size, "#000", 1);
      activeCanvasCtx.restore();
    }
  } else {
    // 2. Standard Freehand drawing (connecting last segment)
    const [xPrev, yPrev] = strokePoints.length ? strokePoints[strokePoints.length - 1] : [pos.x, pos.y];
    
    if (activeTool === "ToolBrush") {
      line(xPrev, yPrev, pos.x, pos.y, brush_size, window.colorPicker.activeColor, brush_opacity);
    } else if (activeTool === "ToolEraser") {
      activeCanvasCtx.clearRect(pos.x - eraser_size/2, pos.y - eraser_size/2, eraser_size, eraser_size);
    }
  }

  strokePoints.push([pos.x, pos.y]);
  lastX = pos.x; 
  lastY = pos.y;
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


