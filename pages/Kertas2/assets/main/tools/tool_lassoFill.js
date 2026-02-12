
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
