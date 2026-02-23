window.activeFrame = null;
window.activeTrack = null;
window.activeCel = null;
window.activeHeldFrames = [];
window.currentTT = null;
window.currentHeaders = [];

const activeTrackLabel = document.getElementById('activeTrackLabel');
const activeCelLabel = document.getElementById('activeCelLabel');

function renderDopeSheet(data) {
  const container = document.getElementById("tableContainer");
  if (!container) return;
  container.innerHTML = "";
  
  let tt = data.timeTables ? (Array.isArray(data.timeTables) ? data.timeTables[0] : data.timeTables) : data;
  window.currentTT = tt;
  
  const duration = tt.duration || 30;
  const headers = tt.timeTableHeaders?.[0]?.names || tt.timeTableHeaders?.names || [];
  window.currentHeaders = headers;

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  headRow.appendChild(Object.assign(document.createElement("th"), { textContent: "Fr" }));
  headers.forEach(label => {
    const th = document.createElement("th");
    th.textContent = label;
    th.style.color = "white";
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let f = 1; f <= duration; f++) {
    const tr = document.createElement("tr");
    const tdFrame = document.createElement("td");
    tdFrame.textContent = f;
    tdFrame.style.backgroundColor = "#4073a3";
    tdFrame.style.color = "white";
    if (f % 24 === 0) tdFrame.style.borderBottom = "1px solid lightblue";
    tr.appendChild(tdFrame);

// ... inside your headers.forEach loop in renderDopeSheet ...
headers.forEach((label, idx) => {
  const td = document.createElement("td");
  const val = getValueForTrackFrame(tt, idx, f - 1);
  const displayVal = (typeof symbolDisplayMap !== 'undefined' && symbolDisplayMap[val]) || val;

  const labelSpan = document.createElement("span");
  labelSpan.className = "cellLabel";
  labelSpan.textContent = displayVal;
  td.appendChild(labelSpan);

  td.addEventListener("click", (e) => {
    window.highlightCel(tt, tbody, thead, headRow, headers, idx, f, val, duration);

    if (e.ctrlKey || e.metaKey) {
      if (td.querySelector("input")) return;

      const input = document.createElement("input");
      input.type = "text";
      input.className = "cellInput";
      input.value = val;

      let isSaved = false; // Guard: prevents Enter and Blur from double-processing

      const saveAndExit = () => {
        if (isSaved) return; 
        isSaved = true;

        if (td.contains(input)) {
          setValueForTrackFrame(tt, idx, f - 1, input.value);
          renderDopeSheet(tt); // Re-renders the whole table
        }
      };

      labelSpan.remove();
      td.appendChild(input);
      input.focus();
      input.select();

      // Listeners
      input.addEventListener("blur", saveAndExit);
      input.addEventListener("keydown", (ke) => {
        if (ke.key === "Enter") {
          ke.preventDefault();
          saveAndExit();
        }
        if (ke.key === "Escape") {
          isSaved = true; // Mark as handled so blur doesn't save
          renderDopeSheet(tt); // Revert
        }
      });
    }
  });
  tr.appendChild(td);
});

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);

  if (window.xsheetCanvasBridge && typeof window.xsheetCanvasBridge.syncCanvasStack === 'function') {
      window.xsheetCanvasBridge.syncCanvasStack();
  }
}

function changeFrame(tt, trackIdx, duration, direction) {
  let f = window.activeFrame || 1;
  let step = (direction === "up" ? -1 : 1);
  let nextF = f + step;

  // Looping logic: if out of bounds, go to the other end
  if (nextF < 1) nextF = duration;
  if (nextF > duration) nextF = 1;

  const newVal = getValueForTrackFrame(tt, trackIdx, nextF - 1);
  return { frame: nextF, value: newVal };
}

function jumpToCel(tt, trackIdx, duration, direction) {
  let f = window.activeFrame || (direction === "up" ? duration : 1);
  let step = (direction === "up" ? -1 : 1);
  
  const isData = (frameNo) => {
    const val = getValueForTrackFrame(tt, trackIdx, frameNo - 1).trim();
    return val !== "" && !["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(val);
  };

  const getCell = (frameNo) => ({ frame: frameNo, value: getValueForTrackFrame(tt, trackIdx, frameNo - 1) });

  let nextF = f + step;
  if (nextF < 1 || nextF > duration) return cycle(tt, trackIdx, duration, direction);

  const currentIsData = isData(f);
  const nextIsData = isData(nextF);

  if (currentIsData && !nextIsData) {
    while (nextF >= 1 && nextF <= duration) {
      if (isData(nextF)) return getCell(nextF);
      nextF += step;
    }
  } else {
    while (nextF + step >= 1 && nextF + step <= duration) {
      if (isData(nextF) !== isData(nextF + step)) break;
      nextF += step;
    }
    return getCell(nextF);
  }
  return cycle(tt, trackIdx, duration, direction);
}

function cycle(tt, trackIdx, duration, direction) {
  const checkOrder = direction === "up" 
    ? Array.from({length: duration}, (_, i) => duration - i) 
    : Array.from({length: duration}, (_, i) => i + 1);

  for (let f of checkOrder) {
    const val = getValueForTrackFrame(tt, trackIdx, f - 1).trim();
    if (val !== "" && !["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(val)) {
      return { frame: f, value: val };
    }
  }
  return null;
}




window.highlightCel = function(tt, tbody, thead, headRow, headers, idx, f, val, duration) {
  // 1. CLEAR PREVIOUS HIGHLIGHTS
  tbody.querySelectorAll("td").forEach((c, i) => {
    if (i % (headers.length + 1) === 0) {
      c.style.backgroundColor = "#4073a3";
      c.style.color = "white";
    } else {
      c.style.backgroundColor = "";
      c.style.color = "white"; // Ensure text returns to white when not highlighted
    }
  });
  thead.querySelectorAll("th").forEach(h => { 
    h.style.backgroundColor = ""; 
    h.style.color = "white"; 
  });

  let originFrame = f, originVal = val;
  if (!val || ["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(val)) {
    for (let back = f; back >= 1; back--) {
      const v = getValueForTrackFrame(tt, idx, back - 1).trim();
      if (v && !["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(v)) {
        originFrame = back; originVal = v; break;
      }
    }
  }

  window.activeFrame = f; 
  window.activeTrack = headers[idx]; 
  window.activeCel = originVal; 
  xsheetCanvasBridge.syncCanvasStack();

  if (typeof activeTrackLabel !== 'undefined' && activeTrackLabel) activeTrackLabel.textContent = `Active Track: ${window.activeTrack}`;
  if (typeof activeCelLabel !== 'undefined' && activeCelLabel) activeCelLabel.textContent = `Active Cel: ${originVal || "Empty"} (Fr: ${f})`;

  // 2. HIGHLIGHT HEADER AND SIDEBAR (BLACK TEXT)
  const hCell = headRow.querySelectorAll("th")[idx + 1];
  if (hCell) { hCell.style.backgroundColor = "yellow"; hCell.style.color = "black"; }
  
  const fRow = tbody.querySelectorAll("tr")[f - 1];
  if (fRow) { 
    const fCell = fRow.querySelector("td");
    if (fCell) { fCell.style.backgroundColor = "yellow"; fCell.style.color = "black"; }
  }

  // 3. HIGHLIGHT TRACK SEQUENCE
  for (let forward = originFrame; forward <= duration; forward++) {
    const v = getValueForTrackFrame(tt, idx, forward - 1).trim();
    const row = tbody.querySelectorAll("tr")[forward - 1], 
          cell = row?.querySelectorAll("td")[idx + 1];
    
    if (!cell) break;

    if (forward === originFrame || !v || ["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(v)) {
      const isActive = (forward === f);
      
      cell.style.backgroundColor = isActive ? "yellow" : "#639063";
      cell.style.color = isActive ? "black" : "white"; // Switch to black if yellow, white if green

      if (forward !== originFrame && v && !["SYMBOL_TICK_1", "SYMBOL_TICK_2", "SYMBOL_HYPHEN"].includes(v)) break;
      continue;
    }
    break;
  }

  if (typeof syncLevelAndDrawing === 'function') syncLevelAndDrawing(window.activeTrack, window.activeCel);
  if (window.xsheetCanvasBridge && typeof window.xsheetCanvasBridge.syncCanvasStack === 'function') {
    window.xsheetCanvasBridge.syncCanvasStack();
  }
};

function getValueForTrackFrame(tt, trackIndex, frameNo) {
  const field = tt.fields?.find(f => f.fieldId === 0);
  if (!field) return "";
  const track = field.tracks?.find(t => t.trackNo === trackIndex);
  if (!track) return "";
  const frame = track.frames?.find(fr => fr.frame === frameNo);
  if (!frame) return "";
  // Maps through the data array and joins values
  return frame.data.map(d => d.values.join(",")).join(" | ");
}

function setValueForTrackFrame(tt, trackIndex, frameNo, newVal) {
  const field = tt.fields?.find(f => f.fieldId === 0);
  if (!field) return;
  const track = field.tracks?.find(t => t.trackNo === trackIndex);
  if (!track) return;

  let frame = track.frames.find(fr => fr.frame === frameNo);
  
  if (!frame) {
    // Create frame if missing
    frame = { frame: frameNo, data: [{ id: 0, values: [newVal.trim()] }] };
    track.frames.push(frame);
  } else {
    // FIX: Access the first object in the data array [0]
    if (!frame.data || frame.data.length === 0) {
      frame.data = [{ id: 0, values: [] }];
    }
    frame.data[0].values = [newVal.trim()]; 
  }
  track.frames.sort((a, b) => a.frame - b.frame);
}


// Animation State
let isPlaying = false;
let animationInterval = null;
const fps = 24;

function togglePlayback() {
  if (isPlaying) {
    stopAnimation();
  } else {
    playAnimation();
  }
}

function playAnimation() {
  if (!window.currentTT || isPlaying) return;
  
  isPlaying = true;
  const intervalMs = 1000 / fps;
  const idx = window.currentHeaders.indexOf(window.activeTrack) || 0;

  animationInterval = setInterval(() => {
    // Use the existing changeFrame function logic to progress
    const target = changeFrame(window.currentTT, idx, window.currentTT.duration, "down");
    
    if (target) {
      const tbody = document.querySelector("#tableContainer tbody");
      const thead = document.querySelector("#tableContainer thead");
      const headRow = thead?.querySelector("tr");
      
      window.highlightCel(
        window.currentTT, 
        tbody, 
        thead, 
        headRow, 
        window.currentHeaders, 
        idx, 
        target.frame, 
        target.value, 
        window.currentTT.duration
      );
    }
  }, intervalMs);
}

function stopAnimation() {
  isPlaying = false;
  clearInterval(animationInterval);
  animationInterval = null;
}


document.addEventListener("keydown", e => {
	
  if (!window.activeTrack || !window.currentTT) return;
  
  const idx = window.currentHeaders.indexOf(window.activeTrack);
  if (idx < 0) return;

  let target = null;
  if (e.altKey && e.key === "1") {
    e.preventDefault();
    target = jumpToCel(window.currentTT, idx, window.currentTT.duration, "up");
  } else if (e.altKey && e.key === "2") {
    e.preventDefault();
    target = jumpToCel(window.currentTT, idx, window.currentTT.duration, "down");
  }
  
  // Next/Prev Frame (New)
  else if (e.key === "ArrowLeft") {
    e.preventDefault();
    target = changeFrame(window.currentTT, idx, window.currentTT.duration, "up");
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    target = changeFrame(window.currentTT, idx, window.currentTT.duration, "down");
  }

// Play/Stop Shortcut
  if (e.key === "p") {
    e.preventDefault();
    togglePlayback();
    return; // Exit so it doesn't trigger other logic
  }
  
  
  if (target) {
    const tbody = document.querySelector("#tableContainer tbody");
    const thead = document.querySelector("#tableContainer thead");
    const headRow = thead.querySelector("tr");
    
    window.highlightCel(window.currentTT, tbody, thead, headRow, window.currentHeaders, idx, target.frame, target.value, window.currentTT.duration);
    
    const targetRow = tbody.querySelectorAll("tr")[target.frame - 1];
    const targetInput = targetRow?.querySelectorAll("td")[idx + 1]?.querySelector("input");
    if (targetInput) targetInput.focus();
  }
});
