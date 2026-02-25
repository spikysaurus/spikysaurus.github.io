const flipBtn = document.getElementById('flipbookBtn');

flipBtn.onclick = async function() {
    const totalFrames = (window.currentTT) ? (window.currentTT.duration || window.currentTT.length) : 0;
    const width = activeCanvas.width;
    const height = activeCanvas.height;
    const frames = [];

    // Helper to load image from dataURI
    const loadImage = (src) => new Promise(res => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
    });

    const mergeCanvas = document.createElement('canvas');
    mergeCanvas.width = width;
    mergeCanvas.height = height;
    const mctx = mergeCanvas.getContext('2d');

    console.log("Generating Flipbook for " + totalFrames + " frames...");

    for (let f = 1; f <= totalFrames; f++) {
        mctx.clearRect(0, 0, width, height);
        
        // Draw layers from bottom to top (Xsheet order)
        for (let idx = 0; idx < window.currentHeaders.length; idx++) {
            const trackName = window.currentHeaders[idx];
            const drawingName = resolveDrawingName(window.currentTT, idx, f);
            
            if (drawingName && levels[trackName]) {
                const drawing = levels[trackName].find(d => d.name.replace(/\.png$/, "") === drawingName);
                if (drawing && drawing.data) {
                    const img = await loadImage(drawing.data);
                    mctx.drawImage(img, 0, 0);
                }
            }
        }
        frames.push(mergeCanvas.toDataURL('image/png'));
    }

    const flipWindow = window.open("");
    flipWindow.document.write(getFlipbookHTML(frames, width, height));
    flipWindow.document.close();
};
