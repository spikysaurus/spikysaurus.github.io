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

const brushCursor = document.getElementById('brushCursor');

function updateCursorSize() {
  if (!brushCursor) return;
  
  // Calculate size based on current tool and zoom scale
  // startScale is current zoom level
  const size = (activeTool === "ToolEraser" ? eraser_size : brush_size) * startScale;
  
  brushCursor.style.width = `${size}px`;
  brushCursor.style.height = `${size}px`;
  
  // Change shape for Aliased (Pixel) vs Smooth (Circle)
  brushCursor.style.borderRadius = brush_aliasing ? "0" : "50%";
}
