let rectStart = null, rectEnd = null, isRectDrawing = false;
let rectAnimateReq, dashOffsetRect = 0;

// 1. Unique Overlay Setup
const rectOverlay = document.createElement("canvas");
rectOverlay.id = "rectFillOverlay";
rectOverlay.style = "position:absolute; top:0; left:0; pointer-events:none; z-index:100;";
document.body.appendChild(rectOverlay);
const rCtx = rectOverlay.getContext("2d");

function syncRectOverlaySize() {
    const rect = activeCanvas.getBoundingClientRect();
    rectOverlay.width = activeCanvas.width;
    rectOverlay.height = activeCanvas.height;
    rectOverlay.style.width = rect.width + "px";
    rectOverlay.style.height = rect.height + "px";
    rectOverlay.style.left = rect.left + "px";
    rectOverlay.style.top = rect.top + "px";
}

function switchToRectangle(temp = false, erase = false) {
    if (!temp) window.previousTool = "ToolRectangleFill";
    window.activeTool = erase ? "ToolRectangleErase" : "ToolRectangleFill";
    syncRectOverlaySize();
    rectStart = rectEnd = null;
}

// 2. Animated Preview Logic
function drawRectPreview() {
    rCtx.clearRect(0, 0, rectOverlay.width, rectOverlay.height);
    if (!rectStart || !rectEnd) {
        rectAnimateReq = requestAnimationFrame(drawRectPreview);
        return;
    }

    rCtx.save();
    rCtx.imageSmoothingEnabled = false;

    rCtx.translate(
        flipH === -1 ? rectOverlay.width : 0,
        flipV === -1 ? rectOverlay.height : 0
    );
    rCtx.scale(flipH, flipV);

    dashOffsetRect = (dashOffsetRect || 0) - 0.5;

    const x = Math.min(rectStart.x, rectEnd.x);
    const y = Math.min(rectStart.y, rectEnd.y);
    const w = Math.abs(rectEnd.x - rectStart.x);
    const h = Math.abs(rectEnd.y - rectStart.y);

    rCtx.setLineDash([5, 5]);
    rCtx.linedashOffsetRect = dashOffsetRect;
    rCtx.strokeStyle = "blue";
    rCtx.strokeRect(x, y, w, h);

    rCtx.strokeStyle = "black";
    rCtx.linedashOffsetRect = dashOffsetRect + 5;
    rCtx.strokeRect(x, y, w, h);

    rCtx.restore();
    rectAnimateReq = requestAnimationFrame(drawRectPreview);
}

// 3. Pointer Events
window.addEventListener("pointerdown", e => {
    if (!["ToolRectangleFill", "ToolRectangleErase"].includes(activeTool) || !activeDrawing) return;
    syncRectOverlaySize();
    isRectDrawing = true;
    rectStart = getMousePos(e);
    rectEnd = rectStart;
    drawRectPreview();
});

window.addEventListener("pointermove", e => {
    if (!isRectDrawing) return;
    
    let pos = getMousePos(e);

    if (e.shiftKey && rectStart) {
        let dx = pos.x - rectStart.x;
        let dy = pos.y - rectStart.y;
        
        // Calculate 16:9 height based on current width
        let absW = Math.abs(dx);
        let newH = absW * (9 / 16);
        
        // Preserve the drag direction (up/down)
        pos.y = rectStart.y + (dy >= 0 ? newH : -newH);
    }

    rectEnd = pos;
});


window.addEventListener("pointerup", e => {
    if (!isRectDrawing) return;
    isRectDrawing = false;
    cancelAnimationFrame(rectAnimateReq);
    rCtx.clearRect(0, 0, rectOverlay.width, rectOverlay.height);

    if (rectStart && rectEnd) {
        // Pass the shiftKey state if you want to force one last snap
        applyRectFill(e.ctrlKey || activeTool === "ToolRectangleErase", e.shiftKey);
    }
    rectStart = rectEnd = null;
});


function applyRectFill(isErase, isShift = false) {
    const ctx = activeCanvasCtx;
    if (!ctx) return;

    // 1. Calculate Coordinates
    let startX = rectStart.x;
    let startY = rectStart.y;
    let endX = rectEnd.x;
    let endY = rectEnd.y;

    if (isShift) {
        const dx = endX - startX;
        const dy = endY - startY;
        const constrainedHeight = Math.abs(dx) * (9 / 16);
        endY = startY + (dy >= 0 ? constrainedHeight : -constrainedHeight);
    }

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    // 2. Setup Drawing Styles
    ctx.save();
    
    if (isErase) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(x, y, width, height);
    } else {
        // Fill logic
        ctx.fillStyle = window.colorPicker?.activeColorBackground || "#000000";
        ctx.globalAlpha = window.brush_opacity || 1;
        ctx.fillRect(x, y, width, height);

        // Stroke (Outline) logic
        ctx.strokeStyle = window.colorPicker?.activeColor || "#ffffff";
        ctx.lineWidth = brush_size ; 
        // Offset by 0.5 to ensure a crisp 1px line on canvas
        ctx.strokeRect(x + 0.5, y + 0.5, width, height);
    }

    ctx.restore();

    // 3. Sync State
    if (window.activeDrawing) {
        window.activeDrawing.data = ctx.canvas.toDataURL("image/png");
    }
}




