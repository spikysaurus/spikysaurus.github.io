// --- Track add/remove ---
document.getElementById("addTrackBtn").addEventListener("click", () => {
  if (!xdtsData) return;
  const tt = xdtsData.timeTables[0];
  const headers = tt.timeTableHeaders[0].names;

  // Add next header label (A, B, C…)
  const nextChar = String.fromCharCode("A".charCodeAt(0) + headers.length);
  headers.push(nextChar);

  const field = tt.fields.find(f => f.fieldId === 0);
  field.tracks.push({ trackNo: field.tracks.length, frames: [] });

  // ✅ Reassign trackNo zero-based
  field.tracks.forEach((t, i) => t.trackNo = i);

  renderDopeSheet(xdtsData);
});

document.getElementById("removeTrackBtn").addEventListener("click", () => {
  if (!xdtsData) return;
  const tt = xdtsData.timeTables[0];
  const headers = tt.timeTableHeaders[0].names;
  if (!headers.length) return;

  headers.pop();
  const field = tt.fields.find(f => f.fieldId === 0);
  field.tracks.pop();

  // ✅ Reassign trackNo zero-based
  field.tracks.forEach((t, i) => t.trackNo = i);

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

  const targetName = document.getElementById("reorderInput").value.trim();
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

  // ✅ Reassign trackNo zero-based
  tracks.forEach((t, i) => t.trackNo = i);

  renderDopeSheet(xdtsData);
}

// --- New Blank Timesheet with user-defined duration ---
document.getElementById("newTimesheetBtn").addEventListener("click", () => {
  const durationInput = parseInt(document.getElementById("newDuration").value, 10);
  const duration = isNaN(durationInput) || durationInput < 1 ? 30 : durationInput;

  xdtsData = {
    timeTables: [{
      duration: duration,
      timeTableHeaders: [{ names: ["A"] }],
      fields: [{
        fieldId: 0,
        tracks: [{ trackNo: 0, frames: [] }]   // ✅ start at 0
      }]
    }]
  };

  renderDopeSheet(xdtsData);
  updateDurationLabel();
  document.getElementById("exportBtn").style.display = "inline-block";
  
});

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

  // ✅ Ensure trackNo stays zero-based
  field.tracks.forEach((t, i) => t.trackNo = i);

  renderDopeSheet(xdtsData);
});

function updateDurationLabel() {
  if (!xdtsData) return;
  const tt = xdtsData.timeTables[0];
  const totalFrames = tt.duration || 0;

  // Assume 24 fps
  const fps = 24;
  const seconds = totalFrames / fps;

  // Split into integer + remainder frames
  const secInt = Math.floor(seconds);
  const secDec = totalFrames % fps; // remainder frames

  document.getElementById("durationLabel").textContent =
    `Duration: (${secInt}+${secDec}) | Frames: ${totalFrames}`;
}

// Adjust cell width
document.getElementById("cellWidthInput").addEventListener("input", e => {
  const newWidth = e.target.value + "px";
  document.querySelectorAll("#tableContainer td").forEach(td => {
    td.style.width = newWidth;
  });
});

// Adjust cell height
document.getElementById("cellHeightInput").addEventListener("input", e => {
  const newHeight = e.target.value + "px";
  document.querySelectorAll("#tableContainer td").forEach(td => {
    td.style.height = newHeight;
  });
  document.querySelectorAll("#tableContainer .cellInput").forEach(input => {
    input.style.height = newHeight;
  });
});

//document.getElementById("fontSizeInput").addEventListener("input", e => {
//  const newSize = e.target.value + "px";
//  // Apply to all tables inside tableContainer
//  document.querySelectorAll("#tableContainer td").forEach(table => {
//    table.style.fontSize = newSize;
//  });
//  document.querySelectorAll("#tableContainer .cellInput").forEach(input => {
//    input.style.fontSize = newSize;
//    });
//});


window.addEventListener("DOMContentLoaded", () => {
  // Reset symbol inputs
  document.getElementById("symNull").value = "x";
  document.getElementById("symTick1").value = "○";
  document.getElementById("symTick2").value = "●";
  document.getElementById("symHyphen").value = "｜";

  // Reset cell size inputs
  document.getElementById("cellWidthInput").value = 30;
  document.getElementById("cellHeightInput").value = 30;

  // Apply defaults immediately
  document.querySelectorAll(".cellInput").forEach(cell => {
    cell.style.width = "30px";
    cell.style.height = "30px";
  });

  // Reset symbol map in JS
  symbolDisplayMap = {
    SYMBOL_NULL_CELL: "x",
    SYMBOL_TICK_1: "○",
    SYMBOL_TICK_2: "●",
    SYMBOL_HYPHEN: "｜"
  };
});




