// Tool state
let tools = [
{ name: "ToolBrush", active: true, btn: ToolBrushBtn },
{ name: "ToolEraser", active: false, btn: ToolEraserBtn },
{ name: "ToolFill", active: false, btn: ToolFillBtn },
{ name: "ToolLassoFill", active: false, btn: ToolLassoFillBtn },
{ name: "ToolSelect", active: false, btn: ToolSelectBtn },
{ name: "ToolPan", active: false, btn: ToolPanBtn }
];

// Helper to set active tool
let activeTool = "ToolBrush";

// Activate one tool, deactivate others
function setActiveTool(toolName) {
	
	activeTool = toolName;
	tools.forEach(tool => {
		tool.active = (tool.name === toolName);
		const toggleBtn = document.getElementById("ToolLassoFillToggle");
		toggleBtn.style.display = (activeTool === "ToolLassoFill") ? "block" : "none";
	});
	updateUI();
	activeTool = toolName;
	
	const debug_activeTool = document.getElementById("debug_activeTool");
	debug_activeTool.textContent = activeTool;
}
