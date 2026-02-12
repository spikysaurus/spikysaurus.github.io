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

resize(500, 500);
