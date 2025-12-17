const bg = document.getElementById('bg'),
    bgx = bg.getContext('2d')
const cv_checkerboard = document.getElementById('checkerboard'),
    cvx_checkerboard = cv_checkerboard.getContext('2d')
const dr = document.getElementById('draw'),
    drx = dr.getContext('2d')
    drx.imageSmoothingEnabled = false;
const overlay = document.getElementById('overlay'),
    ox = overlay.getContext('2d')
const stack = document.getElementById('stack')
const sz = document.getElementById('sz'),
    op = document.getElementById('op'),
    col = document.getElementById('col')


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
const frames = [];
let cur = 0

let ToolSelect = false,selStartX, selStartY, selEndX, selEndY;
let ToolFill = false; 
let ToolPan = false;

const ToolPanBtn = document.getElementById('ToolPanBtn')
const ToolSelectBtn = document.getElementById('ToolSelectBtn');
const ToolFillBtn = document.getElementById("ToolFillBtn");

const onionBtn = document.getElementById('onionBtn')
const toggleBtn = document.getElementById('toggleLabel');
const settings = document.getElementById('settings');
const checkerboardBtn = document.getElementById('checkerboardBtn');


// Tool state
let tools = [
	{ name: "ToolBrush",   active: true, btn: ToolBrushBtn },
	{ name: "ToolEraser",   active: false, btn: ToolEraserBtn },
  { name: "ToolFill",   active: false, btn: ToolFillBtn },
  { name: "ToolLassoFill",   active: false, btn: ToolLassoFillBtn },
  { name: "ToolSelect", active: false, btn: ToolSelectBtn },
  { name: "ToolPan",    active: false, btn: ToolPanBtn }
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
  const w = dr.width, h = dr.height;
  const imageData = drx.getImageData(0, 0, w, h);
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

      if (px > 0) stack.push([px-1, py]);
      if (px < w-1) stack.push([px+1, py]);
      if (py > 0) stack.push([px, py-1]);
      if (py < h-1) stack.push([px, py+1]);
    }
  }

  drx.putImageData(imageData, 0, 0);
}

// Fill Tool handlers
dr.addEventListener("pointerdown", e => {
 if (activeTool != "ToolFill") return; // only fill if enabled

 const rect = dr.getBoundingClientRect();

 // Map screen coords back to canvas pixel coords
 const scaleX = dr.width / rect.width;
 const scaleY = dr.height / rect.height;

 const x = Math.floor((e.clientX - rect.left) * scaleX);
 const y = Math.floor((e.clientY - rect.top) * scaleY);

 fill(x, y, col.value, 0); // fill with chosen color
});

// --- Globals for lasso ---
let lassoPoints = [];
let isLassoing = false;
let lassoEraseMode = false; // default: fill mode

// --- Toggle button ---
const ToolLassoFillToggle = document.getElementById("ToolLassoFillToggle");

ToolLassoFillToggle .addEventListener("click", () => {
  lassoEraseMode = !lassoEraseMode;
  // update button label or style
  ToolLassoFillToggle.textContent = lassoEraseMode ? "Erase" : "Fill";
});

// --- Lasso tool handlers ---
dr.addEventListener("pointerdown", e => {
  if (activeTool !== "ToolLassoFill") return;

  const rect = dr.getBoundingClientRect();
  const scaleX = dr.width / rect.width;
  const scaleY = dr.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  lassoPoints = [{ x, y }];
  isLassoing = true;
});


let rainbowOffset = 0; // animation phase

dr.addEventListener("pointermove", e => {
  if (activeTool !== "ToolLassoFill" || !isLassoing) return;

  const rect = dr.getBoundingClientRect();
  const scaleX = dr.width / rect.width;
  const scaleY = dr.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  lassoPoints.push({ x, y });

  // clear overlay
  ox.clearRect(0, 0, overlay.width, overlay.height);

  // create animated rainbow gradient
  const gradient = ox.createLinearGradient(0, 0, overlay.width, 0);
  for (let i = 0; i <= 6; i++) {
    const hue = (rainbowOffset + i * 60) % 360;
    gradient.addColorStop(i / 6, `hsl(${hue}, 100%, 50%)`);
  }
  ox.strokeStyle = gradient;
  ox.lineWidth = 2;

  // draw lasso path
  ox.beginPath();
  ox.moveTo(lassoPoints[0].x, lassoPoints[0].y);
  for (let i = 1; i < lassoPoints.length; i++) {
    ox.lineTo(lassoPoints[i].x, lassoPoints[i].y);
  }
  ox.stroke();

  // advance rainbow animation
  rainbowOffset = (rainbowOffset + 5) % 360; // 5 is speed
});


