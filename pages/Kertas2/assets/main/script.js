

const stack = document.getElementById('stack')
const cv_background = document.getElementById('background'),cvx_background = cv_background.getContext('2d')
const cv_checkerboard = document.getElementById('checkerboard'),cvx_checkerboard = cv_checkerboard.getContext('2d')
const cv_overlay = document.getElementById('overlay'),cvx_overlay = cv_overlay.getContext('2d')
const layer_0 = document.getElementById('layer_0')


const animation = [];
let frame_current = 0;
//let frameIndex = frame_current + 1;

let undoStack = [];
let redoStack = [];

let active_layer = layer0;
let active_layer_ctx = active_layer.getContext('2d')
let dataURL = active_layer.toDataURL();
let cel_entry = animation.find(a => a.layer_name === active_layer.id && a.frame === frame_current+1);

cvx_overlay.imageSmoothingEnabled = false;
active_layer_ctx.imageSmoothingEnabled = false;

const brush_size = document.getElementById('brush_size')
const brush_opacity = document.getElementById('brush_opacity')
const col = document.getElementById('col')

let clipboard = null;
let drawing = false,
    lx, ly, eras = false,
    px = 0,
    py = 0,
    sc = 1,
    sd = 0
let targetPx = 0,
    targetPy = 0,
    targetSc = 1,
    punStartX = 0,
    punStartY = 0
    


let ToolSelect = false,selStartX, selStartY, selEndX, selEndY;
let ToolFill = false; 
let ToolPan = false;

const ToolPanBtn = document.getElementById('ToolPanBtn')
const ToolSelectBtn = document.getElementById('ToolSelectBtn');
const ToolFillBtn = document.getElementById("ToolFillBtn");

const onionBtn = document.getElementById('onionBtn')
const preferencesBtn = document.getElementById('preferencesBtn');
const settings = document.getElementById('settings');
const checkerboardBtn = document.getElementById('checkerboardBtn');

window.oncontextmenu = function(event) {
     event.preventDefault();
     event.stopPropagation();
     return false;
};

const maxFrameInput = document.getElementById("MaxFrame");
let maxFrame = parseInt(maxFrameInput.value, 10) || 24; // default fallback

// Whenever the input changes, update maxFrame and refresh timeline
maxFrameInput.addEventListener("input", () => {
  const val = parseInt(maxFrameInput.value, 10);
  if (!isNaN(val) && val > 0) {
    maxFrame = val;
    render(); // re‑draw timeline with new maxFrame
  }
});


// Tool state
let tools = [
{ name: "ToolBrush", active: true, btn: ToolBrushBtn },
{ name: "ToolEraser", active: false, btn: ToolEraserBtn },
{ name: "ToolFill", active: false, btn: ToolFillBtn },
{ name: "ToolLassoFill", active: false, btn: ToolLassoFillBtn },
{ name: "ToolSelect", active: false, btn: ToolSelectBtn },
{ name: "ToolPan", active: false, btn: ToolPanBtn }
];

// Helper to set active tool
let activeTool = "ToolBrush";
// Activate one tool, deactivate others
function setActiveTool(toolName) {
	activeTool = toolName;
	tools.forEach(tool => {
		tool.active = (tool.name === toolName);
		const toggleBtn = document.getElementById("ToolLassoFillToggle");
		toggleBtn.style.display = (activeTool === "ToolLassoFill") ? "block" : "none";
	});
	updateUI();
	activeTool = toolName;
}

function setSize(w, h) {
    stack.style.width = w + 'px';
    stack.style.height = h + 'px'
}

function apply() {
    stack.style.transform = `translate(-50%,-50%) translate(${px}px,${py}px) scale(${sc})`
}

function animate() {
    px += (targetPx - px) * 0.2;
    py += (targetPy - py) * 0.2;
    sc += (targetSc - sc) * 0.2;
    apply();
    requestAnimationFrame(animate)
}
animate()


//FILL TOOL
function fill(x, y, fillColor, tolerance) {
const w = active_layer.width, h = active_layer.height;
const imageData = active_layer_ctx.getImageData(0, 0, w, h);
const data = imageData.data;

  function getPixel(px, py) {
    const i = (py * w + px) * 4;
    return [data[i], data[i+1], data[i+2], data[i+3]];
  }

  function setPixel(px, py, color) {
    const i = (py * w + px) * 4;
    data[i]   = color[0];
    data[i+1] = color[1];
    data[i+2] = color[2];
    data[i+3] = color[3];
  }

  function parseColor(colorStr) {
    const tmp = document.createElement("canvas").getContext("2d");
    tmp.fillStyle = colorStr;
    tmp.fillRect(0, 0, 1, 1);
    const c = tmp.getImageData(0, 0, 1, 1).data;
    return [c[0], c[1], c[2], c[3]];
  }

  function colorMatch(c1, c2, tol) {
    // Euclidean distance in RGBA space
    const diff = Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2) +
      Math.pow(c1[3] - c2[3], 2)
    );
    return diff <= tol;
  }

  const targetColor = getPixel(x, y);
  const newColor = parseColor(fillColor);

  // Only skip if the new color is *exactly* the same
  if (targetColor.toString() === newColor.toString()) return;

  const stack = [[x, y]];
  const visited = new Set();

  while (stack.length) {
    const [px, py] = stack.pop();
    const key = px + "," + py;
    if (visited.has(key)) continue;
    visited.add(key);

    const currentColor = getPixel(px, py);
    if (colorMatch(currentColor, targetColor, tolerance)) {
      setPixel(px, py, newColor); // always overwrite

      if (px > 0) stack.push([px-	1, py]);
      if (px < w-1) stack.push([px+1, py]);
      if (py > 0) stack.push([px, py-1]);
      if (py < h-1) stack.push([px, py+1]);
    }
  }

  active_layer_ctx.putImageData(imageData, 0, 0);
}

// Fill Tool handlers
active_layer.addEventListener("pointerdown", e => {
    if (activeTool != "ToolFill") return; // only fill if enabled

    // --- Capture undo state BEFORE filling ---
    undoStack.push(dataURL);

    const rect = active_layer.getBoundingClientRect();

    // Map screen coords back to canvas pixel coords
    const scaleX = active_layer.width / rect.width;
    const scaleY = active_layer.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    fill(x, y, col.value, 0); // fill with chosen color

    // Optionally update frames[] if you want fills to be stored like strokes
    frames[frame_current] = dataURL;
    render();
});

// --- Globals for lasso ---
let lassoPoints = [];
let isLassoing = false;
let lassoMode = false; // default: fill mode

// --- Toggle button ---
const ToolLassoFillToggle = document.getElementById("ToolLassoFillToggle");
const ToolLassoFillToggleSpan = ToolLassoFillToggle.querySelector("span");

ToolLassoFillToggle.onclick = () => {
  lassoMode = !lassoMode;
  if (lassoMode){
  	ToolLassoFillToggleSpan.className = "bl-icons-key_ring";
  }else{
  	ToolLassoFillToggleSpan.className = "bl-icons-key_ring_filled";
  }
  // update button label or style
//  ToolLassoFillToggle.textContent = lassoEraseMode ? "X" : "+";
};


// --- Lasso tool handlers ---
active_layer.addEventListener("pointerdown", e => {
  if (activeTool !== "ToolLassoFill") return;

  const rect = active_layer.getBoundingClientRect();
  const scaleX = active_layer.width / rect.width;
  const scaleY = active_layer.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  lassoPoints = [{ x, y }];
  isLassoing = true;
});


let rainbowOffset = 0; // animation phase

