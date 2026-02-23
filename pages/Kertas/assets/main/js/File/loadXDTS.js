let xdtsData = null;

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
const dropZone = document.getElementById("dropZone");
const loadXDTSbtn = document.getElementById("loadXDTSbtn");

loadXDTSbtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) fileLoadXDTS(file);
});

dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) fileLoadXDTS(file);
});
