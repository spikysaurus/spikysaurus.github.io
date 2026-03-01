// GLOBAL CAMERA STATE
window.cameraState = { 
  x: 210, y: 287, rotation: 0, scale: 1, 
  resW: 1920, resH: 1080, 
  showHandles: false 
};

if (!window.cameraKeyframes) window.cameraKeyframes = {};

const cameraFeature = {
  isDraggingCamera: false,
  dragType: null,
  startMouse: { x: 0, y: 0 },
  startState: {},
  hoverType: null,

  lerp(start, end, t) {
    return start + (end - start) * t;
  },

  /**
   * Automatically saves current cameraState into the active frame's keyframe slot
   */
  saveKeyframe(frame) {
    if (frame === undefined) return;
    window.cameraKeyframes[frame] = {
      x: window.cameraState.x,
      y: window.cameraState.y,
      scale: window.cameraState.scale,
      rotation: window.cameraState.rotation
    };
    console.log(`Camera Keyframe saved at frame ${frame}`);
  },

  updateFromKeyframes(frame, force = false) {
    // FIX: Do NOT interpolate if we are currently dragging the handles
    if (this.isDraggingCamera && !force) return;

    const keys = Object.keys(window.cameraKeyframes).map(Number).sort((a, b) => a - b);
    if (keys.length === 0) return;

    let prevKey = keys[0];
    let nextKey = keys[keys.length - 1];

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] <= frame) prevKey = keys[i];
      if (keys[i] >= frame) { nextKey = keys[i]; break; }
    }

    const start = window.cameraKeyframes[prevKey];
    const end = window.cameraKeyframes[nextKey];

    if (prevKey === nextKey || !start || !end) {
      const target = start || end;
      window.cameraState.x = target.x;
      window.cameraState.y = target.y;
      window.cameraState.scale = target.scale;
      window.cameraState.rotation = target.rotation;
      return;
    }

    const t = (frame - prevKey) / (nextKey - prevKey);
    window.cameraState.x = this.lerp(start.x, end.x, t);
    window.cameraState.y = this.lerp(start.y, end.y, t);
    window.cameraState.scale = this.lerp(start.scale, end.scale, t);
    window.cameraState.rotation = this.lerp(start.rotation, end.rotation, t);
  },

  clip(cameraOverlayCtx) {
    const { resW, resH } = window.cameraState;
    cameraOverlayCtx.beginPath();
    cameraOverlayCtx.rect(0, 0, resW, resH);
    cameraOverlayCtx.clip();
  },

  apply(ctx) {
    const { x, y, rotation, scale, resW, resH } = window.cameraState;
    cameraOverlayCtx.translate(resW / 2, resH / 2);
    cameraOverlayCtx.scale(1 / scale, 1 / scale);
    cameraOverlayCtx.rotate(-rotation * Math.PI / 180);
    cameraOverlayCtx.translate(-resW / 2 - x, -resH / 2 - y);
  },

    drawUI(ctx) {
    // REMOVED: if (!window.cameraState.showHandles) return;
    
    const { resW, resH, x, y, scale, rotation, showHandles } = window.cameraState;
    
    cameraOverlayCtx.setTransform(1, 0, 0, 1, 0, 0);
    cameraOverlayCtx.strokeStyle = "cyan";
    cameraOverlayCtx.lineWidth = 5;

    cameraOverlayCtx.save();
    const cx = x + resW * scale / 2, cy = y + resH * scale / 2;
    cameraOverlayCtx.translate(cx, cy);
    cameraOverlayCtx.rotate(rotation * Math.PI / 180);
    
    // ALWAYS DRAW THE OUTLINE
    cameraOverlayCtx.strokeRect(-resW * scale / 2, -resH * scale / 2, resW * scale, resH * scale);

    // ONLY DRAW HANDLES IF showHandles IS TRUE
    if (showHandles) {
      this.drawHandle(ctx, 0, 0); // Center handle
      this.drawHandle(ctx, resW * scale / 2, resH * scale / 2); // Scale handle
      this.drawHandle(ctx, 0, -resH * scale / 2 - 20); // Rotation handle

      if (window.cameraKeyframes[window.activeFrame]) {
        cameraOverlayCtx.fillStyle = "#ffcc00";
        cameraOverlayCtx.beginPath(); 
        cameraOverlayCtx.arc(-resW * scale / 2 + 20, -resH * scale / 2 + 20, 5, 0, Math.PI * 2); 
        cameraOverlayCtx.fill();
        cameraOverlayCtx.font = "12px Arial"; 
        cameraOverlayCtx.fillText("KEY", -resW * scale / 2 + 30, -resH * scale / 2 + 25);
      }
    }
    
    cameraOverlayCtx.restore();
  },

  drawHandle(ctx, x, y) {
    cameraOverlayCtx.fillStyle = "white";
    cameraOverlayCtx.beginPath(); cameraOverlayCtx.arc(x, y, 8, 0, Math.PI * 2); cameraOverlayCtx.fill();
    cameraOverlayCtx.stroke();
  },

  handleMouseDown(e) {
	   if (!window.cameraState.showHandles) return;
    const rect = e.target.getBoundingClientRect();
    const sX = e.target.width / rect.width, sY = e.target.height / rect.height;
    const mx = (e.clientX - rect.left) * sX, my = (e.clientY - rect.top) * sY;
    const { resW, resH, x, y, scale, rotation } = window.cameraState;
    
    const cx = x + resW * scale / 2, cy = y + resH * scale / 2;
    const dx = mx - cx, dy = my - cy;
    const cos = Math.cos(-rotation * Math.PI / 180), sin = Math.sin(-rotation * Math.PI / 180);
    const rx = dx * cos - dy * sin, ry = dx * sin + dy * cos;
    const dist = (a, b) => Math.hypot(rx - a, ry - b);

    if (dist(0, 0) < 30) this.dragType = 'pos';
    else if (dist(resW * scale / 2, resH * scale / 2) < 30) this.dragType = 'scale';
    else if (dist(0, -resH * scale / 2 - 20) < 40) this.dragType = 'rot';
    else return;

    if (window.isDrawing !== undefined) window.isDrawing = false;
    this.isDraggingCamera = true;
    this.startMouse = { x: mx, y: my };
    this.startState = { ...window.cameraState };
    e.preventDefault();
    
  },

  handleMouseMove(e) {
	  
    if (!cameraOverlay) return;
    
    // LOCK CURSOR IF HANDLES ARE HIDDEN
    if (!window.cameraState.showHandles) {
      this.hoverType = null;
      cameraOverlay.style.cursor = 'default';
      return; 
    }
    
    
    const r = cameraOverlay.getBoundingClientRect();
    const sX = cameraOverlay.width / r.width, sY = cameraOverlay.height / r.height;
    const mx = (e.clientX - r.left) * sX, my = (e.clientY - r.top) * sY;
    
    const { resW, resH, x, y, scale, rotation } = window.cameraState;
    const cx = x + resW * scale / 2, cy = y + resH * scale / 2;
    const dx = mx - cx, dy = my - cy;
    const cos = Math.cos(-rotation * Math.PI / 180), sin = Math.sin(-rotation * Math.PI / 180);
    const rx = dx * cos - dy * sin, ry = dx * sin + dy * cos;
    const dist = (a, b) => Math.hypot(rx - a, ry - b);

    if (dist(0, 0) < 30) this.hoverType = 'pos';
    else if (dist(resW * scale / 2, resH * scale / 2) < 30) this.hoverType = 'scale';
    else if (dist(0, -resH * scale / 2 - 20) < 40) this.hoverType = 'rot';
    else this.hoverType = null;

    if (!this.isDraggingCamera) {
	  const cursorStyle =
		this.hoverType === 'pos' ? 'move' :
		this.hoverType === 'scale' ? 'nwse-resize' :
		this.hoverType === 'rot' ? 'crosshair' : 'default';

	  document.body.style.cursor = cursorStyle;
	  return;
	}


    const dxm = mx - this.startMouse.x;
    const dym = my - this.startMouse.y;
    if (this.dragType === 'pos') {
      window.cameraState.x = this.startState.x + dxm;
      window.cameraState.y = this.startState.y + dym;
    } else if (this.dragType === 'scale') {
      window.cameraState.scale = Math.max(0.01, this.startState.scale * (1 + dxm / 300));
    } else if (this.dragType === 'rot') {
      window.cameraState.rotation = this.startState.rotation + dxm * 0.5;
    }
    
  },

  handleMouseUp() {
    if (this.isDraggingCamera) {
        // Automatically update the keyframe when the user finishes dragging
        this.saveKeyframe(window.activeFrame);
        this.isDraggingCamera = false;
        this.dragType = null;
        if (window.xsheetCanvasBridge) window.xsheetCanvasBridge.syncCanvasStack();
    }
  }
};

