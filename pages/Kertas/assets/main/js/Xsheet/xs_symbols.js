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
