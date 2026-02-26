// xsheetLevelDrawingbridge.js
window.syncXsheetLevelDrawings = true;

// 1. Declare holders at the top level so all functions can see them
let _originalHighlightCel = null;
let _originalEditButtonHandler = null;

// 2. Wrap Xsheet Logic
if (typeof highlightCel !== 'undefined') {
    _originalHighlightCel = highlightCel; // Store it
    
    highlightCel = function(tt, tbody, thead, headRow, headers, idx, f, val, duration) {
        // Run original visual logic
        _originalHighlightCel(tt, tbody, thead, headRow, headers, idx, f, val, duration);
        
        // Sync Xsheet -> Canvas
        const resolvedName = resolveDrawingName(tt, idx, f);
        if (headers[idx] && resolvedName) {
            syncLevelAndDrawing(headers[idx], resolvedName);
        }
    };
}

// 3. Wrap Drawing Logic (Reverse Sync)
if (typeof editButtonHandler !== 'undefined') {
    _originalEditButtonHandler = editButtonHandler; // Store it
    
    editButtonHandler = function(level, c) {
        // Run original asset loading logic
        _originalEditButtonHandler(level, c);
        
        if (!window.syncXsheetLevelDrawings || !currentTT || !_originalHighlightCel) return;

        const trackIdx = currentHeaders.indexOf(level);
        if (trackIdx === -1) return;

        const drawingName = c.name.replace(/\.png$/, "");
        
        // Find first occurrence in Xsheet
        for (let f = 1; f <= currentTT.duration; f++) {
            const val = getValueForTrackFrame(currentTT, trackIdx, f - 1).trim();
            if (val === drawingName) {
                const container = document.getElementById("tableContainer");
                const tbody = container.querySelector("tbody");
                const thead = container.querySelector("thead");
                const headRow = thead.querySelector("tr");

                // Use the stored original to avoid infinite recursion
                _originalHighlightCel(currentTT, tbody, thead, headRow, currentHeaders, trackIdx, f, drawingName, currentTT.duration);
                
                // Scroll to the frame
                const targetRow = tbody.querySelectorAll("tr")[f - 1];
                if (targetRow) {
                    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetRow.querySelectorAll("td")[trackIdx + 1]?.querySelector("input")?.focus();
                }
                break; 
            }
        }
    };
}

// Helpers
function resolveDrawingName(tt, trackIdx, frame) {
    let val = getValueForTrackFrame(tt, trackIdx, frame - 1).trim();
    if (!val || ["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(val)) {
        for (let f = frame - 1; f >= 1; f--) {
            const v = getValueForTrackFrame(tt, trackIdx, f - 1).trim();
            if (v && !["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(v)) return v;
        }
    }
    return val;
}

function syncLevelAndDrawing(trackName, celName) {
    if (!window.syncXsheetLevelDrawings || !trackName || !celName || !_originalEditButtonHandler) return;
    const level = levels[trackName];
    if (!level) return;
    const drawing = level.find(d => d.name.replace(/\.png$/, "") === celName);
    if (drawing) _originalEditButtonHandler(trackName, drawing);
}
