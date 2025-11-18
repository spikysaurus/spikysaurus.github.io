let xdtsData = null;

// Default symbol map
let symbolDisplayMap = {
  SYMBOL_NULL_CELL: "x",
  SYMBOL_TICK_1: "○",
  SYMBOL_TICK_2: "●",
  SYMBOL_HYPHEN: "｜"
};

// Reverse lookup
function resolveSymbol(inputVal) {
  const trimmed = inputVal.trim();
  for (const [symbol, display] of Object.entries(symbolDisplayMap)) {
    if (trimmed === display) return symbol;
  }
  return null;
}

// Auto‑apply custom symbols
function updateSymbolMapFromForm() {
  symbolDisplayMap.SYMBOL_NULL_CELL = document.getElementById("symNull").value || "x";
  symbolDisplayMap.SYMBOL_TICK_1 = document.getElementById("symTick1").value || "○";
  symbolDisplayMap.SYMBOL_TICK_2 = document.getElementById("symTick2").value || "●";
  symbolDisplayMap.SYMBOL_HYPHEN = document.getElementById("symHyphen").value || "｜";
  if (xdtsData) renderDopeSheet(xdtsData);
}
["symNull","symTick1","symTick2","symHyphen"].forEach(id => {
  document.getElementById(id).addEventListener("input", updateSymbolMapFromForm);
});

// File handling
function handleFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    let text = e.target.result.trim();
    const prefix = "exchangeDigitalTimeSheet Save Data";
    if (text.startsWith(prefix)) text = text.slice(prefix.length).trim();
    try {
      xdtsData = JSON.parse(text);

      // Sync headers and tracks
      const tt = xdtsData.timeTables[0];
      const field = tt.fields.find(f => f.fieldId === 0);
      while (tt.timeTableHeaders[0].names.length < field.tracks.length) {
        tt.timeTableHeaders[0].names.push("Track" + (tt.timeTableHeaders[0].names.length));
      }
      while (field.tracks.length < tt.timeTableHeaders[0].names.length) {
        field.tracks.push({ trackNo: field.tracks.length, frames: [] });
      }
      // ✅ Reassign trackNo zero-based
      field.tracks.forEach((t, i) => t.trackNo = i);

      renderDopeSheet(xdtsData);
      updateDurationLabel();
      document.getElementById("exportBtn").style.display = "inline-block";
    } catch (err) {
      alert("Parse error: " + err.message);
    }
  };
  reader.readAsText(file);
}
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// Render dope sheet
function renderDopeSheet(data) {
  const container = document.getElementById("tableContainer");
  container.innerHTML = "";

  let tt = data.timeTables ? data.timeTables[0] : data;
  const duration = tt.duration || 30;
  const headers = tt.timeTableHeaders && tt.timeTableHeaders[0].names || [];
  const framesPerColumn = 72;
  const totalColumns = Math.ceil(duration / framesPerColumn);

  for (let col = 0; col < totalColumns; col++) {
    const startFrame = col * framesPerColumn + 1;
    const endFrame = Math.min((col+1) * framesPerColumn, duration);
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const thBlank = document.createElement("th");
    thBlank.textContent = "Fr";
    headRow.appendChild(thBlank);
    headers.forEach(label => {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const shadingActive = new Array(headers.length).fill(false);

    for (let f = startFrame; f <= endFrame; f++) {
      const tr = document.createElement("tr");
      const tdFrame = document.createElement("td");
      tdFrame.textContent = f;
      tr.appendChild(tdFrame);

      headers.forEach((label, idx) => {
        const td = document.createElement("td");
        const val = getValueForTrackFrame(tt, idx, f-1);
        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("cellInput");

        if (symbolDisplayMap[val]) {
          input.value = symbolDisplayMap[val];
          if (val === "SYMBOL_NULL_CELL") shadingActive[idx] = true;
          else shadingActive[idx] = false;
        } else {
          input.value = val;
          if (val && val.trim() !== "") shadingActive[idx] = false;
        }
        if (shadingActive[idx]) {
          td.style.backgroundColor = "lightgray";
          input.style.backgroundColor = "lightgray";
        }
        input.addEventListener("change", () => {
          setValueForTrackFrame(tt, idx, f-1, input.value);
          renderDopeSheet(tt);
        });
        td.appendChild(input);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    container.appendChild(table);
  }
}

// Helpers
function getValueForTrackFrame(tt, trackIndex, frameNo) {
  const field = tt.fields.find(f => f.fieldId === 0);
  if (!field) return "";
  const track = field.tracks.find(t => t.trackNo === trackIndex);
  if (!track) return "";
  const frame = track.frames.find(fr => fr.frame === frameNo);
  if (!frame) return "";
  return frame.data.map(d => d.values.join(",")).join(" | ");
}
function setValueForTrackFrame(tt, trackIndex, frameNo, newVal) {
  const field = tt.fields.find(f => f.fieldId === 0);
  if (!field) return;
  const track = field.tracks.find(t => t.trackNo === trackIndex);
  if (!track) return;
  let frame = track.frames.find(fr => fr.frame === frameNo);
  if (!frame) {
    frame = { frame: frameNo, data: [{ id: 0, values: [] }] };
    track.frames.push(frame);
  }
  const trimmed = newVal.trim();
  const resolved = resolveSymbol(trimmed);
  if (resolved) frame.data[0].values = [resolved];
  else if (trimmed === "") frame.data[0].values = [""];
  else frame.data[0].values = [newVal];
}

// Export
document.getElementById("exportBtn").addEventListener("click", () => {
  if (!xdtsData) return;

  // ✅ Normalize trackNo to zero-based before export
  const tt = xdtsData.timeTables[0];
  const field = tt.fields.find(f => f.fieldId === 0);
  field.tracks.forEach((t, i) => t.trackNo = i);

  const jsonString = "exchangeDigitalTimeSheet Save Data" + JSON.stringify(xdtsData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "edited_timesheet.xdts";
  a.click();
});

