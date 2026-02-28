// camera_persistence.js

// 1. DATA STRUCTURE FOR KEYFRAMES
// Stores frame number as key: { 1: {x, y, rot, scale}, 10: {...} }
window.cameraKeyframes = {
    1: { x: 210, y: 287, rotation: 0, scale: 1 } // Default start
};

const cameraManager = {
    
    // 2. ADD KEYFRAME (Shortcut "+")
    addKeyframe: function() {
        const frame = window.activeFrame || 1;
        // Clone current live state into the keyframe set
        window.cameraKeyframes[frame] = {
            x: window.cameraState.x,
            y: window.cameraState.y,
            rotation: window.cameraState.rotation,
            scale: window.cameraState.scale
        };
        console.log(`Camera Keyframe added at frame ${frame}`);
        // Visual feedback (optional: you could flash the camera guide red)
        if (window.renderDopeSheet) window.renderDopeSheet(window.currentTT);
    },

    // 3. SAVE TO JSON (Shortcut "Ctrl+S")
    saveCameraData: function() {
        const dataStr = JSON.stringify({
            resolution: { w: 1280, h: 720 },
            keyframes: window.cameraKeyframes
        }, null, 4);
        
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `camera_data_fr${window.activeFrame || 1}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log("Camera JSON saved.");
    },
	
	processCameraFile: function(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = event => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported && imported.keyframes) {
                    window.cameraKeyframes = imported.keyframes;
                    
                    if (imported.resolution && window.cameraState) {
                        window.cameraState.resW = imported.resolution.w;
                        window.cameraState.resH = imported.resolution.h;
                    }

                    this.updateStateForFrame(window.activeFrame || 1);
                    if (window.currentTT && typeof renderDopeSheet === "function") {
                        renderDopeSheet(window.currentTT);
                    }
                    console.log("Camera Data Loaded successfully.");
                } else {
                    alert("JSON format incorrect: Missing 'keyframes'.");
                }
            } catch (err) {
                console.error("JSON Parse Error:", err);
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    },
    
     loadCameraData: function() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = e => this.processCameraFile(e.target.files[0]);
        input.click();
    },

    // 4. INTERPOLATION (Call this when changing frames)
    // This updates window.cameraState based on the timeline
    updateStateForFrame: function(frame) {
        const keys = Object.keys(window.cameraKeyframes).map(Number).sort((a, b) => a - b);
        if (keys.length === 0) return;

        // Find surrounding keys
        let prev = keys[0], next = keys[keys.length - 1];
        for (let k of keys) {
            if (k <= frame) prev = k;
            if (k >= frame) { next = k; break; }
        }

        if (prev === next) {
            window.cameraState = { ...window.cameraState, ...window.cameraKeyframes[prev] };
        } else {
            // Simple Linear Interpolation (Lerp)
            const t = (frame - prev) / (next - prev);
            const k1 = window.cameraKeyframes[prev];
            const k2 = window.cameraKeyframes[next];

            window.cameraState.x = k1.x + (k2.x - k1.x) * t;
            window.cameraState.y = k1.y + (k2.y - k1.y) * t;
            window.cameraState.rotation = k1.rotation + (k2.rotation - k1.rotation) * t;
            window.cameraState.scale = k1.scale + (k2.scale - k1.scale) * t;
        }
    }
};

// Shared processing logic for both click and drop
const processCameraFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
        try {
            const imported = JSON.parse(event.target.result);
            
            if (imported && imported.keyframes) {
                window.cameraKeyframes = imported.keyframes;
                
                if (imported.resolution && window.cameraState) {
                    window.cameraState.resW = imported.resolution.w;
                    window.cameraState.resH = imported.resolution.h;
                }

                cameraManager.updateStateForFrame(window.activeFrame || 1);
                if (window.currentTT) renderDopeSheet(window.currentTT);
                
                console.log("Camera Sync Complete via Drop/Load");
            } else {
                alert("JSON format incorrect: Missing 'keyframes' object.");
            }
        } catch (err) {
            console.error("JSON Parse Error:", err);
            alert("The file is not a valid JSON.");
        }
    };
    reader.readAsText(file);
};

// 5. DRAG AND DROP SETUP
const dropZoneCamera = document.querySelector(".dropZoneCamera");

if (dropZoneCamera) {
    dropZoneCamera.addEventListener("dragover", e => { 
        e.preventDefault(); 
        dropZoneCamera.style.opacity = "0.5";
        dropZoneCamera.style.border = "2px dashed #fff"; // Visual hint
    });

    dropZoneCamera.addEventListener("dragleave", () => {
        dropZoneCamera.style.opacity = "1";
        dropZoneCamera.style.border = "none";
    });

    dropZoneCamera.addEventListener("drop", e => {
        e.preventDefault();
        dropZoneCamera.style.opacity = "1";
        dropZoneCamera.style.border = "none";
        
        const file = e.dataTransfer.files[0];
        processCameraFile(file);
    });
}