active_layer.addEventListener("pointermove", e => {
  if (activeTool !== "ToolLassoFill" || !isLassoing) return;

  const rect = active_layer.getBoundingClientRect();
  const scaleX = active_layer.width / rect.width;
  const scaleY = active_layer.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  lassoPoints.push({ x, y });

  // clear overlay
  cvx_overlay.clearRect(0, 0, cv_overlay.width, cv_overlay.height);

  // create animated rainbow gradient
  const gradient = cvx_overlay.createLinearGradient(0, 0, cv_overlay.width, 0);
  for (let i = 0; i <= 6; i++) {
    const hue = (rainbowOffset + i * 60) % 360;
    gradient.addColorStop(i / 6, `hsl(${hue}, 100%, 50%)`);
  }
  cvx_overlay.strokeStyle = gradient;
  cvx_overlay.lineWidth = 2;

  // draw lasso path
  cvx_overlay.beginPath();
  cvx_overlay.moveTo(lassoPoints[0].x, lassoPoints[0].y);
  for (let i = 1; i < lassoPoints.length; i++) {
    cvx_overlay.lineTo(lassoPoints[i].x, lassoPoints[i].y);
  }
  cvx_overlay.stroke();

  // advance rainbow animation
  rainbowOffset = (rainbowOffset + 5) % 360; // 5 is speed
});


active_layer.addEventListener("pointerup", e => {
  if (activeTool !== "ToolLassoFill" || !isLassoing) return;
  isLassoing = false;

  // clear overlay preview
  cvx_overlay.clearRect(0, 0, cv_overlay.width, cv_overlay.height);

  // --- Capture undo state BEFORE applying lasso fill/erase ---
  undoStack.push(dataURL);
  redoStack = [];

  const ctx = active_layer_ctx; // main drawing context
  ctx.save();

  // Build lasso path
  ctx.beginPath();
  ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
  for (let i = 1; i < lassoPoints.length; i++) {
    ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
  }
  ctx.closePath();
  ctx.clip();

  if (lassoMode) {
    // erase inside lasso
    ctx.clearRect(0, 0, active_layer.width, active_layer.height);
  } else {
    // fill inside lasso
    ctx.fillStyle = col.value;
    ctx.fillRect(0, 0, active_layer.width, active_layer.height);
  }

  ctx.restore();

  // reset lasso state
  lassoPoints = [];

    if (cel_entry) {
    // Instead of removing, mark as null
    cel_entry.drawing = dataURL;
  } else {
    animation.push({
      layer_name: active_layer.id,
      frame: frame_current + 1,
      drawing: dataURL
    });
  }

  // Refresh timeline (keeps canvas as-is, similar to brush handler)
  render();
});


const timeline = document.querySelector('#timeline_v2');
const timelineBar = document.querySelector('.timeline-bar');

function timelineBarPosition() {
  const rect = timeline.getBoundingClientRect();
  const timelineTop = rect.top;          // distance from viewport top
  const timelineHeight = rect.height;    // actual rendered height
  timelineBar.style.top = `${timelineTop + timelineHeight}px`;
}

window.addEventListener('resize', timelineBarPosition);
window.addEventListener('load', timelineBarPosition);
timelineBarPosition();

function syncTimelineBackgroundHeight() {
  const timeline = document.querySelector('#timeline_v2');
  const background = document.querySelector('.timeline-background');

  if (timeline && background) {
    const timelineHeight = timeline.offsetHeight; // actual rendered height
    background.style.height = timelineHeight + 'px';
  }
}

// Run once on load
window.addEventListener('load', syncTimelineBackgroundHeight);

// Also update on resize (in case #timeline_v2 changes size)
window.addEventListener('resize', syncTimelineBackgroundHeight);


 
// --- RESIZE STRETCH ---
function resize(w, h) {
    const snapshot = new Image();
    snapshot.src = dataURL;

	cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    
    cv_background.width = w;
    cv_background.height = h;
    active_layer.width = w;
    active_layer.height = h;
    
    cv_overlay.width = w;
    cv_overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        // Stretch to fit new size
        active_layer_ctx.drawImage(snapshot, 0, 0, w, h);
    };

    document.getElementById('canvasWidth').value = w;
    document.getElementById('canvasHeight').value = h;
}

// --- RESIZE ANCHOR PRESERVE ---
function resizeAnchor(w, h, anchor = "top-left") {
    const snapshot = new Image();
    snapshot.src = dataURL;

    const oldW = active_layer.width;
    const oldH = active_layer.height;

	cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    
    cv_background.width = w;
    cv_background.height = h;
    active_layer.width = w;
    active_layer.height = h;
    
    cv_overlay.width = w;
    cv_overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        let offsetX = 0, offsetY = 0;
        if (anchor.includes("right")) offsetX = w - oldW;
        if (anchor.includes("bottom")) offsetY = h - oldH;
        // Draw at original size (no stretch)
        active_layer_ctx.drawImage(snapshot, offsetX, offsetY);
    };

    document.getElementById('canvasWidth').value = w;
    document.getElementById('canvasHeight').value = h;
}


// --- RESIZE CENTER PRESERVE ---
function resizeCenter(w, h) {
    const snapshot = new Image();
    snapshot.src = dataURL;

    const oldW = active_layer.width;
    const oldH = active_layer.height;
		
		cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    cv_background.width = w;
    cv_background.height = h;
    active_layer.width = w;
    active_layer.height = h;
    cv_overlay.width = w;
    cv_overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        // Center the old drawing
        const offsetX = (w - oldW) / 2;
        const offsetY = (h - oldH) / 2;
        active_layer_ctx.drawImage(snapshot, offsetX, offsetY);
    };

    document.getElementById('canvasWidth').value = w;
    document.getElementById('canvasHeight').value = h;
}

// --- BUTTON HANDLERS ---
document.getElementById('applySize').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    if (w > 0 && h > 0) {
        resize(w, h); // stretch
        frames[frame_current] = dataURL;
        render();
    }
};

document.getElementById('resizeLeft').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeAnchor(w, h, "top-right");
};

document.getElementById('resizeRight').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeAnchor(w, h, "top-left");
};

document.getElementById('resizeTop').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeAnchor(w, h, "bottom-left");
};

document.getElementById('resizeBottom').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeAnchor(w, h, "top-left");
};

document.getElementById('resizeCenter').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeCenter(w, h);
};

function init() {
  clearPixels();

  // Capture undo state
  undoStack.push(dataURL);
  redoStack = [];


    if (cel_entry) {
    // Instead of removing, mark as null
    cel_entry.drawing = dataURL;
  } else {
    animation.push({
      layer_name: active_layer.id,
      frame: frame_current + 1,
      drawing: dataURL
    });
  }

  // Refresh timeline
  render();
}

resize(500, 500);
init()

