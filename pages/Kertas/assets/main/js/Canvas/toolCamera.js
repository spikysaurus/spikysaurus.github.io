window.addEventListener('keydown', (e) => {
	 if (e.altKey || e.shiftKey) return;
  const key = e.key.toLowerCase();

  // 1. Trigger the switch
  if (key === 'q') {
    switchTool("ToolCamera");
  }

  // 2. Logic Check: Show handles if 'q' was JUST pressed 
  // OR if the tool is already active
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


//~ const cameraSaveBtn = document.getElementById('cameraSaveBtn');
//~ cameraSaveBtn.onclick = () => {

//~ cameraManager.saveCameraData();

//~ }
