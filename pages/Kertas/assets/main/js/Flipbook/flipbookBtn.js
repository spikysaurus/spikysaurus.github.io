const flipBtn = document.getElementById('flipbookBtn');

flipBtn.onclick = async function() {
    // Determine total length. If duration is in seconds, multiply by 24.
    // If your window.currentTT already represents individual frames, leave as is.
    const fps = 24; 
    const totalFrames = (window.currentTT) ? (window.currentTT.duration || window.currentTT.length) : 0;
    
    const { resW, resH } = window.cameraState;
    const frames = [];

    const mergeCanvas = document.createElement('canvas');
    mergeCanvas.width = resW;
    mergeCanvas.height = resH;
    const mctx = mergeCanvas.getContext('2d');

    const loadImage = (src) => new Promise(res => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.src = src;
    });

    // Loop through every frame index
    for (let f = 1; f <= totalFrames; f++) {
        mctx.clearRect(0, 0, resW, resH);
        mctx.save();

        // Ensure the camera updates to this specific frame
        cameraFeature.updateFromKeyframes(f);
        cameraFeature.apply(mctx);

        if (document.getElementById('includeBackdrop').checked) {
            const bg = document.getElementById('backdropCanvas');
            if (bg) mctx.drawImage(bg, 0, 0);
        }

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

        mctx.restore();
        // Capture as PNG for the flipbook
        frames.push(mergeCanvas.toDataURL('image/png'));
    }

    cameraFeature.updateFromKeyframes(window.activeFrame);

    const flipWindow = window.open("");
    // Use your existing flipbook function
    flipWindow.document.write(getFlipbookHTML(frames, resW, resH));
};