function getCanvasCoords(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Use clientX/clientY for consistency across mouse/touch/pen
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

let useAliased = false; // user can set this true/false
AliasedBtn = document.getElementById('aliased');
AliasedBtn.onclick = () => {
    aliased = !aliased;
    if (!aliased) {
        AliasedBtn.style.backgroundColor = "orange";
        useAliased = true;
        
    } else {
		AliasedBtn.style.backgroundColor = "";
      useAliased = false;
    }
};


//// Painting primitives
function circ(x, y, s, c, a) {
  active_layer_ctx.globalAlpha = a;

  if (activeTool === "ToolEraser") {
    active_layer_ctx.globalCompositeOperation = "destination-out";
    active_layer_ctx.fillStyle = "#000"; // solid fill for erasing
  } else {
    active_layer_ctx.globalCompositeOperation = "source-over";
    active_layer_ctx.fillStyle = c;
  }

  if (useAliased) {
    const r = Math.floor(s / 2);
    for (let py = -r; py <= r; py++) {
      for (let px = -r; px <= r; px++) {
        if (px * px + py * py <= r * r) {
          active_layer_ctx.fillRect(Math.round(x + px), Math.round(y + py), 1, 1);
        }
      }
    }
  } else {
    active_layer_ctx.beginPath();
    active_layer_ctx.arc(x, y, s / 2, 0, Math.PI * 2);
    active_layer_ctx.fill();
  }

  // reset state
  active_layer_ctx.globalAlpha = 1;
  active_layer_ctx.globalCompositeOperation = "source-over";
}

function line(x0, y0, x1, y1, s, c, a) {
  const dx = x1 - x0,
        dy = y1 - y0,
        d = Math.hypot(dx, dy),
        st = Math.ceil(d / (s / 3)); // step count ensures overlap

  for (let i = 0; i <= st; i++) {
    const t = i / st;
    circ(x0 + dx * t, y0 + dy * t, s, c, a);
  }
}

//// Pressure toggles
const pressureSizeToggle = document.getElementById("pressureSizeToggle");
const pressureOpacityToggle = document.getElementById("pressureOpacityToggle");

function getBrushSettings(e) {
  const baseSize = parseInt(brush_size.value, 10);
  const baseOpacity = parseFloat(brush_opacity.value);

  const pressure = e.pressure > 0 ? e.pressure : 1.0;

  const brushSize = pressureSizeToggle.checked ? baseSize * pressure : baseSize;
  const brushOpacity = pressureOpacityToggle.checked ? baseOpacity * pressure : baseOpacity;

  return { brushSize, brushOpacity };
}


function bindDrawingEvents() {
  active_layer.onpointerdown = e => {
    if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
      // Save undo state
      undoStack.push(dataURL);
      redoStack = [];

      drawing = true;
      lx = e.offsetX;
      ly = e.offsetY;

      // Draw initial dot if pressure not controlling size/opacity
      if (!pressureSizeToggle.checked && !pressureOpacityToggle.checked) {
        const { brushSize, brushOpacity } = getBrushSettings(e);
        circ(lx, ly, brushSize, col.value, brushOpacity);
      }
    }
  };

  active_layer.onpointermove = e => {
    if ((activeTool === "ToolBrush" || activeTool === "ToolEraser") && drawing) {
      // Skip zero-length moves if pressure is enabled
      if ((pressureSizeToggle.checked || pressureOpacityToggle.checked) &&
          lx === e.offsetX && ly === e.offsetY) {
        return;
      }

      const { brushSize, brushOpacity } = getBrushSettings(e);
      line(lx, ly, e.offsetX, e.offsetY, brushSize, col.value, brushOpacity);
      lx = e.offsetX;
      ly = e.offsetY;
    }
  };

//active_layer.onpointerup = () => {
//    if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
//      drawing = false;

//      // Update or insert into animation[]
//        animation.push({
//          layer_name: active_layer.id,
//          frame: frame_current + 1,
//          drawing: dataURL
//        });

//      // Refresh timeline but DO NOT immediately clear canvas
//      render();
//    }
//  };
//}

  active_layer.onpointerup = () => {
    if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
      drawing = false;
      
        if (cel_entry) {
    cel_entry.drawing = active_layer.toDataURL();
  } else {
        animation.push({
          layer_name: active_layer.id,
          frame: frame_current + 1,
          drawing: active_layer.toDataURL()
        });
}
      // Refresh timeline but DO NOT immediately clear canvas
      render();
    }
  };
}

//// Initial binding for the first active layer
bindDrawingEvents(active_layer);

//// Undo/Redo
document.getElementById("undoBtn").onclick = undo;
document.getElementById("redoBtn").onclick = redo;

function undo() {
  if (undoStack.length > 0) {
    // Save current state into redoStack
    redoStack.push(dataURL);

    const lastState = undoStack.pop();
    const img = new Image();
    img.onload = () => {
      clearPixels();
      active_layer_ctx.drawImage(img, 0, 0);
      frames[frame_current] = lastState;
      render();
    };
    img.src = lastState;
  }
}

function redo() {
  if (redoStack.length > 0) {
    // Save current state into undoStack
    undoStack.push(dataURL);

    const nextState = redoStack.pop();
    const img = new Image();
    img.onload = () => {
      clearPixels();
      active_layer_ctx.drawImage(img, 0, 0);
      frames[frame_current] = nextState;
      render();
    };
    img.src = nextState;
  }
}

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

// --- Globals ---
//let selStartX = null, selStartY = null, selEndX = null, selEndY = null;
let isDraggingHandle = false;
let dragStartX = 0, dragStartY = 0;
let frozenStartX = 0, frozenStartY = 0, frozenEndX = 0, frozenEndY = 0;
//let clipboard = null;

// --- Selection handlers ---
active_layer.addEventListener('pointerdown', e => {
  if (activeTool !== "ToolSelect") return;
  const { x, y } = getCanvasCoords(e, active_layer);

  // compute center of current selection
  const w = selEndX - selStartX;
  const h = selEndY - selStartY;
  const centerX = selStartX + w / 2;
  const centerY = selStartY + h / 2;

  // check if pointer is inside handle (10px radius)
  if (selStartX != null && Math.abs(x - centerX) < 10 && Math.abs(y - centerY) < 10) {
    isDraggingHandle = true;
    dragStartX = x;
    dragStartY = y;
    // freeze selection bounds
    frozenStartX = selStartX;
    frozenStartY = selStartY;
    frozenEndX = selEndX;
    frozenEndY = selEndY;
    return;
  }

  // normal selection start
  selStartX = x; selStartY = y;
  selEndX = x; selEndY = y;
});


active_layer.addEventListener('pointermove', e => {
  if (activeTool !== "ToolSelect") return;
  const { x, y } = getCanvasCoords(e, active_layer);

  if (isDraggingHandle) {
    if (e.buttons === 1 || e.pressure > 0) {
      const dx = x - dragStartX;
      const dy = y - dragStartY;
      selStartX = frozenStartX + dx;
      selEndX   = frozenEndX   + dx;
      selStartY = frozenStartY + dy;
      selEndY   = frozenEndY   + dy;
    }
  } else {
    if (e.buttons === 1 || e.pressure > 0) {
      selEndX = x;
      selEndY = y;
    }
  }

  cvx_overlay.clearRect(0, 0, cv_overlay.width, cv_overlay.height);

  // fill if pressure
  if (e.pressure > 0) {
    cvx_overlay.fillStyle = 'rgba(128,0,128,0.2)';
    cvx_overlay.fillRect(selStartX, selStartY, selEndX - selStartX, selEndY - selStartY);
    cvx_overlay.setLineDash([6, 4]);
  }
  // 🌈 rainbow stroke
  if (Number.isFinite(selStartX) && Number.isFinite(selStartY) &&
    Number.isFinite(selEndX) && Number.isFinite(selEndY)) {

    const gradient = cvx_overlay.createLinearGradient(selStartX, selStartY, selEndX, selEndY);
    for (let i = 0; i <= 6; i++) {
        const hue = (rainbowOffset + i * 60) % 360;
        gradient.addColorStop(i / 6, `hsl(${hue}, 100%, 50%)`);
    }
    cvx_overlay.strokeStyle = gradient;
    cvx_overlay.lineWidth = 2;
    cvx_overlay.strokeRect(selStartX, selStartY, selEndX - selStartX, selEndY - selStartY);

    // draw center handle
    const w = selEndX - selStartX;
    const h = selEndY - selStartY;
    const centerX = selStartX + w / 2;
    const centerY = selStartY + h / 2;
    cvx_overlay.fillStyle = gradient;
    cvx_overlay.beginPath();
    cvx_overlay.arc(centerX, centerY, 6, 0, Math.PI * 2);
    cvx_overlay.fill();
}

  // advance rainbow animation
  rainbowOffset = (rainbowOffset + 5) % 360; // adjust speed here
});

active_layer.addEventListener('pointerup', e => {
  if (activeTool !== "ToolSelect") return;

  if (isDraggingHandle) {
    // stop dragging, don't overwrite selEndX/Y with pointer position
    isDraggingHandle = false;
    return;
  }

  // normal selection finalize
  const { x, y } = getCanvasCoords(e, active_layer);
  selEndX = x; selEndY = y;

  const w = Math.abs(selEndX - selStartX);
  const h = Math.abs(selEndY - selStartY);
  if (w < 5 || h < 5) {
    cvx_overlay.clearRect(0, 0, cv_overlay.width, cv_overlay.height);
    selStartX = null;
    selStartY = null;
    selEndX   = null;
    selEndY   = null;
  }
});

