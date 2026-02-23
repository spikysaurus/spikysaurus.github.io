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
  // 1. Update internal resolution for all layers (including dynamic ones)
  for (let i = 0; i < canvases.length; i++) {
    canvases[i].width = w;
    canvases[i].height = h;
  }

  // 2. Update the container's CSS variables to resize the scrollable area
  // This ensures the ::before spacer (from the previous step) triggers scrollbars
  const container = document.getElementById("canvasContainer");
  if (container) {
    container.style.setProperty('--canvas-width', `${w}px`);
    container.style.setProperty('--canvas-height', `${h}px`);
  }

  // 3. Update active drawing metadata if it exists
  if (activeDrawing) {
    activeDrawing.width = w;
    activeDrawing.height = h;
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

// Add this helper function to canvas.js
function getMousePos(e) {
  const rect = activeCanvas.getBoundingClientRect();
  
  // Calculate position relative to canvas top-left
  let mouseX = e.clientX - rect.left;
  let mouseY = e.clientY - rect.top;

  // Scale coordinates based on internal resolution vs display size
  const scaleX = activeCanvas.width / rect.width;
  const scaleY = activeCanvas.height / rect.height;

  return {
    x: mouseX * scaleX,
    y: mouseY * scaleY
  };
}


// Keep this on the canvas to START the stroke
activeCanvas.onpointerdown = e => {
  if ((activeTool === "ToolBrush" || activeTool === "ToolEraser") && activeDrawing) {
    isDrawing = true;
    const pos = getMousePos(e); // Use the helper from previous step
    lastX = pos.x; 
    lastY = pos.y;
    
    if (activeTool === "ToolBrush") circ(lastX, lastY, brush_size, window.colorPicker.activeColor, brush_opacity);
    else if (activeTool === "ToolEraser") activeCanvasCtx.clearRect(lastX - eraser_size/2, lastY - eraser_size/2, eraser_size, eraser_size);
    
    strokePoints.push([lastX, lastY, lastX, lastY]);
  }
};

// MOVE THIS TO WINDOW so it tracks even if the mouse leaves the canvas area
window.addEventListener("pointermove", e => {
if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
  // Check if the mouse is currently over the container
  const isOverCanvas = canvasContainer.contains(e.target);
  const isBrushOrEraser = activeTool === "ToolBrush" || activeTool === "ToolEraser";

  // 1. Move and Toggle the Visual Cursor
  if (isBrushOrEraser && isOverCanvas) {
    brushCursor.style.display = "block";
    brushCursor.style.left = `${e.clientX}px`;
    brushCursor.style.top = `${e.clientY}px`;
    updateCursorSize();
  } else {
    brushCursor.style.display = "none";
  }

  // 2. Existing Drawing Logic (remains window-bound for "edge" drawing)
  if (isDrawing && activeDrawing) {
    const pos = getMousePos(e);
    strokePoints.push([lastX, lastY, pos.x, pos.y]);
    lastX = pos.x; 
    lastY = pos.y;
  }
}
  
});

// Hide cursor when leaving window
window.addEventListener("pointerout", (e) => {
  if (!e.relatedTarget) brushCursor.style.display = "none";
});



activeCanvas.onpointerup = () => {
  if (isDrawing && activeDrawing) {
    isDrawing = false;
    // Save state back to the object
    activeDrawing.data = activeCanvas.toDataURL("image/png");
  }
};



