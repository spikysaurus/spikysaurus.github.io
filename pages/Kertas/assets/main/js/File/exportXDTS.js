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