// --- Freehand drawing handlers ---
active_layer.addEventListener('pointerdown', e => {
  if (["pen","touch","mouse"].includes(e.pointerType)) {
    drawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
  }
});

active_layer.addEventListener('pointermove', e => {
  if (!drawing) return;
  if (["pen","touch","mouse"].includes(e.pointerType)) {
    // ctx.lineTo(e.offsetX, e.offsetY);
    // ctx.stroke();
    lastX = e.offsetX;
    lastY = e.offsetY;
  }
});

active_layer.addEventListener('pointerup', e => {
  drawing = false;
});


// Copy selected region
copyBtn = document.getElementById('copy');
copyBtn.onclick = () => {
    if (selStartX != null) {
//    		cvx_overlay.clearRect(0, 0, cv_overlay.width, cv_overlay.height);
        const w = selEndX - selStartX;
        const h = selEndY - selStartY;
        if (w && h) {
            const tmp = document.createElement('canvas');
            tmp.width = Math.abs(w);
            tmp.height = Math.abs(h);
            const ctx = tmp.getContext('2d');
            ctx.drawImage(active_layer, Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(w), Math.abs(h), 0, 0, Math.abs(w), Math.abs(h));
            clipboard = tmp;
        }
    }
};

// Delete
deleteBtn = document.getElementById('delete');
deleteBtn.onclick = () => {
	active_layer_ctx.clearRect(Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(selEndX - selStartX), Math.abs(selEndY - selStartY));
	frames[frame_current] = dataURL;
	render();
};

// Cut = copy + delete
cutBtn = document.getElementById('cut');
cutBtn.onclick = () => {
	document.getElementById('copy').onclick();
	document.getElementById('delete').onclick();
};


// --- Paste clipboard into current selection ---
pasteBtn = document.getElementById('paste');
pasteBtn.onclick = () => {
  if (clipboard && selStartX != null && selEndX != null) {
    // compute selection bounds
    const w = selEndX - selStartX;
    const h = selEndY - selStartY;

    // draw clipboard image scaled to fit selection
    active_layer_ctx.drawImage(
      clipboard,
      0, 0, clipboard.width, clipboard.height, // source
      Math.min(selStartX, selEndX),
      Math.min(selStartY, selEndY),
      Math.abs(w),
      Math.abs(h) // destination size
    );

    frames[frame_current] = dataURL;
    render();
  }
};

function clearPixels(){
active_layer_ctx.clearRect(0, 0, active_layer.width, active_layer.height);
};

ClearCanvasBtn = document.getElementById('clr');
ClearCanvasBtn.onclick = () => {
    const confirmClear = confirm("Clear current frame's drawing ?");
    if (confirmClear) {
        clearPixels();
        // Also clear the stored drawing for the current frame
//	  const frameIndex = frame_current + 1; // timeline is 1-based
//	  const entry = animation.find(a => a.layer_name === active_layer.id && a.frame === frameIndex);
		  if (cel_entry) {
			 cel_entry.drawing = null; // mark as empty
		  }

		  render();
    }
};


//Save Button
document.getElementById('save').onclick = () => {
    const tmp = document.createElement('canvas');
    tmp.width = cv_background.width;
    tmp.height = cv_background.height;
    const tx = tmp.getContext('2d');
    tx.drawImage(cv_background, 0, 0);
    tx.drawImage(active_layer, 0, 0);
    const link = document.createElement('a');
    link.download = 'img.png';
    link.href = tmp.toDataURL();
    link.click()
}

// Move selected frame forward (to next slot)
document.getElementById('swapNext').onclick = () => {
  if (!animation || animation.length === 0) return;

  // Find the current frame object by its frame number
  const currentFrameObj = animation.find(a => a.frame === frame_current + 1); 
  if (!currentFrameObj) return;

  // Move it forward one frame if possible
  const newFrameNum = currentFrameObj.frame + 1;
  const maxFrame = Math.max(...animation.map(a => a.frame));

  if (newFrameNum <= maxFrame) {
    currentFrameObj.frame = newFrameNum;
    frame_current = newFrameNum - 1; // update cursor to new slot
    render();
    show(frame_current, currentFrameObj.drawing);
  }
};

// Move selected frame backward (to previous slot)
document.getElementById('swapPrev').onclick = () => {
  if (!animation || animation.length === 0) return;

  const currentFrameObj = animation.find(a => a.frame === frame_current + 1);
  if (!currentFrameObj) return;

  const newFrameNum = currentFrameObj.frame - 1;
  if (newFrameNum >= 1) {
    currentFrameObj.frame = newFrameNum;
    frame_current = newFrameNum - 1;
    render();
    show(frame_current, currentFrameObj.drawing);
  }
};


function addLayer(){
  const stack = document.getElementById("stack");

  // Find existing layer canvases
  const existingLayers = Array.from(stack.querySelectorAll("canvas"))
    .filter(c => c.id.startsWith("layer"));

  // Determine next layer index
  const nextIndex = existingLayers.length; // layer0 already exists
  const newLayerId = "layer" + nextIndex;

  // Create new canvas
  const newCanvas = document.createElement("canvas");
  newCanvas.id = newLayerId;
  newCanvas.width = stack.querySelector("#layer0").width;
  newCanvas.height = stack.querySelector("#layer0").height;
  stack.appendChild(newCanvas);

  // Set it as active layer
  active_layer = newCanvas;
  active_layer_ctx = newCanvas.getContext("2d");

  // Attach drawing events so you can paint on this new layer
  bindDrawingEvents(newCanvas);

  // Clear it so it's blank
  active_layer_ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);

  // Add a blank frame at frame 1
//  const blankDataURL = newCanvas.toDataURL(); // snapshot of empty canvas
	
if (cel_entry) {
// Instead of removing, mark as null
cel_entry.drawing = null;
} else {
  animation.push({
    layer_name: newCanvas.id,
    frame: 1,
    drawing: null // valid string, not [object ImageData]
  });
  }

  // Refresh timeline
  render();
};


function render() {
  const canvases = document.querySelectorAll('#stack canvas');
  const layerCanvases = Array.from(canvases).filter(c => c.id.startsWith('layer'));

  let table = document.createElement('table');

  // Header row
  const headerRow = table.insertRow();
  const headerCell = headerRow.insertCell();
  headerCell.textContent = "Timeline";
  headerCell.style.backgroundColor = "#b7b7b7";

  // Always show at least 24 frames
  if (animation && animation.length > 0) {
    maxFrame = Math.max(maxFrame, Math.max(...animation.map(a => a.frame)));
  }

  // Add frame headers
  for (let i = 1; i <= maxFrame; i++) {
    const frameHeader = headerRow.insertCell();
    frameHeader.textContent = i;
    frameHeader.style.backgroundColor = "#b7b7b7";
    frameHeader.style.borderLeft = "solid 1px gray";
  }

  // Add rows for each layer canvas
  layerCanvases.forEach(c => {
  
    const row = table.insertRow(1); //prepend

    // Highlight active layer row
    if (active_layer && active_layer.id === c.id) {
      row.classList.add("active-layer-row");
    }

    // First cell: layer name
    const cell = row.insertCell();
    cell.textContent = c.id;

    // Sort animation entries for this layer
    const layerFrames = animation
      .filter(a => a.layer_name === c.id)
      .sort((a, b) => a.frame - b.frame);

    // Fill timeline cells
    for (let i = 1; i <= maxFrame; i++) {
      const frameCell = row.insertCell();
      frameCell.dataset.index = i;
      frameCell.classList.add("keyframe");

      // Mark active frame
      if (frame_current === i - 1 && active_layer && active_layer.id === c.id) {
        frameCell.classList.add("active");
         
      }

      // Determine cel type
      const keyed = layerFrames.find(f => f.frame === i);
      const lastKey = [...layerFrames].reverse().find(f => f.frame <= i);

      // Helper to handle clicks //Frame Select
      const handleClick = (drawing) => {
        frame_current = i - 1;
        active_layer = c;
        active_layer_ctx = active_layer.getContext("2d");
        
        bindDrawingEvents(active_layer);   // <-- ensure drawing works on this layer
        show(frame_current, drawing);
        render();
        console.log(active_layer.id,frame_current,drawing);
      };
			if (keyed) {
  if (keyed.drawing) {
    // Always treat as keyed frame (●)
    frameCell.classList.add("keyed-frame");
    frameCell.textContent = "●";
    frameCell.onclick = () => handleClick(keyed.drawing);
  } else {
    // Null frame (×)
    frameCell.classList.add("null-frame");
    frameCell.textContent = "×";
    frameCell.onclick = () => handleClick(null);
  }
} else if (lastKey) {
  if (lastKey.drawing) {
    // Always treat as held frame (no blank variant)
    frameCell.classList.add("held-frame");
    frameCell.textContent = " ";
    frameCell.onclick = () => handleClick(lastKey.drawing);
  } else {
    // Held null frame (×)
    frameCell.classList.add("held-null-frame");
    frameCell.textContent = "×";
    frameCell.onclick = () => handleClick(null);
  }
} else {
  // Empty frame (×)
  frameCell.classList.add("empty-frame");
  frameCell.textContent = "×";
  frameCell.onclick = () => handleClick(null);
}


    }
  });

  const container = document.getElementById('timeline_v2');
  container.innerHTML = '';
  container.appendChild(table);
  syncTimelineBackgroundHeight();
  timelineBarPosition();
}

