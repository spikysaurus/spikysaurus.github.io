(function createInvertedTaperedSpeedlines() {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.textContent = `
        #speedCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9999;
            pointer-events: none;
            display: none; 
            background: transparent;
        }
    `;
    document.head.appendChild(style);

    // 2. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'speedCanvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let width, height, centerX, centerY;
    let isActive = false; 
    
    const lineCount = 160;      
    const innerRadius = 300;    
    const fixedLength = 1000;    
    const startThickness = 0.5; 
    const endThickness = 10;    

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        centerX = width / 2;
        centerY = height / 2;
    }

    // 3. Updated Toggle Logic: Shift + P
    window.addEventListener('keydown', (e) => {
        // e.shiftKey checks for Shift, e.code 'KeyP' detects the P key
        if (e.shiftKey && e.code === 'KeyO') {
            isActive = !isActive;
            canvas.style.display = isActive ? 'block' : 'none';
        }
    });

    window.addEventListener('resize', resize);
    resize();

    function render() {
        if (!isActive) {
            requestAnimationFrame(render);
            return;
        }

        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < lineCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * (innerRadius + fixedLength);
            const y2 = centerY + Math.sin(angle) * (innerRadius + fixedLength);

            const perpAngle = angle + Math.PI / 2;
            const tx1 = Math.cos(perpAngle) * (startThickness / 2);
            const ty1 = Math.sin(perpAngle) * (startThickness / 2);
            const tx2 = Math.cos(perpAngle) * (endThickness / 2);
            const ty2 = Math.sin(perpAngle) * (endThickness / 2);

            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

            ctx.beginPath();
            ctx.moveTo(x1 - tx1, y1 - ty1);
            ctx.lineTo(x1 + tx1, y1 + ty1);
            ctx.lineTo(x2 + tx2, y2 + ty2);
            ctx.lineTo(x2 - tx2, y2 - ty2);
            ctx.closePath();
            
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        requestAnimationFrame(render);
    }

    render();
})();
