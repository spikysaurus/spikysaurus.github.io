function updateDurationLabel() {
  if (!xdtsData) return;
  const hh = xdtsData.header;
  
  const tt = xdtsData.timeTables[0];
  const totalFrames = tt.duration || 0;
  

  // Assume 24 fps
  const fps = 24;
  const seconds = totalFrames / fps;

  // Split into integer + remainder frames
  const secInt = Math.floor(seconds);
  const secDec = totalFrames % fps; // remainder frames

  document.getElementById("durationLabel").textContent =
    `(${secInt}+${secDec}) | ${totalFrames}`;
    
    document.getElementById("titleInput").value = hh.title;
    document.getElementById("sceneInput").value = hh.scene;
    document.getElementById("cutInput").value = hh.cut;
    document.getElementById("nameInput").value = hh.name;
     document.getElementById("memoInput").value = hh.memo;
}
