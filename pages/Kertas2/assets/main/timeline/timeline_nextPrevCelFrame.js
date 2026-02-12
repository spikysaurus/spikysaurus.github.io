
FramePrevBtn.onclick = () => {
  if (sequence.length === 0) return;
  frame_current = (frame_current - 1 + sequence.length) % sequence.length;
  render();
  show(frame_current);
};

FrameNextBtn.onclick = () => {
  if (sequence.length === 0) return;
  frame_current = (frame_current + 1) % sequence.length;
  render();
  show(frame_current);
};

// Jump to previous keyframe (loop to last if at first)
CelPrevBtn.onclick = () => {
  if (animation.length === 0) return;

  const keyframes = animation.map(a => a.frame).sort((a, b) => a - b);

  const prev = [...keyframes].reverse().find(f => f < frame_current + 1);
  if (prev !== undefined) {
    frame_current = prev - 1;
  } else {
    // loop to last keyframe
    frame_current = keyframes[keyframes.length - 1] - 1;
  }

  render();
  show(frame_current);
};

// Jump to next keyframe (loop to first if at last)
CelNextBtn.onclick = () => {
  if (animation.length === 0) return;

  const keyframes = animation.map(a => a.frame).sort((a, b) => a - b);

  const next = keyframes.find(f => f > frame_current + 1);
  if (next !== undefined) {
    frame_current = next - 1;
  } else {
    // loop to first keyframe
    frame_current = keyframes[0] - 1;
  }

  render();
  show(frame_current);
};