dr.addEventListener("pointerup", e => {
  if (activeTool !== "ToolLassoFill" || !isLassoing) return;
  isLassoing = false;

  ox.clearRect(0, 0, overlay.width, overlay.height);

  const ctx = drx; // main drawing context
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
  for (let i = 1; i < lassoPoints.length; i++) {
    ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
  }
  ctx.closePath();
  ctx.clip();

  if (lassoEraseMode) {
    // erase inside lasso
    ctx.clearRect(0, 0, dr.width, dr.height);
  } else {
    // fill inside lasso
    ctx.fillStyle = col.value;
    ctx.fillRect(0, 0, dr.width, dr.height);
  }

  ctx.restore();

  lassoPoints = [];
  frames[cur] = dr.toDataURL();
  render();
});


 
// --- RESIZE STRETCH ---
function resize(w, h) {
    const snapshot = new Image();
    snapshot.src = dr.toDataURL();

	cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    
    bg.width = w;
    bg.height = h;
    dr.width = w;
    dr.height = h;
    
    overlay.width = w;
    overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        // Stretch to fit new size
        drx.drawImage(snapshot, 0, 0, w, h);
    };

    document.getElementById('canvasWidth').value = w;
    document.getElementById('canvasHeight').value = h;
}

// --- RESIZE ANCHOR PRESERVE ---
function resizeAnchor(w, h, anchor = "top-left") {
    const snapshot = new Image();
    snapshot.src = dr.toDataURL();

    const oldW = dr.width;
    const oldH = dr.height;

	cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    
    bg.width = w;
    bg.height = h;
    dr.width = w;
    dr.height = h;
    
    overlay.width = w;
    overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        let offsetX = 0, offsetY = 0;
        if (anchor.includes("right")) offsetX = w - oldW;
        if (anchor.includes("bottom")) offsetY = h - oldH;
        // Draw at original size (no stretch)
        drx.drawImage(snapshot, offsetX, offsetY);
    };

    document.getElementById('canvasWidth').value = w;
    document.getElementById('canvasHeight').value = h;
}


// --- RESIZE CENTER PRESERVE ---
function resizeCenter(w, h) {
    const snapshot = new Image();
    snapshot.src = dr.toDataURL();

    const oldW = dr.width;
    const oldH = dr.height;
		
		cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    bg.width = w;
    bg.height = h;
    dr.width = w;
    dr.height = h;
    overlay.width = w;
    overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        // Center the old drawing
        const offsetX = (w - oldW) / 2;
        const offsetY = (h - oldH) / 2;
        drx.drawImage(snapshot, offsetX, offsetY);
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
        frames[cur] = dr.toDataURL();
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
    drx.clearRect(0, 0, dr.width, dr.height);
    frames.push(dr.toDataURL());
    cur = frames.length - 1;
    render()
}
resize(640, 360);
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
const AliasedBtn = document.getElementById('aliased');
AliasedBtn.onclick = () => {
    aliased = !aliased;
    if (!aliased) {
        AliasedBtn.style.backgroundColor = "gray";
        useAliased = true;
        
    } else {
		AliasedBtn.style.backgroundColor = "";
      useAliased = false;
    }
};

//Painting
function circ(x, y, s, c, a) {
  drx.globalAlpha = a;

  if (activeTool == "ToolEraser") {
      drx.globalCompositeOperation = 'destination-out';
      drx.fillStyle = 'rgba(0,0,0,1)'; // <-- can just use any solid color
  } else {
      drx.globalCompositeOperation = 'source-over';
      drx.fillStyle = c;
  }

  if (useAliased) {
      const r = Math.floor(s / 2);
      for (let py = -r; py <= r; py++) {
          for (let px = -r; px <= r; px++) {
              if (px * px + py * py <= r * r) {
                  drx.fillRect(Math.round(x + px), Math.round(y + py), 1, 1);
              }
          }
      }
  } else {
      drx.beginPath();
      drx.arc(x, y, s / 2, 0, Math.PI * 2);
      drx.fill();
  }

  drx.globalAlpha = 1;
  drx.globalCompositeOperation = 'source-over'; // reset after erasing
    
}

