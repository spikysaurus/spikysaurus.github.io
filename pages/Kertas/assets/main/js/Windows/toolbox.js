 window.addEventListener('DOMContentLoaded', () => {
    const startX = 0, startY = 0, offset = 0;
    //~ let activeTool = 'ToolBrush'; // Set a default tool

    const win = createWindow("Tools", null, `
        <div id="toolbox" class="toolbox">
			<button id="toolCameraBtn" data-tool="ToolCamera"><span class="bl-icons-outliner_ob_camera"></span></button>
            <button id="toolBrushBtn" data-tool="ToolBrush"><span class="bl-icons-greasepencil"></span></button>
            <button id="toolEraserBtn" data-tool="ToolEraser"><span class="bl-icons-meta_ellipsoid"></span></button>
            <button id="toolFillBtn" data-tool="ToolFill" ><span class="bl-icons-image"></span></button>
            <button id="toolRectangleBtn" data-tool="ToolRectangleFill" ><span class="bl-icons-checkbox_dehlt"></span></button>
            <button id="toolLassoFillBtn" data-tool="ToolLassoFill" ><span class="bl-icons-sculptmode_hlt"></span></button>
            <button id="toolLassoBtn" data-tool="ToolLasso" ><span class="bl-icons-normalize_fcurves"></span></button>
            <button id="toolPanBtn" data-tool="ToolPan" ><span class="bl-icons-view_pan"></span></button>
            <button id="toolZoomBtn" data-tool="ToolZoom" ><span class="bl-icons-view_zoom"></span></button>
        </div>
    `,false,false);

    viewport.appendChild(win);
    win.style.minWidth = '0px';
	win.style.minHeight = '0px';
	win.style.width = 'auto';
	win.style.height = 'auto';
    win.style.left = '235px';
    win.style.top  = '30%';

    // 1. Get the toolbox from the newly created window
    const toolbox = win.querySelector('#toolbox');

    // 2. Define the switch function
    window.switchTool = function(toolName) {
    // Update the logical state
    activeTool = toolName; 
    
    // Find the toolbox again to ensure we have the latest DOM reference
    const toolbox = document.querySelector('#toolbox');
    if (!toolbox) return;

    // Update UI: Toggle 'active' class on all buttons
    toolbox.querySelectorAll('button').forEach(btn => {
        const isMatch = btn.getAttribute('data-tool') === toolName;
        btn.classList.toggle('active', isMatch);
    });

    // Optional: Trigger any tool-specific setup here
    //~ console.log(`Tool changed to: ${toolName}`);
};


    // 3. Attach the click listener to the toolbox (Event Delegation)
    toolbox.addEventListener('click', (e) => {
        // .closest('button') ensures clicking the <span> still triggers the <button> logic
        const btn = e.target.closest('button');
        
        if (!btn || btn.classList.contains('disabled')) return;

        const tool = btn.getAttribute('data-tool');
        if (tool) {
            window.switchTool(tool);
            
            if (tool === "ToolCamera") {
				window.cameraState.showHandles = true;
			}else{window.cameraState.showHandles = false;}
        }
        
    });

    // 4. Set the initial active tool highlight
    window.switchTool(activeTool);
    if (window.TooltipLib) window.TooltipLib.applyConfig();
    return win;
});
