

const stack = document.getElementById('stack')
const cv_background = document.getElementById('background'),cvx_background = cv_background.getContext('2d')

const cv_overlay = document.getElementById('overlay'),cvx_overlay = cv_overlay.getContext('2d')
const layer_0 = document.getElementById('layer_0')

const animation = [];
let frame_current = 0;
//let frameIndex = frame_current + 1;
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


const timeline = document.querySelector('#timeline_v2');
const timelineBar = document.querySelector('.timeline-bar');


function show(i, overrideSrc) {
  // clear both layers
  clearPixels();
  //~ underCtx.clearRect(0, 0, underlay.width, underlay.height);

  if (!animation || animation.length === 0) return;

  // Collect frames for the active layer
  const layerFrames = animation
    .filter(a => a.layer_name === active_layer.id)
    .sort((a, b) => a.frame - b.frame);

  // Find current frame entry
  const frame = layerFrames.find(f => f.frame === i + 1); // frames are 1-based
  const src = overrideSrc || (frame ? frame.drawing : null);

  //~ // Previous frame ghost (red tint)
  //~ if (showOnionSkin && i > 0) {
    //~ const prevFrame = layerFrames.find(f => f.frame === i);
    //~ if (prevFrame && prevFrame.drawing) {
      //~ tintFrame(prevFrame.drawing, "red", 1, underCtx);
    //~ }
  //~ }

  //~ // Next frame ghost (blue tint)
  //~ if (showOnionSkin) {
    //~ const nextFrame = layerFrames.find(f => f.frame === i + 2);
    //~ if (nextFrame && nextFrame.drawing) {
      //~ tintFrame(nextFrame.drawing, "blue", 1, underCtx);
    //~ }
  //~ }

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

init()

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

function render() {
  const canvases = document.querySelectorAll('#stack canvas');
  const layerCanvases = Array.from(canvases).filter(c => c.id.startsWith('layer'));

  let table = document.createElement('table');

  // Header row
  const headerRow = table.insertRow();
  const headerCell = headerRow.insertCell();
  headerCell.textContent = "Timeline";

  // Always show at least 24 frames
  if (animation && animation.length > 0) {
    maxFrame = Math.max(maxFrame, Math.max(...animation.map(a => a.frame)));
  }

  // Add frame headers
  for (let i = 1; i <= maxFrame; i++) {
    const frameHeader = headerRow.insertCell();
    frameHeader.textContent = i;
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
        //~ console.log(active_layer.id,frame_current,drawing);
        
        const debug_layerName = document.getElementById("debug_layerName");
        debug_layerName.textContent = active_layer.id;
        
        //~ const debug_celName = document.getElementById("debug_celName");
         //~ debug_celName.textContent = frame.layer_name;
        
        
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

  // Jump Keyframes
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
  let fps = parseInt(fpsInput.value, 10);
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







