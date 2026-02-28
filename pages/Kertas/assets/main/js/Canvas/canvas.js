// 1. CONSTANTS & INITIALIZATION
const canvasWidthInput = document.getElementById('canvasWidthInput');
const canvasHeightInput = document.getElementById('canvasHeightInput');
const CANVAS_WIDTH = 2340;
const CANVAS_HEIGHT = 1654;

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

let currentScale, currentTop, currentLeft;
let startX, startY, startTop, startLeft, startScale;

// Flip State: 1 is normal, -1 is mirrored
let flipH = 1;
let flipV = 1;

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








