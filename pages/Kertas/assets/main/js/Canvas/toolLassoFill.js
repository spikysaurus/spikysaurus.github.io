let lassoPoints = [], isLassoDrawing = false, lassoAnimateReq;

// 1. Unique Overlay Setup
const lassoOverlay = document.createElement("canvas");
lassoOverlay.id = "lassoFillOverlay";
lassoOverlay.style = "position:absolute; top:0; left:0; pointer-events:none; z-index:100;";
document.body.appendChild(lassoOverlay); // Or append to your canvas container
const lCtx = lassoOverlay.getContext("2d");

function syncOverlaySize() {
    const rect = activeCanvas.getBoundingClientRect();
    // Use internal resolution for drawing
    lassoOverlay.width = activeCanvas.width;
    lassoOverlay.height = activeCanvas.height;

    // Use CSS rect for visual alignment
    lassoOverlay.style.width = rect.width + "px";
    lassoOverlay.style.height = rect.height + "px";
    lassoOverlay.style.left = rect.left + "px";
    lassoOverlay.style.top = rect.top + "px";
}

function switchToLasso(temp = false, erase = false) {
    if (!temp) window.previousTool = "ToolLassoFill";
    window.activeTool = erase ? "ToolLassoErase" : "ToolLassoFill";
    syncOverlaySize();
    lassoPoints = [];
}

// 2. Animated Preview Logic
let dashOffset = 0;

function drawLassoPreview() {
    lCtx.clearRect(0, 0, lassoOverlay.width, lassoOverlay.height);
    if (lassoPoints.length < 2) {
        requestAnimationFrame(drawLassoPreview);
        return;
    }

    lCtx.save();
    lCtx.imageSmoothingEnabled = false;

    // Apply flips to overlay context
    lCtx.translate(
        flipH === -1 ? lassoOverlay.width : 0,
        flipV === -1 ? lassoOverlay.height : 0
    );
    lCtx.scale(flipH, flipV);

    // Animate dash offset
    dashOffset = (dashOffset || 0) - 0.5;

    lCtx.setLineDash([5, 5]);
    lCtx.lineDashOffset = dashOffset;
    lCtx.strokeStyle = "blue";
    lCtx.beginPath();
    lassoPoints.forEach((p, i) => i === 0 ? lCtx.moveTo(p.x, p.y) : lCtx.lineTo(p.x, p.y));
    lCtx.closePath();
    lCtx.stroke();

    lCtx.strokeStyle = "black";
    lCtx.lineDashOffset = dashOffset + 5;
    lCtx.stroke();

    lCtx.restore();
    requestAnimationFrame(drawLassoPreview);
}



window.addEventListener("pointerdown", e => {
    if (!["ToolLassoFill", "ToolLassoErase"].includes(activeTool) || !activeDrawing) return;
    syncOverlaySize();
    isLassoDrawing = true;
    lassoPoints = [getMousePos(e)];
    drawLassoPreview();
});

window.addEventListener("pointermove", e => {
    if (isLassoDrawing) lassoPoints.push(getMousePos(e));
});

window.addEventListener("pointerup", e => {
    if (!isLassoDrawing) return;
    isLassoDrawing = false;
    cancelAnimationFrame(lassoAnimateReq);
    lCtx.clearRect(0, 0, lassoOverlay.width, lassoOverlay.height);
    
    if (lassoPoints.length > 2) {
        applyPixelatedFill(e.ctrlKey || activeTool === "ToolLassoErase");
    }
    lassoPoints = [];
});

// 3. Pixelated Scanline Fill
function applyPixelatedFill(isErase) {
    const ctx = activeCanvasCtx, w = ctx.canvas.width, h = ctx.canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h), data = imgData.data;
    
    const dummy = document.createElement("canvas").getContext("2d");
    dummy.fillStyle = window.colorPicker.activeColor;
    dummy.fillRect(0,0,1,1);
    const [r, g, b] = dummy.getImageData(0,0,1,1).data;
    const a = Math.floor((window.brush_opacity || 1) * 255);

    for (let y = 0; y < h; y++) {
        let nodes = [];
        for (let i = 0; i < lassoPoints.length; i++) {
            let p1 = lassoPoints[i], p2 = lassoPoints[(i + 1) % lassoPoints.length];
            if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                nodes.push(p1.x + (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y));
            }
        }
        nodes.sort((a, b) => a - b);
        for (let i = 0; i < nodes.length; i += 2) {
            let start = Math.max(0, Math.ceil(nodes[i])), end = Math.min(w - 1, Math.floor(nodes[i+1]));
            for (let x = start; x <= end; x++) {
                const idx = (y * w + x) * 4;
                if (isErase) { data[idx+3] = 0; } 
                else { data[idx]=r; data[idx+1]=g; data[idx+2]=b; data[idx+3]=a; }
            }
        }
    }
    ctx.putImageData(imgData, 0, 0);
    activeDrawing.data = activeCanvas.toDataURL("image/png");
}



