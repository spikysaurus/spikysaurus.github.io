enableTimelinePan();
//Timeline Pan
function enableTimelinePan() {
  const container = document.getElementById('timeline_v2');

  let isPanning = false;
  let startX = 0;
  let offsetX = 0; // accumulated offset

  container.addEventListener('pointerdown', e => {
    isPanning = true;
    startX = e.clientX - offsetX;
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', e => {
    if (!isPanning) return;
    offsetX = e.clientX - startX;

    // Clamp so it never goes beyond left:0
    if (offsetX > 0) {
      offsetX = 0;
    }

    container.style.transform = `translateX(${offsetX}px)`;
  });

  container.addEventListener('pointerup', e => {
    isPanning = false;
    container.releasePointerCapture(e.pointerId);
  });

  container.addEventListener('pointercancel', e => {
    isPanning = false;
    container.releasePointerCapture(e.pointerId);
  });
}
