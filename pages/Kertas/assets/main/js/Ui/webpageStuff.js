function isUserEditing(e) {
  return e.target.tagName === "INPUT" || 
         e.target.tagName === "TEXTAREA" || 
         e.target.isContentEditable;
}

// Prevent Backspace from navigating back
document.addEventListener('keydown', e => {
  if (e.key === 'Backspace' &&
      !['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName) &&
      !e.target.isContentEditable) {
    e.preventDefault();
  }
});

// Prevent Alt+number shortcuts (Alt+1, Alt+2, Alt+3, etc.)
document.addEventListener('keydown', e => {
  if (e.altKey && /^Digit[0-9]$/.test(e.code)) {
    e.preventDefault();
  }
});


// Prevent text selection except for inputs, textareas, and editable elements
document.addEventListener('selectstart', e => {
  const tag = e.target.tagName;
  if (!(tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable)) {
    e.preventDefault();
  }
});

// Prevent "/" from triggering browser "Quick Find"
document.addEventListener('keydown', e => {
  if (e.key === '/' && !isUserEditing(e)) {
    e.preventDefault();
  }
});


//~ window.addEventListener('wheel', e => e.preventDefault(), { passive: false });
//~ window.addEventListener('keydown', e => {
  //~ if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End','Space'].includes(e.key)) {
    //~ e.preventDefault();
  //~ }
//~ });
