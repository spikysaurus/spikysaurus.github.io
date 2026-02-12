ShowOverlay = false;
navButton.onclick = () => {
	ShowOverlay = !ShowOverlay;
	if (ShowOverlay){
	navOverlays.style.display = "flex";
	}
	else{
	navOverlays.style.display = "none";
	}
	
};

// Pan overlay drag
let panDragging = false, panStartX = 0, panStartY = 0, panInitX = 0, panInitY = 0;
const panOverlay = document.getElementById("panOverlay");

panOverlay.addEventListener("pointerdown", e => {
  panDragging = true;
  psx = e.clientX - targetPx;
  psy = e.clientY - targetPy;
  document.body.style.cursor = 'grab';
});

panOverlay.addEventListener("pointermove", e => {
  if (!panDragging) return;
	if (e.buttons !== 1) return; // only drag with button pressed
  targetPx = e.clientX - psx;
  targetPy = e.clientY - psy;
});

panOverlay.addEventListener("pointerup", e => {
  panDragging = false;
   document.body.style.cursor = 'default';
//  panOverlay.releasePointerCapture(e.pointerId);
});

// Zoom overlay drag
let zoomDragging = false, zoomStartY = 0, zoomInit = 1;
const zoomOverlay = document.getElementById("zoomOverlay");

zoomOverlay.addEventListener("pointerdown", e => {
  zoomDragging = true;
  zoomStartY = e.clientY;
  zoomOverlay.setPointerCapture(e.pointerId);
});

zoomOverlay.addEventListener("pointermove", e => {
  if (!zoomDragging) return;
  const dy = e.clientY - zoomStartY;
  let nz = targetSc * Math.exp(-0.001 * dy);
  nz = Math.min(Math.max(nz, 0.1), 12);
	targetSc = nz
});

zoomOverlay.addEventListener("pointerup", e => {
  zoomDragging = false;
  zoomOverlay.releasePointerCapture(e.pointerId);
});




// ToolPan (mouse/pen only)
document.addEventListener('pointerdown', e => {
  if (activeTool !== "ToolPan") return;
  psx = e.clientX - targetPx;
  psy = e.clientY - targetPy;
  document.body.style.cursor = 'grab';
});

document.addEventListener('pointermove', e => {
  if (activeTool !== "ToolPan") return;
  if (e.buttons !== 1) return; // only drag with button pressed
  targetPx = e.clientX - psx;
  targetPy = e.clientY - psy;
});

document.addEventListener('pointerup', () => {
  if (activeTool !== "ToolPan") return;
  document.body.style.cursor = 'default';
});

let zoomInterval;

zoomIn.onclick = () => {
	targetSc *= 1.1;
}
zoomOut.onclick = () => {
	targetSc *= 0.9;
}
// Zoom In (hold to repeat)
zoomIn.onpointerdown = () => {
    zoomInterval = setInterval(() => {
        targetSc *= 1.1;
        // redraw or update canvas here if needed
    }, 100); // every 100ms
};

zoomIn.onpointerup = zoomIn.onpointerleave = () => {
    clearInterval(zoomInterval);
};

// Zoom Out (hold to repeat)
zoomOut.onpointerdown = () => {
    zoomInterval = setInterval(() => {
        targetSc *= 0.9;
        // redraw or update canvas here if needed
    }, 100);
};

zoomOut.onpointerup = zoomOut.onpointerleave = () => {
    clearInterval(zoomInterval);
};


// Fit to Screen button
fitScreen.onclick = () => {
  autoFitCanvas();
};

// Auto fit when page loads
window.addEventListener('load', () => {
  autoFitCanvas();
});

function autoFitCanvas() {
  const rect = active_layer.getBoundingClientRect();

  // available screen size (or container size)
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // scale factors for width and height
  const scaleX = screenW / rect.width;
  const scaleY = screenH / rect.height;

  // choose the smaller one so canvas fits entirely
  targetSc = Math.min(scaleX, scaleY);

  // redraw or update canvas here if needed
  // e.g. redrawCanvas();
}