function line(x0, y0, x1, y1, s, c, a) {
	
    const dx = x1 - x0,
          dy = y1 - y0,
          d = Math.hypot(dx, dy),
          // smaller step size ensures overlap
          st = Math.ceil(d / (s / 3));  
    for (let i = 0; i <= st; i++) {
        const t = i / st;
        circ(x0 + dx * t, y0 + dy * t, s, c, a);
    }
    
    
}



dr.onpointermove = e => {
    if (activeTool == "ToolPan") return;
    if (drawing) {
        const { x, y } = getCanvasCoords(e, dr);
        
        line(lx, ly, x, y, parseInt(sz.value), col.value, parseFloat(op.value).toFixed(2));
        lx = x;
        ly = y;
    }
};

dr.onpointerup = e => {
    if (activeTool == "ToolPan") return;
    drawing = false;
    frames[cur] = dr.toDataURL();
    render();
};


dr.onpointereave = () => {
    drawing = false
}
document.addEventListener('pointerdown', e => {
    if (activeTool != "ToolPan") return;
    psx = e.clientX - targetPx;
    psy = e.clientY - targetPy;
    document.body.style.cursor = 'grab'
})
document.addEventListener('pointermove', e => {
    if (activeTool != "ToolPan") return;
    if (e.buttons !== 1) return;
    targetPx = e.clientX - psx;
    targetPy = e.clientY - psy
})
document.addEventListener('pointerup', () => {
    if (activeTool != "ToolPan") return;
    document.body.style.cursor = 'default'
})

//ToolPan
document.addEventListener('pointerstart', e => {
    if (e.length === 2) {
        const dx = e[0].clientX - e[1].clientX
        const dy = e[0].clientY - e[1].clientY
        sd = Math.hypot(dx, dy)
    }
    if (e.length === 3) {
        punStartX = e[0].clientX - targetPx
        punStartY = e[0].clientY - targetPy
    }
}, {
    passive: true
})
document.addEventListener('pointermove', e => {
    if (e.length === 2) {
        const dx = e[0].clientX - e[1].clientX
        const dy = e[0].clientY - e[1].clientY
        const nd = Math.hypot(dx, dy)
        const f = nd / sd
        targetSc = Math.min(Math.max(targetSc * f, 0.5), 3)
        sd = nd
    }
    if (e.length === 3) {
        targetPx = e[0].clientX - punStartX
        targetPy = e[0].clientY - punStartY
    }
}, {
    passive: true
})
//zoomIn.onclick = () => {
// targetSc *= 1.1
//}
//zoomOut.onclick = () => {
// targetSc *= 0.9
//}

let zoomInterval;

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




dr.onpointerdown = e => {
    if (activeTool == "ToolBrush" || activeTool == "ToolEraser"){
    drawing = true;
    lx = e.offsetX;
    ly = e.offsetY;
    circ(lx, ly, parseInt(sz.value), col.value, parseFloat(op.value));
    }
};
dr.onpointermove = e => {
    if (activeTool == "ToolBrush" || activeTool == "ToolEraser"){
    if (drawing) {
        line(lx, ly, e.offsetX, e.offsetY, parseInt(sz.value), col.value, parseFloat(op.value));
        lx = e.offsetX;
        ly = e.offsetY;
    }
    }
};
dr.onpointerup = () => {
if (activeTool == "ToolBrush" || activeTool == "ToolEraser"){
    drawing = false;
    frames[cur] = dr.toDataURL();
    render();
    }
};
dr.onpointerleave = () => {
    drawing = false
};

// --- Globals ---
//let selStartX = null, selStartY = null, selEndX = null, selEndY = null;
let isDraggingHandle = false;
let dragStartX = 0, dragStartY = 0;
let frozenStartX = 0, frozenStartY = 0, frozenEndX = 0, frozenEndY = 0;
//let clipboard = null;

