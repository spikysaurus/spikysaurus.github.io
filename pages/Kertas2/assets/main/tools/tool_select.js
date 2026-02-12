
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