function CelAddNull() {
//if (cel_entry) {

//CelDelete()

//} else {
const frameIndex = frame_current + 1
const idx = animation.findIndex(a => a.layer_name === active_layer.id && a.frame === frameIndex);
  if (idx !== -1) {
    animation.splice(idx, 1);
  }
  
    animation.push({
      layer_name: active_layer.id,
      frame: frame_current+1,
      drawing: null
    });
//  }
  // Clear pixels on canvas too
  clearPixels();

  render();
  show(frame_current);
}


//function CelDelete() {
//  if (animation.length === 0) return; // nothing to delete

//  const confirmDelete = confirm("Delete this cel? (permanent)");
//  if (!confirmDelete) return;

//  const frameIndex = frame_current + 1; // timeline is 1-based
//  const layerCanvases = Array.from(document.querySelectorAll('#stack canvas'))
//    .filter(c => c.id.startsWith('layer'));

//  // Find the active layer (the one whose frame cell is "active")
//  const activeLayer = layerCanvases.find(c => {
//    return animation.some(a => a.layer_name === c.id && a.frame === frameIndex);
//  }) || layerCanvases[0]; // fallback to first layer if none active

//  if (!activeLayer) return;

//  // Remove the cel entry for this layer/frame
//  const idx = animation.findIndex(a => a.layer_name === activeLayer.id && a.frame === frameIndex);
//  if (idx !== -1) {
//    animation.splice(idx, 1);
//  }

//  // Clear pixels on canvas too
//  clearPixels();
//  // Adjust current index if needed
//  if (frame_current >= animation.length) {
//    frame_current = Math.max(0, animation.length - 1);
//  }

//  render();
//  show(frame_current);
//}

enableTimelinePan();
//Timeline Pan
function enableTimelinePan() {
  const container = document.getElementById('timeline_v2');

  let isPanning = false;
  let startX = 0;
  let offsetX = 0; // accumulated offset

  container.addEventListener('pointerdown', e => {
    isPanning = true;
    startX = e.clientX - offsetX;
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', e => {
    if (!isPanning) return;
    offsetX = e.clientX - startX;

    // Clamp so it never goes beyond left:0
    if (offsetX > 0) {
      offsetX = 0;
    }

    container.style.transform = `translateX(${offsetX}px)`;
  });

  container.addEventListener('pointerup', e => {
    isPanning = false;
    container.releasePointerCapture(e.pointerId);
  });

  container.addEventListener('pointercancel', e => {
    isPanning = false;
    container.releasePointerCapture(e.pointerId);
  });
}

const SaveFileBtn = document.getElementById('export');
SaveFileBtn.onclick = async () => {
  const bgUrl = document.getElementById('url').value.trim();
  const zip = new JSZip();

  // Create frames folder inside zip
  const framesFolder = zip.folder("frames");

  // For each animation entry, composite background + that frame’s image into a PNG
  for (const entry of animation) {
    const tmp = document.createElement('canvas');
    tmp.width = cv_background.width;
    tmp.height = cv_background.height;
    const tx = tmp.getContext('2d');

    // Optional: draw background
    // tx.drawImage(cv_background, 0, 0);

    // Draw this frame’s image
    const img = new Image();
    img.src = entry.drawing;
    await new Promise(res => { img.onload = res; });
    tx.drawImage(img, 0, 0);

    // Convert to Blob (PNG)
    const blob = await new Promise(resolve =>
      tmp.toBlob(resolve, "image/png")
    );

    // Filename based on layer + frame number
    const filename = `${entry.layer_name}_${String(entry.frame).padStart(4, '0')}.png`;
    framesFolder.file(filename, blob);

    // Update entry’s drawing path to point to the file inside zip
    entry.drawing = `frames/${filename}`;
  }

  // Build JSON metadata
  const data = {
    background: bgUrl,
    canvas: {
      width: active_layer.width,
      height: active_layer.height
    },
    animation: animation
  };

  // Add JSON file at root of zip
  zip.file("data.json", JSON.stringify(data, null, 2));

  // Generate zip and trigger download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "Kertas.zip");
};

const LoadFileBtn = document.getElementById('import');
LoadFileBtn.onclick = () => {
  const input = document.createElement('input');
  input.type = "file";
  input.accept = ".zip";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const zip = await JSZip.loadAsync(reader.result);

        // Read JSON metadata
        const jsonFile = zip.file("data.json");
        if (!jsonFile) throw new Error("Missing data.json in zip");
        const jsonText = await jsonFile.async("string");
        const obj = JSON.parse(jsonText);

        // Restore background
        if (obj.background) {
          document.getElementById('url').value = obj.background;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = obj.background;
          img.onload = () => {
            const w = (obj.canvas && obj.canvas.width) || img.width;
            const h = (obj.canvas && obj.canvas.height) || img.height;
            resize(w, h);

            document.getElementById('canvasWidth').value = w;
            document.getElementById('canvasHeight').value = h;

            cvx_background.clearRect(0, 0, cv_background.width, cv_background.height);
            cvx_background.drawImage(img, 0, 0, w, h);
            clearPixels();
          };
        } else if (obj.canvas && obj.canvas.width && obj.canvas.height) {
          resize(obj.canvas.width, obj.canvas.height);
          document.getElementById('canvasWidth').value = obj.canvas.width;
          document.getElementById('canvasHeight').value = obj.canvas.height;
        }

        // Clear existing animation and layer canvases
        animation.length = 0;
        const stack = document.getElementById("stack");
        Array.from(stack.querySelectorAll("canvas"))
          .filter(c => c.id.startsWith("layer"))
          .forEach(c => c.remove());

        // Collect all unique layer names from animation metadata
        const layerNames = [...new Set(obj.animation.map(f => f.layer_name))];

        // Recreate canvases for each layer
        layerNames.forEach(name => {
          const newCanvas = document.createElement("canvas");
          newCanvas.id = name;
          newCanvas.width = obj.canvas.width;
          newCanvas.height = obj.canvas.height;
          stack.appendChild(newCanvas);

          bindDrawingEvents(newCanvas);
        });

        // Restore animation frames from zip
        if (obj.animation) {
          for (const frame of obj.animation) {
            const pngPath = frame.drawing; // e.g. "frames/layer0_0001.png"
            const pngFile = zip.file(pngPath);
            if (pngFile) {
              const blob = await pngFile.async("blob");
              const url = URL.createObjectURL(blob);
              animation.push({
                layer_name: frame.layer_name,
                frame: frame.frame,
                drawing: url
              });
            }
          }

          // Set current frame index
          frame_current = 0;

          // Auto‑draw all layers’ frame 1
          const layerCanvases = Array.from(stack.querySelectorAll("canvas"))
            .filter(c => c.id.startsWith("layer"));
          layerCanvases.forEach(c => {
            const ctx = c.getContext("2d");
            const frame = animation.find(
              a => a.layer_name === c.id && a.frame === frame_current + 1
            );
            if (frame && frame.drawing) {
              const img = new Image();
              img.src = frame.drawing;
              img.onload = () => ctx.drawImage(img, 0, 0);
            }
          });

          // Set the first layer as active
          const firstLayerCanvas = layerCanvases[0];
          if (firstLayerCanvas) {
            active_layer = firstLayerCanvas;
            active_layer_ctx = active_layer.getContext("2d");
          }

          render();
        }

      } catch (err) {
        console.error("Invalid ZIP or JSON", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
  timelineBarPosition();
};



//////////////////

// Load Image
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

function importImageSequence(files, bgUrl = null) {
    frames.length = files.length;
    let loaded = 0;

    files.forEach((file, idx) => {
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                // For the very first frame, resize canvas BEFORE composing
                if (idx === 0) {
                    const firstImg = await loadImage(reader.result);
                    resize(firstImg.width, firstImg.height);

                    document.getElementById('canvasWidth').value = firstImg.width;
                    document.getElementById('canvasHeight').value = firstImg.height;
                }

                // Compose background + frame into a dataURL using the resized canvas
                const dataURL = await composeFrame(bgUrl, reader.result, active_layer.width, active_layer.height);
                frames[idx] = dataURL;
                loaded++;

                if (loaded === files.length) {
                    frame_current = 0;
                    show(frame_current);
                    render();
                }
            } catch (e) {
                console.error(`Error composing frame ${idx}:`, e);
            }
        };

        reader.onerror = () => console.error(`Error reading file: ${file.name}`);
        reader.readAsDataURL(file);
    });
}