// INIT OVERLAY
(function() {
  if (!container) return;

  cameraOverlay.width = document.getElementById('canvasWidthInput').value; 
  cameraOverlay.height = document.getElementById('canvasHeightInput').value; 
  
  Object.assign(cameraOverlay.style, {
    //~ zIndex: "100", // Start lower than tools
    backgroundColor: "transparent"
});
  
 
  window.addEventListener("pointerdown", e => cameraFeature.handleMouseDown(e));
  window.addEventListener("pointermove", e => cameraFeature.handleMouseMove(e));
  window.addEventListener("pointerup", () => cameraFeature.handleMouseUp());

  function loop() {
    // Only interpolate if we AREN'T currently dragging
    if (window.activeFrame !== undefined && !cameraFeature.isDraggingCamera) {
        cameraFeature.updateFromKeyframes(window.activeFrame);
    }

    cameraOverlayCtx.clearRect(0, 0, cameraOverlay.width, cameraOverlay.height);
    const mainCanvas = document.getElementById("canvas");
    if (mainCanvas) {
      cameraOverlay.style.top = mainCanvas.style.top;
      cameraOverlay.style.left = mainCanvas.style.left;
      cameraOverlay.style.transform = mainCanvas.style.transform;
    }
    cameraFeature.drawUI(cameraOverlayCtx );
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
