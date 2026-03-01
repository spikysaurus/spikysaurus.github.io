window.addEventListener('keydown', (e) => {
	 if (e.altKey || e.shiftKey) return;
  const key = e.key.toLowerCase();

  if (key === 'q') {
    switchTool("ToolCamera");
  }

  if (window.cameraState) {
    if (key === 'q' || window.activeTool === "ToolCamera") {
      window.cameraState.showHandles = true;
    } else {
      window.cameraState.showHandles = false;
    }
  }
});

window.addEventListener("keydown", (e) => {
    if (e.key === "+" || e.key === "=") {
        cameraManager.addKeyframe();
    }
});

