	// --- Track add/remove ---
	const addTrackBtn = document.getElementById("addTrackBtn");
addTrackBtn.addEventListener("click", () => {
  if (!xdtsData) return;
  const tt = xdtsData.timeTables[0];
  const headers = tt.timeTableHeaders[0].names;

  // Add next header label (A, B, C…)
  const nextChar = String.fromCharCode("A".charCodeAt(0) + headers.length);
  headers.push(nextChar);

  const field = tt.fields.find(f => f.fieldId === 0);
  field.tracks.push({ trackNo: field.tracks.length, frames: [] });

  // Reassign trackNo zero-based
  field.tracks.forEach((t, i) => t.trackNo = i);

  renderDopeSheet(xdtsData);
});

const removeTrackBtn = document.getElementById("removeTrackBtn");
removeTrackBtn.addEventListener("click", () => {
  if (!xdtsData || !window.activeTrack) return;
  
  const tt = xdtsData.timeTables[0];
  const headers = tt.timeTableHeaders[0].names;
  const field = tt.fields.find(f => f.fieldId === 0);
  
  // Find the index of the active track
  const idx = headers.indexOf(window.activeTrack);
  
  if (idx === -1) {
    console.warn("Active track not found in data.");
    return;
  }

  // Remove the specific track and header
  headers.splice(idx, 1);
  field.tracks.splice(idx, 1);

  // Reassign trackNo zero-based
  field.tracks.forEach((t, i) => t.trackNo = i);

  // Clear activeTrack since it no longer exists
  window.activeTrack = null;

  renderDopeSheet(xdtsData);
});


// --- Track reorder ---
document.getElementById("reorderLeftBtn").addEventListener("click", () => reorderTrack("left"));
document.getElementById("reorderRightBtn").addEventListener("click", () => reorderTrack("right"));

function reorderTrack(direction) {
  if (!xdtsData) return;
  const tt = xdtsData.timeTables[0];
  const headers = tt.timeTableHeaders[0].names;
  const field = tt.fields.find(f => f.fieldId === 0);

  //~ const targetName = document.getElementById("reorderInput").value.trim();
  const targetName = window.activeTrack;
  if (!targetName) return;

  const idx = headers.indexOf(targetName);
  if (idx === -1) {
    alert("Track not found: " + targetName);
    return;
  }

  let newIdx = idx;
  if (direction === "left" && idx > 0) {
    newIdx = idx - 1;
  } else if (direction === "right" && idx < headers.length - 1) {
    newIdx = idx + 1;
  } else {
    return; // cannot move further
  }

  // Swap header names
  const tmpHeader = headers[idx];
  headers[idx] = headers[newIdx];
  headers[newIdx] = tmpHeader;

  // Swap tracks
  const tracks = field.tracks;
  const tmpTrack = tracks[idx];
  tracks[idx] = tracks[newIdx];
  tracks[newIdx] = tmpTrack;

  // Reassign trackNo zero-based
  tracks.forEach((t, i) => t.trackNo = i);

  renderDopeSheet(xdtsData);
}

// --- Auto-Rename Tracks ---
document.getElementById("autoRenameBtn").addEventListener("click", () => {
  if (!xdtsData) return;
  const tt = xdtsData.timeTables[0];
  const headers = tt.timeTableHeaders[0].names;
  const field = tt.fields.find(f => f.fieldId === 0);

  // Rename headers sequentially A, B, C, ...
  for (let i = 0; i < headers.length; i++) {
    headers[i] = String.fromCharCode("A".charCodeAt(0) + i);
  }

  // Ensure trackNo stays zero-based
  field.tracks.forEach((t, i) => t.trackNo = i);

  renderDopeSheet(xdtsData);
});
