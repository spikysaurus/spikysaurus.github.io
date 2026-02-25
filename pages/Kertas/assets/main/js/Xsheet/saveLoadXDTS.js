let xdtsData = null;

document.getElementById("exportBtn").addEventListener("click", () => {
  if (!xdtsData) return;


  const hh = xdtsData.header;
  hh.title = document.getElementById("titleInput").value || "";
  hh.scene = parseInt(document.getElementById("sceneInput").value, 10) || 0;
  hh.cut   = parseInt(document.getElementById("cutInput").value, 10) || 0;
  hh.name  = document.getElementById("nameInput").value || "";
  hh.memo = document.getElementById("memoInput").value;
  
  // Normalize trackNo to zero-based before export
  const tt = xdtsData.timeTables[0];
  const field = tt.fields.find(f => f.fieldId === 0);
  field.tracks.forEach((t, i) => t.trackNo = i);

  const jsonString = "exchangeDigitalTimeSheet Save Data" + JSON.stringify(xdtsData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Kertas_timesheet.xdts";
  a.click();
});


// File handling
function fileLoadXDTS(file) {
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
      // Reassign trackNo zero-based
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
const dropZone = document.querySelector(".dropZone"); // Added 'const'
const loadXDTSbtn = document.getElementById("loadXDTSbtn");

loadXDTSbtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) fileLoadXDTS(file);
});

dropZone.addEventListener("dragover", e => { 
  e.preventDefault(); 
  dropZone.style.opacity = "0.5";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.opacity = "1";
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.style.opacity = "1";
  const file = e.dataTransfer.files[0];
  if (file) fileLoadXDTS(file);
});


