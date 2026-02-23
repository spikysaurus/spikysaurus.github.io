// --- Increase/Decrease Duration ---
document.getElementById("increaseDurationBtn").addEventListener("click", () => {
  adjustDuration("increase");
});
document.getElementById("decreaseDurationBtn").addEventListener("click", () => {
  adjustDuration("decrease");
});

function adjustDuration(action) {
  if (!xdtsData) return;
  const tt = xdtsData.timeTables[0];
  const adjustVal = parseInt(document.getElementById("adjustDuration").value, 10);
  if (isNaN(adjustVal) || adjustVal < 1) return;

  if (action === "increase") {
    tt.duration += adjustVal;
  } else if (action === "decrease") {
    tt.duration = Math.max(1, tt.duration - adjustVal);
    // Trim frames beyond new duration
    const field = tt.fields.find(f => f.fieldId === 0);
    field.tracks.forEach(track => {
      track.frames = track.frames.filter(fr => fr.frame < tt.duration);
    });
  }

  renderDopeSheet(xdtsData);
  updateDurationLabel();
}
