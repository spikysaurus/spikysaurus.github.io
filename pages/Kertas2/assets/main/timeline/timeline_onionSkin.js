
//Onion Skin
// Create two canvases: underlay (for onion skin) and main (for current frame)
const underlay = document.createElement("canvas");
underlay.width = active_layer.width;
underlay.height = active_layer.height;
const underCtx = underlay.getContext("2d");

active_layer.parentNode.insertBefore(underlay, active_layer);
active_layer.style.position = "absolute";
underlay.style.position = "absolute";

let showOnionSkin = false;


function tintFrame(src, color, alpha, ctx) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    const off = document.createElement("canvas");
    off.width = active_layer.width;
    off.height = active_layer.height;
    const offCtx = off.getContext("2d");

    offCtx.drawImage(img, 0, 0);

    const imageData = offCtx.getImageData(0, 0, active_layer.width, active_layer.height);
    const data = imageData.data;

    let tintRGB;
    if (color === "red") tintRGB = [255, 0, 0];
    else if (color === "blue") tintRGB = [0, 0, 255];
    else tintRGB = [0, 0, 0];

    for (let p = 0; p < data.length; p += 4) {
      if (data[p + 3] > 0) {
        data[p]   = (data[p]   * (1 - alpha)) + (tintRGB[0] * alpha);
        data[p+1] = (data[p+1] * (1 - alpha)) + (tintRGB[1] * alpha);
        data[p+2] = (data[p+2] * (1 - alpha)) + (tintRGB[2] * alpha);
      }
    }

    offCtx.putImageData(imageData, 0, 0);

    ctx.save();
    ctx.globalAlpha = 0.2; // ghost opacity
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  };
}

// Onion skin toggle
onionBtn.onclick = () => {
  showOnionSkin = !showOnionSkin;
  show(frame_current); // refresh current frame with onion skin state
  onionBtn.style.backgroundColor = showOnionSkin ? "yellow" : "";
};