// Helper: load image from URL or dataURL
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}



// --- Import Button Handler for Image Sequences ---
document.getElementById('importSequence').onclick = () => {
    const input = document.createElement('input');
    input.type = "file";
    input.multiple = true;              // allow multiple images
    input.accept = "image/*";           // restrict to image files only
    input.onchange = e => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        importImageSequence(files);     // call the importer
    };
    input.click();
};

// Helper: composite background + frame into a dataURL
async function composeFrame(bgUrl, frameUrl, outW, outH) {
    const can = document.createElement('canvas')
    can.width = outW
    can.height = outH
    const ctx = can.getContext('2d')
    // Fill transparent background to avoid PDF black page
//    ctx.fillStyle = "#ffffff"
//    ctx.fillRect(0, 0, outW, outH)
    // Draw background if present
    if (bgUrl) {
        try {
            const bgImg = await loadImage(bgUrl)
            const r = Math.min(outW / bgImg.width, outH / bgImg.height)
            const w = bgImg.width * r,
                h = bgImg.height * r
            const x = (outW - w) / 2,
                y = (outH - h) / 2
            ctx.drawImage(bgImg, x, y, w, h)
        } catch (e) {
            // ignore bg errors, continue with frame
        }
    }
    // Draw frame (dataURL or external)
    if (frameUrl) {
        const frImg = await loadImage(frameUrl)
        const r = Math.min(outW / frImg.width, outH / frImg.height)
        const w = frImg.width * r,
            h = frImg.height * r
        const x = (outW - w) / 2,
            y = (outH - h) / 2
        ctx.drawImage(frImg, x, y, w, h)
    }
	return can.toDataURL("image/png");
//    return can.toDataURL("image/jpeg", 0.92) // smaller PDF size; use PNG if needed
}
// Export PDF
document.getElementById('pdf').onclick = async () => {
    const {
        jsPDF
    } = window.jspdf
    const pdf = new jsPDF()
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const bgUrl = document.getElementById('url').value.trim() || null
    try {
        for (let i = 0; i < frames.length; i++) {
            const compositeDataURL = await composeFrame(bgUrl, frames[i], Math.floor(pageW * 4), Math.floor(pageH * 4))
            // Add scaled image to page (PDF units are in pt by default)
            pdf.addImage(compositeDataURL, 'JPEG', 0, 0, pageW, pageH)
            if (i < frames.length - 1) pdf.addPage()
        }
        pdf.save("document.pdf")
    } catch (err) {
        console.error("PDF export failed:", err)
        alert("PDF export failed. Check console for details.")
    }
}






document.getElementById('load').onclick = () => {
    const u = document.getElementById('url').value.trim();
    if (!u) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        resize(img.width, img.height);
        cvx_background.clearRect(0, 0, cv_background.width, cv_background.height);
        cvx_background.drawImage(img, 0, 0);
        clearPixels();
        frames[frame_current] = dataURL;
        render();
    };
    img.src = u
}


//DRAG BUTTONS

function makeDragButton(btn) {
  const displayEl = btn.querySelector('.value-display');
  const inputEl = btn.querySelector('.value-input');

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const getAttr = (name, fallback) => {
    const v = parseFloat(btn.getAttribute(name));
    return Number.isFinite(v) ? v : fallback;
  };

  let min = getAttr('data-min', 0);
  let max = getAttr('data-max', 100);
  let step = getAttr('data-step', 1);
  let pxPerStep = getAttr('data-px-per-step', 16);

  let startX = 0;
  let startVal = 0;
  let isDragging = false;
  let accumulated = 0;

  const readVal = () => parseFloat(displayEl.textContent) || 0;
  const writeVal = (v) => {
    const clamped = clamp(v, min, max);
    displayEl.textContent = clamped;
    inputEl.value = clamped;
  };

  // Double-click to edit
  btn.addEventListener('dblclick', () => {
    btn.classList.add('editing');
    inputEl.focus();
    inputEl.select();
  });

  // Commit input on blur or Enter
  inputEl.addEventListener('blur', () => {
    btn.classList.remove('editing');
    writeVal(parseFloat(inputEl.value));
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      inputEl.blur();
    }
  });

  // Keyboard support
  btn.addEventListener('keydown', (e) => {
    let v = readVal();
    switch (e.key) {
      case 'ArrowRight': writeVal(v + step); e.preventDefault(); break;
      case 'ArrowLeft': writeVal(v - step); e.preventDefault(); break;
    }
  });

  // Pointer drag
  btn.addEventListener('pointerdown', (e) => {
    if (btn.classList.contains('editing')) return;
    btn.setPointerCapture(e.pointerId);
    isDragging = true;
    btn.classList.add('dragging');
    startY = e.clientY;
    startVal = readVal();
    accumulated = 0;
  });

  btn.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = startY - e.clientY ; // right is positive
    const totalStepsFloat = (dx + accumulated) / pxPerStep;
    const wholeSteps = Math.trunc(totalStepsFloat);
    if (wholeSteps !== 0) {
      const next = startVal + wholeSteps * step;
      writeVal(next);
      const usedPx = wholeSteps * pxPerStep;
      accumulated = (dx + accumulated) - usedPx;
    }
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    btn.classList.remove('dragging');
    btn.releasePointerCapture?.(e.pointerId);
  };

  btn.addEventListener('pointerup', endDrag);
  btn.addEventListener('pointercancel', endDrag);
  btn.addEventListener('pointerleave', endDrag);

  writeVal(readVal());
}

// Initialize all drag buttons automatically
document.querySelectorAll('.drag-btn').forEach(makeDragButton);

// Export Gif
document.getElementById('exportGif').onclick = exportGif;

