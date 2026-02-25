window.isMultiLayerMode = true; // Set to true to see all layers merged

function clearDynamicLayers() {
    document.querySelectorAll('.track-layer').forEach(el => el.remove());
}

window.xsheetCanvasBridge = {
    trackCanvases: {},
    lastDrawnCel: {},

    syncCanvasStack: function() {
        const headers = window.currentHeaders;
        const active = window.activeTrack;

        if (!headers || headers.length === 0) return;

        const container = document.getElementById("canvasContainer");
        const bdrop = document.getElementById("backdropCanvas");
        const activeDrawingCanvas = document.getElementById("canvas");
        const bgCanvas = document.getElementById("backgroundColorCanvas");

        if (!container || !activeDrawingCanvas) return;

        // 1. Clear current dynamic layers
        clearDynamicLayers();

        // 2. Process all tracks in Xsheet Order
        headers.forEach((trackName, idx) => {
            let layer;

            if (trackName === active) {
                layer = activeDrawingCanvas;
            } else {
                if (!this.trackCanvases[trackName]) {
                    const newCanvas = document.createElement('canvas');
                    newCanvas.className = 'canvases track-layer';
                    newCanvas.id = trackName;
                    newCanvas.width = activeDrawingCanvas.width;
                    newCanvas.height = activeDrawingCanvas.height;
                    newCanvas.style.pointerEvents = "none";
                    newCanvas.style.backgroundColor = "transparent";
                    this.trackCanvases[trackName] = newCanvas;
                }
                layer = this.trackCanvases[trackName];
            }

            // Sync visual position
            layer.style.top = activeDrawingCanvas.style.top;
            layer.style.left = activeDrawingCanvas.style.left;
            layer.style.transform = activeDrawingCanvas.style.transform;

            // Assign z-index based on order in headers
            layer.style.zIndex = idx + 10; // offset so bg/backdrop stay lower

            if (trackName !== active) {
                if (window.isMultiLayerMode) {
                    layer.style.display = "block";
                    layer.style.opacity = "1;
                } else {
                    layer.style.display = "none";
                }
            }

            container.appendChild(layer);
        });

        // Ensure BG/Backdrop stay at the bottom
        if (bgCanvas) {
            bgCanvas.style.zIndex = 0;
            container.insertBefore(bgCanvas, container.firstChild);
        }
        if (bdrop) {
            bdrop.style.zIndex = 1;
            container.insertBefore(bdrop, container.firstChild);
        }

        // 3. Redraw frame content
        this.updateTrackDrawings();
    },

    updateTrackDrawings: function() {
        if (!window.currentHeaders || !window.isMultiLayerMode) return;

        const frame = window.activeFrame || 1;

        window.currentHeaders.forEach((trackName, idx) => {
            if (trackName === window.activeTrack) return;

            const canvas = this.trackCanvases[trackName];
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const resolvedName = this.resolveKeyframe(idx, frame);

            // Only redraw if cel changed
            if (this.lastDrawnCel[trackName] !== resolvedName) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (resolvedName && typeof levels !== 'undefined' && levels[trackName]) {
                    const drawing = levels[trackName].find(d => d.name.replace(/\.png$/, "") === resolvedName);
                    if (drawing && drawing.data && drawing.data.startsWith('data:image')) {
                        const img = new Image();
                        img.onload = () => ctx.drawImage(img, 0, 0);
                        img.src = drawing.data;
                    }
                }

                // Update cache
                this.lastDrawnCel[trackName] = resolvedName;
            }
        });
    },

    resolveKeyframe: function(trackIdx, frame) {
        if (!window.currentTT || frame < 1) return null;
        for (let f = frame; f >= 1; f--) {
            if (typeof getValueForTrackFrame !== 'function') break;
            const val = getValueForTrackFrame(window.currentTT, trackIdx, f - 1).trim();
            if (val && !["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(val)) {
                return val;
            }
        }
        return null;
    }
};

// --- INITIALIZATION ---
(function() {
    if (window.currentHeaders && window.currentHeaders.length > 0) {
        setTimeout(() => window.xsheetCanvasBridge.syncCanvasStack(), 50);
    }
})();
