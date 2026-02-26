let activeTool = "ToolBrush"; 
let previousTool = "ToolBrush";
let isDrawing = false;
let isDragging = false; 
let brush_size = 1;
let eraser_size = 15;
let brush_opacity = 1;
let brush_aliasing = true;
let drawBehind; 

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


// --- Shortcuts & Utility ---

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

