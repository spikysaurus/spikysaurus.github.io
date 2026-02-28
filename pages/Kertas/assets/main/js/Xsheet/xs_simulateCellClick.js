function simulateCellClick(trackIdx, frameNum) {
  const container = document.getElementById("tableContainer");
  const table = container.querySelector("table");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  
  // 1. Find the Row (frameNum 1 is index 0)
  const targetRow = tbody.rows[frameNum - 1];
  if (!targetRow) return;

  // 2. Find the Cell (trackIdx 0 is first track, +1 to skip 'Fr' column)
  const targetCell = targetRow.cells[trackIdx + 1];
  if (!targetCell) return;

  // 3. Dispatch the click event
  // This triggers the 'td.addEventListener("click", ...)' inside your renderDopeSheet
  targetCell.dispatchEvent(new Event("click", { bubbles: true }));

  // Optional: Scroll it into view if the table is long
  targetCell.scrollIntoView({ block: "center", behavior: "smooth" });
}

//~ simulateCellClick(1, 1);
