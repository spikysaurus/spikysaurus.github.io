// --- New Blank Timesheet with user-defined duration ---
document.getElementById("newTimesheetBtn").addEventListener("click", () => {
  const durationInput = parseInt(document.getElementById("newDuration").value, 10);
  const duration = isNaN(durationInput) || durationInput < 1 ? 30 : durationInput;
	
	document.getElementById("titleInput").value = "";
	document.getElementById("sceneInput").value = 0;
	document.getElementById("cutInput").value = 0;
	document.getElementById("nameInput").value = "";
	document.getElementById("memoInput").value = "Memo";
	
  xdtsData = {
	header:{
		title: "",
		scene: 0,
		cut: 0,
		name: "",
		memo: ""
		},
    timeTables: [{
      duration: duration,
      timeTableHeaders: [{ names: ["A"] }],
      fields: [{
        fieldId: 0,
        tracks: [{ trackNo: 0, frames: [] }]   // start at 0
      }]
    }]
  };

  renderDopeSheet(xdtsData);
  updateDurationLabel();
  document.getElementById("exportBtn").style.display = "inline-block";
  
});
