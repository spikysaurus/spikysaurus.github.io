/**
 * --- PLAYBACK MANAGER (24FPS) ---
 */

const playbackManager = {
    canvas: document.getElementById('playbackCanvas'),
    isPlaying: false,
    frameCache: [],
    currentFrame: 0,
    timer: null,

    // UI Overlay for progress
    progressOverlay: (function() {
        const div = document.createElement('div');
        div.id = "playbackProgress";
        div.style = `
            position: fixed; top: 50%; left: 50%; 
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8); color: white;
            padding: 20px 40px; border-radius: 8px;
            font-family: monospace; font-size: 24px;
            z-index: 2000; display: none; pointer-events: none;
        `;
        document.body.appendChild(div);
        return div;
    })(),

    updateProgress(percent) {
        this.progressOverlay.style.display = "block";
        this.progressOverlay.textContent = `Caching... ${percent}%`;
    },

    async toggle() {
        if (this.isPlaying) this.stop();
        else await this.play(24);
    },

    async play(fps = 24) {
    if (!window.currentTT) return;
    
    // FIX: Ensure the playback canvas matches the actual drawing size
    const activeCanvas = document.getElementById('canvas'); // or whatever your main ID is
    this.canvas.width = activeCanvas.width;
    this.canvas.height = activeCanvas.height;

    const totalFrames = window.currentTT.duration || 30;
        // 1. Show UI and Cache
        this.frameCache = await this.generateCache(totalFrames);
        this.progressOverlay.style.display = "none"; // Hide when done
        
        this.isPlaying = true;
        this.currentFrame = 0;

        // 2. VISIBILITY
        document.querySelectorAll('.canvases').forEach(el => {
            const id = el.id;
            if (!['playbackCanvas', 'backgroundColorCanvas', 'backdropCanvas'].includes(id)) {
                el.style.visibility = 'hidden';
            }
        });

        this.canvas.style.display = "block";
        this.timer = setInterval(() => this.renderNextFrame(), 1000 / fps);
    },
    
    async generateCache(total) {
    const cache = [];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tctx = tempCanvas.getContext('2d');

    for (let f = 1; f <= total; f++) {
        const percent = Math.floor((f / total) * 100);
        this.updateProgress(percent);

        tctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        for (let i = 0; i < window.currentHeaders.length; i++) {
            const track = window.currentHeaders[i];
            const drawingName = xsheetCanvasBridge.resolveKeyframe(i, f);
            
            if (drawingName && levels[track]) {
                const drawing = levels[track].find(d => d.name.replace(/\.png$/, "") === drawingName);
                if (drawing?.data) {
                    const img = await this.loadImage(drawing.data);
                    tctx.drawImage(img, 0, 0);
                }
            }
        }
        
        // FIX: Wrap the Image creation in a Promise to wait for it to load
        const frameImg = await new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = tempCanvas.toDataURL('image/png');
        });
        
        cache.push(frameImg);
        
        if (f % 5 === 0) await new Promise(r => setTimeout(r, 1));
    }
    return cache;
}

    
    ,

    stop() {
        this.isPlaying = false;
        clearInterval(this.timer);
        this.canvas.style.display = "none";
        document.querySelectorAll('.canvases').forEach(el => el.style.visibility = 'visible');
        if (window.xsheetCanvasBridge) window.xsheetCanvasBridge.syncCanvasStack();
    },

    renderNextFrame() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.frameCache[this.currentFrame]) {
            ctx.drawImage(this.frameCache[this.currentFrame], 0, 0);
            this.currentFrame = (this.currentFrame + 1) % this.frameCache.length;
        }
    },

    loadImage: (src) => new Promise(res => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
    })
};


//Shortcuts
window.addEventListener('keydown', e => {
    if (e.key === 'p') {
        e.preventDefault();
        playbackManager.toggle();
    }
    
    // Spacebar to Stop
    if (e.code === 'Space' && playbackManager.isPlaying) {
        e.preventDefault();
        playbackManager.stop();
    }
    
	if (e.key === 'l') {
		e.preventDefault();
		togglePlayback();
		return;
	}

});

  