// Export GIF from collected frames
GifDelay = document.getElementById('GifDelay');
function exportGif() {
	let fps = parseInt(GifDelay.value, 10);
	  if (isNaN(fps) || fps <= 0) fps = 5; // fallback default FPS
	  const delayMs = 1000 / fps;
	  
    if (!frames.length) {
        alert("No frames to export!");
        return;
    }

    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: 'assets/gif-js/gif.worker.js', // <-- correct path
        width: active_layer.width,
        height: active_layer.height,
        transparent: null, // disable transparency → solid background
    });

    let loadedCount = 0;

    frames.forEach((frameDataUrl, idx) => {
        const img = new Image();
        img.src = frameDataUrl;

        img.onload = () => {
            // Draw onto a temp canvas to ensure background is filled
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = active_layer.width;
            tempCanvas.height = active_layer.height;
            const tempCtx = tempCanvas.getContext("2d");

            // Fill background (white here, change if needed)
            tempCtx.fillStyle = "#ffffff";
            tempCtx.fillRect(0, 0, active_layer.width, active_layer.height);

            // Draw the frame image on top
            tempCtx.drawImage(img, 0, 0);

            gif.addFrame(tempCtx, { delay: delayMs }); // Delay

            loadedCount++;
            if (loadedCount === frames.length) {
                gif.on("finished", blob => {
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = "animation.gif";
                    link.click();
                });
                gif.render();
            }
        };
    });
}

//Animation Play
let playing = false;
let playIndex = 0;
let playTimer = null;

const playBtn = document.getElementById("playBtn");
const playBtn_icon = document.getElementById("playBtn_icon");

// Existing play button logic
playBtn.onclick = () => {
    if (playing) {
        stopAnimation();
        playBtn_icon.classList.replace('bl-icons-pause', 'bl-icons-play');
        show(frame_current);
        // render();
    } else {
        playAnimation();
        playBtn_icon.classList.replace('bl-icons-play', 'bl-icons-pause');  
    }
};


function buildPlaybackSequence(animation, maxFrame) {
  const sequence = [];

  const layers = [...new Set(animation.map(a => a.layer_name))];

  layers.forEach(layer => {
    const layerFrames = animation
      .filter(a => a.layer_name === layer)
      .sort((a, b) => a.frame - b.frame);

    let currentDrawing = null;
    let nextIndex = 0;

    for (let i = 1; i <= maxFrame; i++) {
      if (nextIndex < layerFrames.length && layerFrames[nextIndex].frame === i) {
        currentDrawing = layerFrames[nextIndex].drawing;
        nextIndex++;
      }
      sequence[i - 1] = { frame: i, src: currentDrawing || null };
    }
  });

  return sequence;
}


let sequence = [];
//let playing = false;
//let playIndex = 0;
//let playTimer;

function playAnimation() {
  if (!animation || animation.length === 0) {
    alert("No frames to play!");
    return;
  }

  // Always read the latest value from the MaxFrame input
  const val = parseInt(document.getElementById("MaxFrame").value, 10);
  window.maxFrame = (!isNaN(val) && val > 0) ? val : 24;

  // Build sequence up to current maxFrame
  sequence = buildPlaybackSequence(animation, window.maxFrame);

  playing = true;
  playIndex = 0;
  nextFrame();
}

function stopAnimation() {
  playing = false;
  clearTimeout(playTimer);
}

function nextFrame() {
  if (!playing) return;

  const frame = sequence[playIndex]; // expanded sequence with held + empty frames

  // Clear previous active highlight
  document.querySelectorAll(".keyframe.active-play").forEach(cell =>
    cell.classList.remove("active-play")
  );

  // Highlight current timeline column
  highlightTimelineCell(playIndex);

  if (frame && frame.src) {
    const img = new Image();
    img.src = frame.src;
    img.onload = () => {
      clearPixels();
      active_layer_ctx.drawImage(img, 0, 0);
      scheduleNext();
    };
  } else {
    clearPixels();
    scheduleNext();
  }
}

function scheduleNext() {
  let fps = parseInt(GifDelay.value, 10);
  if (isNaN(fps) || fps <= 0) fps = 5;
  const delayMs = 1000 / fps;

  playTimer = setTimeout(() => {
    playIndex = (playIndex + 1) % sequence.length;
    nextFrame();
  }, delayMs);
}

// Highlight timeline column continuously
function highlightTimelineCell(index) {
  document.querySelectorAll(".keyframe.active-play").forEach(cell => {
    cell.classList.remove("active-play");
  });

  const cells = document.querySelectorAll(`.keyframe[data-index="${index+1}"]`);
  cells.forEach(cell => {
    cell.classList.add("active-play");
  });
}

function flashTimelineCell(index, type) {
  const cell = document.querySelector(`.keyframe[data-index="${index+1}"]`);
  if (!cell) return;

  if (type === "blank") {
    cell.classList.add("flash-blank");
    setTimeout(() => cell.classList.remove("flash-blank"), 200);
  } else {
    cell.classList.add("flash-play");
    setTimeout(() => cell.classList.remove("flash-play"), 200);
  }
}


FramePrevBtn.onclick = () => {
  if (sequence.length === 0) return;
  frame_current = (frame_current - 1 + sequence.length) % sequence.length;
  render();
  show(frame_current);
};

FrameNextBtn.onclick = () => {
  if (sequence.length === 0) return;
  frame_current = (frame_current + 1) % sequence.length;
  render();
  show(frame_current);
};

// Jump to previous keyframe (loop to last if at first)
CelPrevBtn.onclick = () => {
  if (animation.length === 0) return;

  const keyframes = animation.map(a => a.frame).sort((a, b) => a - b);

  const prev = [...keyframes].reverse().find(f => f < frame_current + 1);
  if (prev !== undefined) {
    frame_current = prev - 1;
  } else {
    // loop to last keyframe
    frame_current = keyframes[keyframes.length - 1] - 1;
  }

  render();
  show(frame_current);
};

// Jump to next keyframe (loop to first if at last)
CelNextBtn.onclick = () => {
  if (animation.length === 0) return;

  const keyframes = animation.map(a => a.frame).sort((a, b) => a - b);

  const next = keyframes.find(f => f > frame_current + 1);
  if (next !== undefined) {
    frame_current = next - 1;
  } else {
    // loop to first keyframe
    frame_current = keyframes[0] - 1;
  }

  render();
  show(frame_current);
};

//Onion Skin
// Create two canvases: underlay (for onion skin) and main (for current frame)
const underlay = document.createElement("canvas");
underlay.width = active_layer.width;
underlay.height = active_layer.height;
const underCtx = underlay.getContext("2d");

active_layer.parentNode.insertBefore(underlay, active_layer);
active_layer.style.position = "absolute";
underlay.style.position = "absolute";

let showOnionSkin = false;

function show(i, overrideSrc) {
  // clear both layers
  clearPixels();
  underCtx.clearRect(0, 0, underlay.width, underlay.height);

  if (!animation || animation.length === 0) return;

  // Collect frames for the active layer
  const layerFrames = animation
    .filter(a => a.layer_name === active_layer.id)
    .sort((a, b) => a.frame - b.frame);

  // Find current frame entry
  const frame = layerFrames.find(f => f.frame === i + 1); // frames are 1-based
  const src = overrideSrc || (frame ? frame.drawing : null);

  // Previous frame ghost (red tint)
  if (showOnionSkin && i > 0) {
    const prevFrame = layerFrames.find(f => f.frame === i);
    if (prevFrame && prevFrame.drawing) {
      tintFrame(prevFrame.drawing, "red", 1, underCtx);
    }
  }

  // Next frame ghost (blue tint)
  if (showOnionSkin) {
    const nextFrame = layerFrames.find(f => f.frame === i + 2);
    if (nextFrame && nextFrame.drawing) {
      tintFrame(nextFrame.drawing, "blue", 1, underCtx);
    }
  }

  // Current frame
  if (src) {
    const img = new Image();
    img.onload = () => {
      active_layer_ctx.save();
      active_layer_ctx.globalAlpha = 1.0;
      active_layer_ctx.drawImage(img, 0, 0);
      active_layer_ctx.restore();
    };
    img.src = src;
  } else {
    // blank frame → leave canvas cleared
  }
}