// --- Selection handlers ---
dr.addEventListener('pointerdown', e => {
  if (activeTool !== "ToolSelect") return;
  const { x, y } = getCanvasCoords(e, dr);

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


dr.addEventListener('pointermove', e => {
  if (activeTool !== "ToolSelect") return;
  const { x, y } = getCanvasCoords(e, dr);

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

  ox.clearRect(0, 0, overlay.width, overlay.height);

  // fill if pressure
  if (e.pressure > 0) {
    ox.fillStyle = 'rgba(128,0,128,0.2)';
    ox.fillRect(selStartX, selStartY, selEndX - selStartX, selEndY - selStartY);
    ox.setLineDash([6, 4]);
  }
  // 🌈 rainbow stroke
  const gradient = ox.createLinearGradient(selStartX, selStartY, selEndX, selEndY);
  for (let i = 0; i <= 6; i++) {
    const hue = (rainbowOffset + i * 60) % 360;
    gradient.addColorStop(i / 6, `hsl(${hue}, 100%, 50%)`);
  }
  ox.strokeStyle = gradient;
  ox.lineWidth = 2;
  ox.strokeRect(selStartX, selStartY, selEndX - selStartX, selEndY - selStartY);

  // draw center handle
  const w = selEndX - selStartX;
  const h = selEndY - selStartY;
  const centerX = selStartX + w / 2;
  const centerY = selStartY + h / 2;
  ox.fillStyle = gradient;
  ox.beginPath();
  ox.arc(centerX, centerY, 6, 0, Math.PI * 2);
  ox.fill();

  // advance rainbow animation
  rainbowOffset = (rainbowOffset + 5) % 360; // adjust speed here
});

dr.addEventListener('pointerup', e => {
  if (activeTool !== "ToolSelect") return;

  if (isDraggingHandle) {
    // stop dragging, don't overwrite selEndX/Y with pointer position
    isDraggingHandle = false;
    return;
  }

  // normal selection finalize
  const { x, y } = getCanvasCoords(e, dr);
  selEndX = x; selEndY = y;

  const w = Math.abs(selEndX - selStartX);
  const h = Math.abs(selEndY - selStartY);
  if (w < 5 || h < 5) {
    ox.clearRect(0, 0, overlay.width, overlay.height);
    selStartX = null;
    selStartY = null;
    selEndX   = null;
    selEndY   = null;
  }
});

// --- Freehand drawing handlers ---
dr.addEventListener('pointerdown', e => {
  if (["pen","touch","mouse"].includes(e.pointerType)) {
    drawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
  }
});

dr.addEventListener('pointermove', e => {
  if (!drawing) return;
  if (["pen","touch","mouse"].includes(e.pointerType)) {
    // ctx.lineTo(e.offsetX, e.offsetY);
    // ctx.stroke();
    lastX = e.offsetX;
    lastY = e.offsetY;
  }
});

dr.addEventListener('pointerup', e => {
  drawing = false;
});


// Copy selected region
document.getElementById('copy').onclick = () => {
    if (selStartX != null) {
//    		ox.clearRect(0, 0, overlay.width, overlay.height);
        const w = selEndX - selStartX;
        const h = selEndY - selStartY;
        if (w && h) {
            const tmp = document.createElement('canvas');
            tmp.width = Math.abs(w);
            tmp.height = Math.abs(h);
            const ctx = tmp.getContext('2d');
            ctx.drawImage(dr, Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(w), Math.abs(h), 0, 0, Math.abs(w), Math.abs(h));
            clipboard = tmp;
        }
    }
};

// Delete
document.getElementById('delete').onclick = () => {
	drx.clearRect(Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(selEndX - selStartX), Math.abs(selEndY - selStartY));
	frames[cur] = dr.toDataURL();
	render();
};

// Cut = copy + delete
document.getElementById('cut').onclick = () => {
	document.getElementById('copy').onclick();
	document.getElementById('delete').onclick();
//	drx.clearRect(Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(selEndX - selStartX), Math.abs(selEndY - selStartY));
//	frames[cur] = dr.toDataURL();
//	render();
};


// --- Paste clipboard into current selection ---
document.getElementById('paste').onclick = () => {
  if (clipboard && selStartX != null && selEndX != null) {
    // compute selection bounds
    const w = selEndX - selStartX;
    const h = selEndY - selStartY;

    // clear overlay
//    ox.clearRect(0, 0, overlay.width, overlay.height);

    // draw clipboard image scaled to fit selection
    drx.drawImage(
      clipboard,
      0, 0, clipboard.width, clipboard.height, // source
      Math.min(selStartX, selEndX),
      Math.min(selStartY, selEndY),
      Math.abs(w),
      Math.abs(h) // destination size
    );

    frames[cur] = dr.toDataURL();
    render();
  }
};





document.getElementById('clr').onclick = () => {
    const confirmClear = confirm("Clear the canvas?");
    if (confirmClear) {
        drx.clearRect(0, 0, dr.width, dr.height);
        frames[cur] = dr.toDataURL();
        render();
    }
};

//Save Button
document.getElementById('save').onclick = () => {
    const tmp = document.createElement('canvas');
    tmp.width = bg.width;
    tmp.height = bg.height;
    const tx = tmp.getContext('2d');
    tx.drawImage(bg, 0, 0);
    tx.drawImage(dr, 0, 0);
    const link = document.createElement('a');
    link.download = 'img.png';
    link.href = tmp.toDataURL();
    link.click()
}



// Swap with next frame
document.getElementById('swapNext').onclick = () => {
    if (frames.length > 1) {
        const nextIndex = (cur + 1) % frames.length;
        const temp = frames[cur];
        frames[cur] = frames[nextIndex];
        frames[nextIndex] = temp;

        cur = nextIndex; // update pointer
        show(cur);
        render();
    }
};

// Swap with previous frame
document.getElementById('swapPrev').onclick = () => {
    if (frames.length > 1) {
        const prevIndex = (cur - 1 + frames.length) % frames.length;
        const temp = frames[cur];
        frames[cur] = frames[prevIndex];
        frames[prevIndex] = temp;

        cur = prevIndex; // update pointer
        show(cur);
        render();
    }
};

//Drag and drop frmae
function render() {
    const tl = document.getElementById('line')
    tl.innerHTML = ''
    frames.forEach((f, i) => {
        const d = document.createElement('div')
        d.className = 'f' + (i === cur ? ' active' : '')
        d.textContent = i + 1
        d.draggable = true
        d.dataset.index = i
        d.onclick = () => {
            cur = i;
            show(i);
            render()
        }
        d.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', i)
        })
        d.addEventListener('dragover', e => {
            e.preventDefault()
        })
        d.addEventListener('drop', e => {
            e.preventDefault()
            const from = parseInt(e.dataTransfer.getData('text/plain'))
            const to = parseInt(d.dataset.index)
            if (from !== to) {
                const moved = frames.splice(from, 1)[0]
                frames.splice(to, 0, moved)
                if (cur === from) cur = to
                else if (from < cur && to >= cur) cur--
                else if (from > cur && to <= cur) cur++
                render()
            }
        })
        tl.appendChild(d)
    })
}

