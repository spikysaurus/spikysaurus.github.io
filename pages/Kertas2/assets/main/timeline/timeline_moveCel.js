// Move selected frame forward (to next slot)
moveCelNextBtn.onclick = () => {
  if (!animation || animation.length === 0) return;

  // Find the current frame object by its frame number
  const currentFrameObj = animation.find(a => a.frame === frame_current + 1); 
  if (!currentFrameObj) return;

  // Move it forward one frame if possible
  const newFrameNum = currentFrameObj.frame + 1;
  const maxFrame = Math.max(...animation.map(a => a.frame));

  if (newFrameNum <= maxFrame) {
    currentFrameObj.frame = newFrameNum;
    frame_current = newFrameNum - 1; // update cursor to new slot
    render();
    show(frame_current, currentFrameObj.drawing);
  }
};

// Move selected frame backward (to previous slot)
moveCelPrevBtn.onclick = () => {
  if (!animation || animation.length === 0) return;

  const currentFrameObj = animation.find(a => a.frame === frame_current + 1);
  if (!currentFrameObj) return;

  const newFrameNum = currentFrameObj.frame - 1;
  if (newFrameNum >= 1) {
    currentFrameObj.frame = newFrameNum;
    frame_current = newFrameNum - 1;
    render();
    show(frame_current, currentFrameObj.drawing);
  }
};