function renderStrokes() {
  if (strokePoints.length > 0) {
    for (const [x0, y0, x1, y1] of strokePoints) {
      if (activeTool === "ToolBrush") {
        // Set mode: 'destination-over' draws new pixels behind existing ones
        activeCanvasCtx.globalCompositeOperation = drawBehind ? "destination-over" : "source-over";
        
        line(x0, y0, x1, y1, brush_size, window.colorPicker.activeColor, brush_opacity);
        
        // Reset to default
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

const drawBehindLabel = document.getElementById("drawBehindLabel");
window.addEventListener("keydown", (event) => {
  // Check if user is typing in a text field to avoid accidental toggling
  const isTyping = event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA";

  if (!isTyping && event.key.toLowerCase() === "b") {
    event.preventDefault(); // Stop browser defaults (like "Bold" shortcuts)
    drawBehind = !drawBehind;
    if(drawBehind){
		drawBehindLabel.textContent = "true";
		}
	else{
		drawBehindLabel.textContent = "false";
		}
    
  }
});


/// --- 1. GLOBAL STATE (Leave these uninitialized or at 0) ---
let currentScale, currentTop, currentLeft;
let startX, startY, startTop, startLeft, startScale;

/**
 * --- 2. THE FIX: SYNC ON LOAD ---
 * Run this immediately to "catch" the CSS values from the browser.
 */
function initializeTransformState() {
  const rect = activeCanvas.getBoundingClientRect();
  const parentRect = container.getBoundingClientRect();
  
  // Calculate the current center-point position in pixels
  currentTop = rect.top - parentRect.top + rect.height / 2;
  currentLeft = rect.left - parentRect.left + rect.width / 2;

  // Get the current scale from the CSS transform matrix
  const style = window.getComputedStyle(activeCanvas);
  const matrix = new WebKitCSSMatrix(style.transform);
  currentScale = matrix.a || 1; // 'a' is the horizontal scale (m11)
}

// IMPORTANT: Run this once before any interaction
initializeTransformState();

// --- 3. UPDATED EVENT LISTENERS ---

document.addEventListener("mousedown", e => {
  if (activeTool === "ToolPan" || activeTool === "ToolZoom") {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Always snap the "starting point" to the LAST KNOWN global state
    startTop = currentTop;
    startLeft = currentLeft;
    startScale = currentScale;
    
    e.preventDefault();
  }
});

document.addEventListener("mousemove", e => {
  if (!isDragging) return;

  if (activeTool === "ToolPan") {
    // Math: [New Position] = [Last Position] + [Mouse Distance Moved]
    currentLeft = startLeft + (e.clientX - startX);
    currentTop = startTop + (e.clientY - startY);
  } 
  else if (activeTool === "ToolZoom") {
    const dy = e.clientY - startY;
    // Math: [New Scale] = [Last Scale] - [Vertical Mouse Movement]
    currentScale = Math.max(0.1, startScale - dy * 0.01);
  }

  applyTransforms();
});

document.addEventListener("mouseup", () => isDragging = false);


function applyTransforms() {
  for (let i = 0; i < canvases.length; i++) {
    // 1. Set position via top/left
    canvases[i].style.top = `${currentTop}px`;
    canvases[i].style.left = `${currentLeft}px`;
    
    // 2. Set scale via transform (keep translate(-50%, -50%) for centering)
    canvases[i].style.transform = `translate(-50%, -50%) scale(${currentScale})`;
  };
}


// GLOBAL UP: Safety net for both Drawing and Dragging
document.addEventListener("mouseup", () => {
  // 1. Stop Drawing if active
  if (isDrawing && activeDrawing) {
    isDrawing = false;
    activeDrawing.data = activeCanvas.toDataURL("image/png");
  }

  // 2. Stop Dragging (Pan/Zoom)
  if (isDragging) {
    isDragging = false;
    if (activeTool === "ToolZoom" && canvases.length > 0) {
      const transform = activeCanvas.style.transform;
      const match = transform.match(/scale\(([^)]+)\)/);
      if (match) startScale = parseFloat(match[1]);
    }
    // Optional: revert to brush after pan/zoom session
    switchTool("ToolBrush"); 
  }
});


// --- Shortcuts & Utility ---
document.addEventListener("keydown", e => {
  // 1. Updated tool switching
  // Use Space for Pan
  if (e.code === "Space") {
    e.preventDefault(); // Prevent page scroll
    switchTool("ToolPan", true);
  } 
  // Use Z for Zoom
  else if (e.key.toLowerCase() === "z") {
    switchTool("ToolZoom", true);
  } 
  // Keep Ctrl for Eraser
  else if (e.ctrlKey) {
    switchTool("ToolEraser", true);
    updateActiveToolLabel();
  }
	
  // 2. Prevent default and handle [ ] Brackets
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

  // 3. Brush Aliasing Toggle (Shortcut "a")
  if (e.key.toLowerCase() === 'a' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    brush_aliasing = !brush_aliasing;
    
    const aliasingToggle = document.getElementById('aliasingToggle');
    if (aliasingToggle) aliasingToggle.checked = brush_aliasing;
    updateAliasingLabel();
  }
});


document.addEventListener("keyup", e => {
  // Switch back to Brush when the specific keys are released
  if (e.code === "Space" && activeTool === "ToolPan") {
    switchTool("ToolBrush");
  }
  if (e.key.toLowerCase() === "z" && activeTool === "ToolZoom") {
    switchTool("ToolBrush");
  }
  if (!e.ctrlKey && activeTool === "ToolEraser") {
    switchTool("ToolBrush");
    updateActiveToolLabel();
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


pixelatedCanvas = false;
const imageRenderingLabel = document.getElementById("imageRenderingLabel");
document.addEventListener("keydown", e => {
  // Toggle Rendering Shortcut (Key: 'R')
  if (e.key.toLowerCase() === 'r' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    // Loop through the live collection of canvases
    for (let i = 0; i < canvases.length; i++) {
      canvases[i].classList.toggle('pixelated-rendering');
    }
    pixelatedCanvas = !pixelatedCanvas;
    if (pixelatedCanvas){imageRenderingLabel.textContent = true}
	else{imageRenderingLabel.textContent = false}
  }
});

// Initial opacity (range 0 to 1)
let currentBackdropOpacity = 1;

window.addEventListener('keydown', (event) => {
  // Increase opacity by 10% 
  if (event.key === '}') {
    currentBackdropOpacity = Math.min(1, currentBackdropOpacity + 0.1);
    backdropCanvas.style.opacity = currentBackdropOpacity;
  } 
  // Decrease opacity by 10%
  else if (event.key === '{') {
    currentBackdropOpacity = Math.max(0, currentBackdropOpacity - 0.1);
    backdropCanvas.style.opacity = currentBackdropOpacity;
  } 
  // Reset opacity to 100%
  else if (event.key === '\\') {
    currentBackdropOpacity = 1;
    backdropCanvas.style.opacity = currentBackdropOpacity;
  }
  // opacity 0%
  else if (event.key === '|') {
    currentBackdropOpacity = 0;
    backdropCanvas.style.opacity = currentBackdropOpacity;
  }
});


function updateActiveToolLabel() { const l = document.getElementById("activeToolLabel"); if (l) l.textContent = activeTool; }
function updateBrushSizeLabel() { const l = document.getElementById("brushSizeLabel"); if (l) l.textContent = brush_size; }
function updateEraserSizeLabel() { const l = document.getElementById("eraserSizeLabel"); if (l) l.textContent = eraser_size; }
function updateAliasingLabel() { const l = document.getElementById("aliasingLabel"); if (l) l.textContent = brush_aliasing; }

document.addEventListener("DOMContentLoaded", () => {
  updateActiveToolLabel();
  updateBrushSizeLabel();
  drawBehindLabel.textContent = "false";
  updateEraserSizeLabel();
  updateAliasingLabel();
  imageRenderingLabel.textContent = "false";
});