//function show(i) {
//    if (frames[i]) {
//        const img = new Image();
//        img.onload = () => {
//            drx.clearRect(0, 0, dr.width, dr.height);
//            drx.drawImage(img, 0, 0)
//        };
//        img.src = frames[i]
//    }
//}
//Export JSON
document.getElementById('export').onclick = () => {
    const bgUrl = document.getElementById('url').value.trim()
    const data = {
        background: bgUrl, // store the image URL input
        frames: frames.map((f, i) => ({
            index: i,
            url: f
        }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    })
    const link = document.createElement('a')
    link.download = "document.json"
    link.href = URL.createObjectURL(blob)
    link.click()
}

// Import JSON
document.getElementById('import').onclick = () => {
    const input = document.createElement('input');
    input.type = "file";
    input.accept = "application/json";
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const obj = JSON.parse(reader.result);

                // Restore background
                if (obj.background) {
                    document.getElementById('url').value = obj.background;
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = obj.background;
                    img.onload = () => {
                        const w = obj.width || img.width;
                        const h = obj.height || img.height;
                        resize(w, h);

                        // Update input fields
                        document.getElementById('canvasWidth').value = w;
                        document.getElementById('canvasHeight').value = h;

                        bgx.clearRect(0, 0, bg.width, bg.height);
                        bgx.drawImage(img, 0, 0, w, h);
                        drx.clearRect(0, 0, dr.width, dr.height);
                    };
                } else if (obj.width && obj.height) {
                    // Resize even if no background image
                    resize(obj.width, obj.height);

                    // Update input fields
                    document.getElementById('canvasWidth').value = obj.width;
                    document.getElementById('canvasHeight').value = obj.height;
                }

                // Restore frames
                if (obj.frames) {
                    frames.length = 0;
                    obj.frames.forEach(f => frames.push(f.url));
                    cur = 0;
                    show(cur);
                    render();
                }

            } catch (err) {
                console.error("Invalid JSON", err);
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

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

// Helper: composite background + frame into a dataURL
async function composeFrame(bgUrl, frameUrl, outW, outH) {
    const can = document.createElement('canvas')
    can.width = outW
    can.height = outH
    const ctx = can.getContext('2d')
    // Fill transparent background to avoid PDF black page
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, outW, outH)
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
    return can.toDataURL("image/jpeg", 0.92) // smaller PDF size; use PNG if needed
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

document.getElementById('add').onclick = add
// Add Frame
function add() {
    drx.clearRect(0, 0, dr.width, dr.height);
    frames.push(dr.toDataURL());
    cur = frames.length - 1;
    render();
    show(cur);
}

// Delete Frame
document.getElementById('deleteFrame').onclick = deleteFrame;

function deleteFrame() {
  if (frames.length === 0) return; // nothing to delete

  const confirmDelete = confirm("Are you sure you want to delete this frame?");
  if (!confirmDelete) return;

  // remove current frame
  frames.splice(cur, 1);
  if (frames.length === 0) {
    add()
  } else {
    // adjust current index
    if (cur >= frames.length) {
      cur = frames.length - 1;
    }
  }

  render();
  show(cur);
}



document.getElementById('load').onclick = () => {
    const u = document.getElementById('url').value.trim();
    if (!u) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        resize(img.width, img.height);
        bgx.clearRect(0, 0, bg.width, bg.height);
        bgx.drawImage(img, 0, 0);
        drx.clearRect(0, 0, dr.width, dr.height);
        frames[cur] = dr.toDataURL();
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
        width: dr.width,
        height: dr.height,
        transparent: null // disable transparency → solid background
    });

    let loadedCount = 0;

    frames.forEach((frameDataUrl, idx) => {
        const img = new Image();
        img.src = frameDataUrl;

        img.onload = () => {
            // Draw onto a temp canvas to ensure background is filled
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = dr.width;
            tempCanvas.height = dr.height;
            const tempCtx = tempCanvas.getContext("2d");

            // Fill background (white here, change if needed)
            tempCtx.fillStyle = "#ffffff";
            tempCtx.fillRect(0, 0, dr.width, dr.height);

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

playBtn.onclick = () => {
    if (playing) {
        stoToolPanimation();
        playBtn_icon.classList.replace('bl-icons-pause', 'bl-icons-play');
        show(cur);
//        render();
        
    } else {
        playAnimation();
        playBtn_icon.classList.replace('bl-icons-play', 'bl-icons-pause');	
    }
    
};

function playAnimation() {
    if (!frames.length) {
        alert("No frames to play!");
        return;
    }
    playing = true;
    
    playIndex = 0;
    nextFrame();
}

function stoToolPanimation() {
    playing = false;
    clearTimeout(playTimer);
}

function nextFrame() {
    if (!playing) return;

    const frame = frames[playIndex];
    const img = new Image();
    img.src = frame.src || frame; // handle if frames[] is just dataURLs

    img.onload = () => {
        // clear and draw current frame
        drx.clearRect(0, 0, dr.width, dr.height);
        drx.drawImage(img, 0, 0);

        // read FPS from input, convert to ms per frame
        let fps = parseInt(GifDelay.value, 10);
        if (isNaN(fps) || fps <= 0) fps = 5; // fallback default FPS
        const delayMs = 1000 / fps;

        // schedule next frame
        playTimer = setTimeout(() => {
            playIndex = (playIndex + 1) % frames.length;
            nextFrame();
        }, delayMs);
    };
}

// Next Prev Frame
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

prevBtn.addEventListener('click', () => {
    if (frames.length === 0) return;
    cur = (cur - 1 + frames.length) % frames.length; // wrap backwards
    render();   // update timeline highlight
    show(cur);  // draw selected frame
});

nextBtn.addEventListener('click', () => {
    if (frames.length === 0) return;
    cur = (cur + 1) % frames.length; // wrap forwards
    render();   // update timeline highlight
    show(cur);  // draw selected frame
});


//Duplicate Frame
document.getElementById("duplicateBtn").onclick = duplicateFrame;

function duplicateFrame() {
    if (frames.length === 0) {
        alert("No frames to duplicate!");
        return;
    }

    // Get current frame
    const currentFrame = frames[cur];

    // Create a shallow copy (if frames are objects with src+delay, clone it)
    const newFrame = typeof currentFrame === "object"
        ? { ...currentFrame }
        : currentFrame;

    // Insert duplicate right after current frame
    frames.splice(cur + 1, 0, newFrame);

    // Auto-select the new duplicated frame
    cur = cur + 1;

    // Re-render UI / canvas preview
    render();
    show(cur);
}

//Onion Skin
// Create two canvases: underlay (for onion skin) and main (for current frame)
const underlay = document.createElement("canvas");
underlay.width = dr.width;
underlay.height = dr.height;
const underCtx = underlay.getContext("2d");

// dr is main canvas
// 'drx' is its context
// We'll stack them in the DOM so underlay is behind main
dr.parentNode.insertBefore(underlay, dr);
dr.style.position = "absolute";
underlay.style.position = "absolute";

// Onion Skin toggle
let showOnionSkin = false;
function show(i) {
    // clear both layers
    drx.clearRect(0, 0, dr.width, dr.height);
    underCtx.clearRect(0, 0, underlay.width, underlay.height);

    // previous frame ghost (red tint) on underlay
    if (showOnionSkin && i > 0 && frames[i - 1]) {
        tintFrame(frames[i - 1], "red", 1, underCtx);
    }

    // next frame ghost (blue tint) on underlay
    if (showOnionSkin && i < frames.length - 1 && frames[i + 1]) {
        tintFrame(frames[i + 1], "blue", 1, underCtx);
    }

    // current frame full opacity on main canvas
    if (frames[i]) {
        const img = new Image();
        img.onload = () => {
            drx.save();
            drx.globalAlpha = 1.0;
            drx.drawImage(img, 0, 0);
            drx.restore();
        };
        img.src = frames[i];
    }
}

function tintFrame(src, color, alpha, ctx) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        // offscreen canvas for tinting
        const off = document.createElement("canvas");
        off.width = dr.width;
        off.height = dr.height;
        const offCtx = off.getContext("2d");

        offCtx.drawImage(img, 0, 0);

        const imageData = offCtx.getImageData(0, 0, dr.width, dr.height);
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

        // draw tinted frame onto underlay canvas
        ctx.save();
        ctx.globalAlpha = 0.2; // ghost opacity
        ctx.drawImage(off, 0, 0);
        ctx.restore();
    };
}


onionBtn.addEventListener("click", () => {
    	
      showOnionSkin = !showOnionSkin;
		 if (showOnionSkin) {
		 		show(cur);
		     onionBtn.style.backgroundColor = "yellow";
		     
		 } else {
		 show(cur);
			onionBtn.style.backgroundColor = "";
		 }
    });
    


settings.style.display = 'none';
toggleBtn.onclick = () => {
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


// Update activeTool UI
function updateUI() {
  tools.forEach(tool => {
    tool.btn.style.backgroundColor = tool.active ? "yellow" : "";
  });
}

// Tool events
ToolBrushBtn.addEventListener("click", () => setActiveTool("ToolBrush"));
ToolEraserBtn.addEventListener("click", () => setActiveTool("ToolEraser"));
ToolFillBtn.addEventListener("click", () => setActiveTool("ToolFill"));
ToolLassoFillBtn.addEventListener("click", () => setActiveTool("ToolLassoFill"));
ToolSelectBtn.addEventListener("click", () => setActiveTool("ToolSelect"));
ToolPanBtn.addEventListener("click", () => setActiveTool("ToolPan"));


