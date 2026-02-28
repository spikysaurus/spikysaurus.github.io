/**
 * Inserts a value into a specific cell by coordinates
 * @param {number} trackIdx - The index of the column (0 for 'Fr', 1 for A, 2 for B...)
 * @param {number} frameNum - The visible frame number (e.g., 15)
 * @param {string} value - The value to insert (e.g., "1")
 */
function insertValueDirectly(trackIdx, frameNum, value) {
  if (!window.currentTT) return;
  
  // frameNum is likely 1-based from your UI, so subtract 1 for the data index
  const dataFrameIdx = frameNum - 1; 

  // 1. Update the underlying data
  // Assuming setValueForTrackFrame is your existing data-writing helper
  setValueForTrackFrame(window.currentTT, trackIdx, dataFrameIdx, value);

  // 2. Refresh the display
  renderDopeSheet(window.currentTT);
}
const fastInsertBtn = document.getElementById("fastInsertBtn");

//~ insertValueDirectly(0, 15, "1");
