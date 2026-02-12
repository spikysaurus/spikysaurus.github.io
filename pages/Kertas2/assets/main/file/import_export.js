
ShowFileWindow = false;
fileWindowBtn.onclick = () => {
	ShowFileWindow = !ShowFileWindow;
	if (ShowFileWindow){
	fileWindow.style.display = "block";
	}
	else{
	fileWindow.style.display = "none";
	}
	
};

// Snapshot
snapshotBtn.onclick = () => {
    const tmp = document.createElement('canvas');
    tmp.width = cv_background.width;
    tmp.height = cv_background.height;
    const tx = tmp.getContext('2d');
    tx.drawImage(cv_background, 0, 0);
    tx.drawImage(active_layer, 0, 0);
    const link = document.createElement('a');
    link.download = 'img.png';
    link.href = tmp.toDataURL();
    link.click()
}

loadBackgroundLinkBtn.onclick = () => {
    const u = document.getElementById('url').value.trim();
    if (!u) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        resize(img.width, img.height);
        cvx_background.clearRect(0, 0, cv_background.width, cv_background.height);
        cvx_background.drawImage(img, 0, 0);
        clearPixels();
        frames[frame_current] = dataURL;
        render();
    };
    img.src = u
}

// Load Image
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

function importImageSequence(files, bgUrl = null) {
    frames.length = files.length;
    let loaded = 0;

    files.forEach((file, idx) => {
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                // For the very first frame, resize canvas BEFORE composing
                if (idx === 0) {
                    const firstImg = await loadImage(reader.result);
                    resize(firstImg.width, firstImg.height);

                    document.getElementById('canvasWidth').value = firstImg.width;
                    document.getElementById('canvasHeight').value = firstImg.height;
                }

                // Compose background + frame into a dataURL using the resized canvas
                const dataURL = await composeFrame(bgUrl, reader.result, active_layer.width, active_layer.height);
                frames[idx] = dataURL;
                loaded++;

                if (loaded === files.length) {
                    frame_current = 0;
                    show(frame_current);
                    render();
                }
            } catch (e) {
                console.error(`Error composing frame ${idx}:`, e);
            }
        };

        reader.onerror = () => console.error(`Error reading file: ${file.name}`);
        reader.readAsDataURL(file);
    });
}

// Helper: load image from URL or dataURL
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// --- Import Button Handler for Image Sequences ---
document.getElementById('importSequence').onclick = () => {
    const input = document.createElement('input');
    input.type = "file";
    input.multiple = true;              // allow multiple images
    input.accept = "image/*";           // restrict to image files only
    input.onchange = e => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        importImageSequence(files);     // call the importer
    };
    input.click();
};

// Helper: composite background + frame into a dataURL
async function composeFrame(bgUrl, frameUrl, outW, outH) {
    const can = document.createElement('canvas')
    can.width = outW
    can.height = outH
    const ctx = can.getContext('2d')
    // Fill transparent background to avoid PDF black page
//    ctx.fillStyle = "#ffffff"
//    ctx.fillRect(0, 0, outW, outH)
    // Draw background if present
    if (bgUrl) {
        try {
            const bgImg = await loadImage(bgUrl)
            const r = Math.min(outW / bgImg.width, outH / bgImg.height)
            const w = bgImg.width * r,
                h = bgImg.height * r
            const x = (outW - w) / 2,
                y = (outH - h) / 2
            ctx.drawImage(bgImg, x, y, w, h)
        } catch (e) {
            // ignore bg errors, continue with frame
        }
    }
    // Draw frame (dataURL or external)
    if (frameUrl) {
        const frImg = await loadImage(frameUrl)
        const r = Math.min(outW / frImg.width, outH / frImg.height)
        const w = frImg.width * r,
            h = frImg.height * r
        const x = (outW - w) / 2,
            y = (outH - h) / 2
        ctx.drawImage(frImg, x, y, w, h)
    }
	return can.toDataURL("image/png");
//    return can.toDataURL("image/jpeg", 0.92) // smaller PDF size; use PNG if needed
}


// Export PDF
document.getElementById('pdf').onclick = async () => {
    const {
        jsPDF
    } = window.jspdf
    const pdf = new jsPDF()
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const bgUrl = document.getElementById('url').value.trim() || null
    try {
        for (let i = 0; i < frames.length; i++) {
            const compositeDataURL = await composeFrame(bgUrl, frames[i], Math.floor(pageW * 4), Math.floor(pageH * 4))
            // Add scaled image to page (PDF units are in pt by default)
            pdf.addImage(compositeDataURL, 'JPEG', 0, 0, pageW, pageH)
            if (i < frames.length - 1) pdf.addPage()
        }
        pdf.save("document.pdf")
    } catch (err) {
        console.error("PDF export failed:", err)
        alert("PDF export failed. Check console for details.")
    }
}