function tintFrame(src, color, alpha, ctx) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    const off = document.createElement("canvas");
    off.width = active_layer.width;
    off.height = active_layer.height;
    const offCtx = off.getContext("2d");

    offCtx.drawImage(img, 0, 0);

    const imageData = offCtx.getImageData(0, 0, active_layer.width, active_layer.height);
    const data = imageData.data;

    let tintRGB;
    if (color === "red") tintRGB = [255, 0, 0];
    else if (color === "blue") tintRGB = [0, 0, 255];
    else tintRGB = [0, 0, 0];

    for (let p = 0; p < data.length; p += 4) {
      if (data[p + 3] > 0) {
        data[p]   = (data[p]   * (1 - alpha)) + (tintRGB[0] * alpha);
        data[p+1] = (data[p+1] * (1 - alpha)) + (tintRGB[1] * alpha);
        data[p+2] = (data[p+2] * (1 - alpha)) + (tintRGB[2] * alpha);
      }
    }

    offCtx.putImageData(imageData, 0, 0);

    ctx.save();
    ctx.globalAlpha = 0.2; // ghost opacity
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  };
}

// Onion skin toggle
onionBtn.onclick = () => {
  showOnionSkin = !showOnionSkin;
  show(frame_current); // refresh current frame with onion skin state
  onionBtn.style.backgroundColor = showOnionSkin ? "yellow" : "";
};


    
settings.style.display = 'none';
preferencesBtn .onclick = () => {
 if (settings.style.display === 'none') {
   settings.style.display = 'block';
 } else {
   settings.style.display = 'none';
 }
 
};

checkerboardBtn.onclick = () => {
 if (cv_checkerboard.style.display === 'none') {
   cv_checkerboard.style.display = 'block';
 } else {
   cv_checkerboard.style.display = 'none';
 }
 
};


minUI = false;
minimalUIBtn = document.getElementById('minimalUI');
timelineWrapper = document.getElementById('timeline-wrapper');


minimalUIBtn.onclick = () => {
  minUI = !minUI;
  if (window.matchMedia("(orientation: portrait)").matches) {
	  if (minUI){
	  	timelineWrapper.style.display = 'none';
	  }
	  else{
		timelineWrapper.style.display = 'flex';
	  }
  }
  else{
  	if (minUI){
	  	timelineWrapper.style.display = 'none';
	  }
	  else{
		timelineWrapper.style.display = 'flex';
	  }
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



const navButton = document.getElementById("navButton");
const snapButton = document.getElementById("snapButton");
const navOverlays = document.getElementById("navOverlays");

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

// Update activeTool UI

function updateUI() {
  tools.forEach(tool => {
	updateBEToggle();
    tool.btn.style.backgroundColor = tool.active ? "yellow" : "";
    
  });
}

const BEToggle = document.getElementById("BrushEraserToggle");
const BEStuff = document.getElementById("BrushStuff");

function updateBEToggle() {
  if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
    BEStuff.style.display = "flex";
  } else {
    BEStuff.style.display = "none";
  }
}

let BEToggleBool = true;
const iconSpan = BEToggle.querySelector("span"); // get the existing span

BEToggle.onclick = () => {
  BEToggleBool = !BEToggleBool;

  if (BEToggleBool) {
    setActiveTool("ToolBrush");
    iconSpan.className = "bl-icons-greasepencil";   // change class
  } else {
    setActiveTool("ToolEraser");
    iconSpan.className = "bl-icons-meta_ellipsoid"; // change class
  }
};





const CelDeleteBtn = document.getElementById('CelDeleteBtn');
const CelAddNullBtn = document.getElementById('CelAddNullBtn');
const AddLayerBtn = document.getElementById('AddLayerBtn');

// Tool events
ToolBrushBtn.onclick = () => { setActiveTool("ToolBrush")};
ToolEraserBtn.onclick = () => { setActiveTool("ToolEraser")};
ToolFillBtn.onclick = () => { setActiveTool("ToolFill")};
ToolLassoFillBtn.onclick = () => { setActiveTool("ToolLassoFill")};
ToolSelectBtn.onclick = () => { setActiveTool("ToolSelect")};
ToolPanBtn.onclick = () => { setActiveTool("ToolPan")};
//CelDeleteBtn.onclick = () => {CelDelete()};
CelAddNullBtn.onclick = () => {CelAddNull()};
AddLayerBtn.onclick = () => { addLayer() };

// SHORTCUTS dictionary
const shortcuts = {
	"t": () => navButton.click(),             	 //NavButton Toggle
	"`": () => preferencesBtn.click(),           // Preferences Toggle
	"h": () => minimalUIBtn.click(),            // Show/Hide Timeline
    "b": () => BEToggle.click(),              // Tool Brush/Eraser Toggle
    "w": () => setActiveTool("ToolBrush"),	// Tool Brush
    "e": () => setActiveTool("ToolEraser"),	// Tool Eraser
    "B": () => AliasedBtn.click(),            		// Aliased Toggle
    "q": () => setActiveTool("ToolLassoFill"),		// Tool Lasso Fill
    "Q": () => ToolLassoFillToggle.click(),			// Lasso Fill Toggle
    "f": () => setActiveTool("ToolFill"),				// Tool Fill
    "v": () => setActiveTool("ToolSelect"),			// Tool Lasso Select
    " ": () => setActiveTool("ToolPan"),				// Tool Pan
    "=": () => zoomIn.click(),							// Zoom In
    "-": () => zoomOut.click(),							// Zoom Out
    "x": () => deleteBtn.click(),						// Delete Selected Drawing
    "Delete": () => ClearCanvasBtn.click(),			// Clear Drawing
    "l": () => addLayer(),                // Add Layer
//    "_": () => CelDeleteBtn.click(),                 // Delete frame
    "+": () => CelAddNullBtn.click(),          // Delete frame but null
    "/": () => onionBtn.click(),              		// Onion skin
    "ArrowRight": () => FrameNextBtn.click(),     // Next frame
    "ArrowLeft": () => FramePrevBtn.click(),     // Prev frame
    ".": () => CelNextBtn.click(),              // Next Cel
    ",": () => CelPrevBtn.click(),             // Prev Cel
    "p": () => playBtn.click(),               // Play
};


// Unified keydown handler
document.addEventListener("keydown", (event) => {
    if (event.repeat) return; // avoid repeats when holding keys

    const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    // Handle Ctrl/Meta combos
    if (hasCtrlOrMeta) {
    		
    		
    		if (key === "s") {
		 		event.preventDefault();
		 		SaveFileBtn.click();
    		}
    		if (key === "o") {
    			event.preventDefault();
    			LoadFileBtn.click();
    		}
    		
        if (key === "z") {
            event.preventDefault();
            if (event.shiftKey) {
                redo(); // Ctrl+Shift+Z → Redo
            } else {
                undo(); // Ctrl+Z → Undo
            }
            return;
        }
        if (key === "y") {
            event.preventDefault();
            redo(); // Ctrl+Y → Redo
            return;
        }
        if (key === "x") { // Ctrl+x Cut
            event.preventDefault();
            cutBtn.onclick();
            return;
            }
        if (key === "c") { // Ctrl+c Copy
            event.preventDefault();
            copyBtn.onclick();
            
            }
        if (key === "v") { // Ctrl+v paste
            event.preventDefault();
            pasteBtn.onclick();
            }
    }

    // Handle simple shortcuts from dictionary
    if (shortcuts[event.key]) {
        event.preventDefault();
        shortcuts[event.key]();
    }
});

//shortcut:zoom_wheel
document.addEventListener('wheel', e => {
    e.preventDefault()
    if (e.ctrlKey) { 
        const d = e.deltaY < 0 ? 1.1 : 0.9
        targetSc = Math.min(Math.max(targetSc * d, 0.5), 3)
    } else {
        targetPx -= e.deltaX
        targetPy -= e.deltaY
    }
}, {
    passive: false
})

