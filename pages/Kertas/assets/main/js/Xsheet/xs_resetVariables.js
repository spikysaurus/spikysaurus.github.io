window.addEventListener("DOMContentLoaded", () => {
  // Reset symbol inputs
  document.getElementById("symNull").value = "x";
  document.getElementById("symTick1").value = "○";
  document.getElementById("symTick2").value = "●";
  document.getElementById("symHyphen").value = "｜";
	canvasWidthInput.value = "1280";
	canvasHeightInput.value = "720";
  // Reset symbol map in JS
  symbolDisplayMap = {
    SYMBOL_NULL_CELL: "x",
    SYMBOL_TICK_1: "○",
    SYMBOL_TICK_2: "●",
    SYMBOL_HYPHEN: "｜"
  };
});
