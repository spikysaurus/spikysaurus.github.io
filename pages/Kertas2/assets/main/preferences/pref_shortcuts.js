

// Tool events
ToolBrushBtn.onclick = () => { setActiveTool("ToolBrush")};
ToolEraserBtn.onclick = () => { setActiveTool("ToolEraser")};
ToolFillBtn.onclick = () => { setActiveTool("ToolFill")};
ToolLassoFillBtn.onclick = () => { setActiveTool("ToolLassoFill")};
ToolSelectBtn.onclick = () => { setActiveTool("ToolSelect")};
ToolPanBtn.onclick = () => { setActiveTool("ToolPan")};
//CelDeleteBtn.onclick = () => {CelDelete()};
CelAddNullBtn.onclick = () => {CelAddNull()};
AddLayerBtn.onclick = () => { addLayer() };

// SHORTCUTS dictionary
const shortcuts = {
	"t": () => navButton.click(),             	 //NavButton Toggle
	"`": () => preferencesBtn.click(),           // Preferences Toggle
	"h": () => minimalUIBtn.click(),            // Show/Hide Timeline
    "w": () => BEToggle.click(),              // Tool Brush/Eraser Toggle
    "b": () => setActiveTool("ToolBrush"),	// Tool Brush
    "e": () => setActiveTool("ToolEraser"),	// Tool Eraser
    "B": () => aliasingToggle.click(),            		// Aliased Toggle
    "q": () => setActiveTool("ToolLassoFill"),		// Tool Lasso Fill
    "Q": () => ToolLassoFillToggle.click(),			// Lasso Fill Toggle
    "f": () => setActiveTool("ToolFill"),				// Tool Fill
    "v": () => setActiveTool("ToolSelect"),			// Tool Select
    " ": () => setActiveTool("ToolPan"),				// Tool Pan
    "=": () => zoomIn.click(),							// Zoom In
    "-": () => zoomOut.click(),							// Zoom Out
    "x": () => deleteBtn.click(),						// Delete Selected Drawing
    "Delete": () => ClearCanvasBtn.click(),			// Clear Drawing
    "l": () => addLayer(),                // Add Layer
//    "_": () => CelDeleteBtn.click(),                 // Delete frame
    "+": () => CelAddNullBtn.click(),          // Delete frame but null
    "/": () => onionBtn.click(),              		// Onion skin
    "ArrowRight": () => FrameNextBtn.click(),     // Next frame
    "ArrowLeft": () => FramePrevBtn.click(),     // Prev frame
    ".": () => CelNextBtn.click(),              // Next Cel
    ",": () => CelPrevBtn.click(),             // Prev Cel
    "p": () => playBtn.click(),               // Play
};


// Unified keydown handler
document.addEventListener("keydown", (event) => {
    if (event.repeat) return; // avoid repeats when holding keys

    const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    // Handle Ctrl/Meta combos
    if (hasCtrlOrMeta) {
    		
    		
    		if (key === "s") {
		 		event.preventDefault();
		 		SaveProjectBtn.click();
    		}
    		if (key === "o") {
    			event.preventDefault();
    			LoadProjectBtn.click();
    		}
    		
        if (key === "z") {
            event.preventDefault();
            if (event.shiftKey) {
                redo(); // Ctrl+Shift+Z → Redo
            } else {
                undo(); // Ctrl+Z → Undo
            }
            return;
        }
        if (key === "y") {
            event.preventDefault();
            redo(); // Ctrl+Y → Redo
            return;
        }
        if (key === "x") { // Ctrl+x Cut
            event.preventDefault();
            cutBtn.onclick();
            return;
            }
        if (key === "c") { // Ctrl+c Copy
            event.preventDefault();
            copyBtn.onclick();
            
            }
        if (key === "v") { // Ctrl+v paste
            event.preventDefault();
            pasteBtn.onclick();
            }
    }

    // Handle simple shortcuts from dictionary
    if (shortcuts[event.key]) {
        event.preventDefault();
        shortcuts[event.key]();
    }
});

//shortcut:zoom_wheel
document.addEventListener('wheel', e => {
    e.preventDefault()
    if (e.ctrlKey) { 
        const d = e.deltaY < 0 ? 1.1 : 0.9
        targetSc = Math.min(Math.max(targetSc * d, 0.5), 3)
    } else {
        targetPx -= e.deltaX
        targetPy -= e.deltaY
    }
}, {
    passive: false
})
