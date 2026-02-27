window.toolboxManager = {
    activeTool: 'ToolBrush',

    init: function() {
        // 1. Generate Content
        const uiContent = this.generateUI();

        // 2. Create Window (title, targetArea, content, showResizer, isDockable)
        const win = createWindow("Tools", null, uiContent, false, false);

        // 3. Styling adjustments
        win.style.minWidth = '0px';
        win.style.minHeight = '0px';
        win.style.width = 'auto';
        win.style.height = 'auto';
        win.style.left = '235px';
        win.style.top = '30%';
        win.style.transform = 'none'; 

        // 4. Attach Logic
        this.attachEvents(win);

        // 5. Refresh Tooltips
        if (window.TooltipLib) window.TooltipLib.applyConfig();

        return win;
    },

    generateUI: function() {
        return `
            <div id="toolbox" class="toolbox">
                <button id="toolBrushBtn" data-tool="ToolBrush"><span class="bl-icons-greasepencil"></span></button>
                <button id="toolEraserBtn" data-tool="ToolEraser"><span class="bl-icons-meta_ellipsoid"></span></button>
                <button id="toolFillBtn" data-tool="ToolFill"><span class="bl-icons-image"></span></button>
                <button id="toolLassoFillBtn" data-tool="ToolLassoFill"><span class="bl-icons-sculptmode_hlt"></span></button>
                <button id="toolLassoBtn" data-tool="ToolLasso"><span class="bl-icons-normalize_fcurves"></span></button>
                <button id="toolPanBtn" data-tool="ToolPan"><span class="bl-icons-view_pan"></span></button>
                <button id="toolZoomBtn" data-tool="ToolZoom"><span class="bl-icons-view_zoom"></span></button>
            </div>
        `;
    },

    attachEvents: function(win) {
        const toolbox = win.querySelector('#toolbox');

        // Define global switch function
        window.switchTool = (toolName) => {
            this.activeTool = toolName;
            
            toolbox.querySelectorAll('button').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-tool') === toolName);
            });
            
            // Console log or trigger your actual tool logic here
            console.log("Active Tool:", this.activeTool);
        };

        // Event Delegation for buttons
        toolbox.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || btn.classList.contains('disabled')) return;

            const tool = btn.getAttribute('data-tool');
            if (tool) window.switchTool(tool);
        });

        // Set initial state
        window.switchTool(this.activeTool);
    }
};

// Initialize
window.toolboxManager.init();
