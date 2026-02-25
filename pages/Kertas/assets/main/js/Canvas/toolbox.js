(function() {
  // 1. Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    .toolbox {
      color: white;
      user-select: none;
      position: fixed;
      right: 270px;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      background: #303030;
      cursor: move;
      padding: 6px;
      z-index: 998;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-sizing: border-box;
      border-radius: 8px;
    }
    .toolbox label { cursor: move; font-size: 10px; text-align: center; display: block; }
    .toolbox button {
      color: white;
      width: 32px;
      height: 32px;
      background: #4c4c4c;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    /* HIGHLIGHT ACTIVE TOOL */
    .toolbox button.active {
      background: #4073a3 !important;
    }
    .toolbox button:hover { background: #a35293; }
    .toolbox span { pointer-events: none; }
    .disabled { opacity:0.3; pointer-events: none; }
  `;
  document.head.appendChild(style);

  // 2. Create HTML Structure
  const toolbox = document.createElement('div');
  toolbox.id = 'toolbox';
  toolbox.className = 'toolbox';
  
  toolbox.innerHTML = `
    <label>TOOLS</label>
    <button id="toolBrushBtn" data-tool="ToolBrush"><span class="bl-icons-greasepencil"></span></button>
    <button id="toolEraserBtn" data-tool="ToolEraser"><span class="bl-icons-meta_ellipsoid"></span></button>
    <div style="display:none;">
    <button id="ToolLassoFillBtn" data-tool="ToolLasso" ><span class="bl-icons-meta_data"></span></button>
    <button id="ToolSelectBtn" data-tool="ToolSelect" ><span class="bl-icons-select_set"></span></button>
    <button id="cut" ><span class="bl-icons-node_insert_on"></span></button>
    <button id="copy" ><span class="bl-icons-duplicate"></span></button>
    <button id="paste" ><span class="bl-icons-pastedown"></span></button>
    <button id="delete" "><span class="bl-icons-trash"></span></button>
    </div>
  `;
  
  document.body.appendChild(toolbox);

  // --- TOOL SWITCHING LOGIC ---
  
  // Make switchTool available globally so canvas.js can call it
  window.switchTool = function(toolName) {
    activeTool = toolName; // Update global variable in canvas.js
    
    // Remove active class from all buttons
    toolbox.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('active');
      // Add active class if data-tool matches current activeTool
      if(btn.getAttribute('data-tool') === toolName) {
        btn.classList.add('active');
      }
    });

  };

  // Add click listeners to buttons
  toolbox.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.classList.contains('disabled')) return;

    const tool = btn.getAttribute('data-tool');
    if (tool) switchTool(tool);
  });

  // Initialize first tool highlight
  setTimeout(() => switchTool(activeTool), 10);

  // --- DRAGGING LOGIC ---
  let offsetX, offsetY, isDragging = false;
  toolbox.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    const rect = toolbox.getBoundingClientRect();
    toolbox.style.left = rect.left + 'px';
    toolbox.style.right = 'auto'; 
    toolbox.style.top = rect.top + 'px';
    toolbox.style.transform = 'none';
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
		isDrawing = false;
      toolbox.style.left = (e.clientX - offsetX) + 'px';
      toolbox.style.top = (e.clientY - offsetY) + 'px';
    }
  });

  document.addEventListener('mouseup', () => {isDragging = false});
})();
