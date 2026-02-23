(function() {
    // 1. Inject Styles
    const s = document.createElement('style');
    s.textContent = `
        .tip-box { border:1px solid #444; position: fixed; top: 0; left: 0; background: black; color: #fff; padding: 10px; border-radius: 6px; 
                   font-family: system-ui, sans-serif; font-size: 13px; pointer-events: none; z-index: 9999; 
                    opacity: 0; transition: opacity .15s; max-width: 220px; }
        .tip-name { font-weight: 700; color: #fbbf24; display: block; margin-bottom: 3px; }
        .tip-desc { font-size: 12px; color: #d1d5db; display: block; line-height: 1.4; }
        /* Container for multiple keys */
        .tip-key-container { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
        .tip-key { background: #374151; padding: 2px 6px; border-radius: 4px; 
                   font-size: 10px; font-weight: 600; color: #f3f4f6; border: 1px solid #4b5563; }
        .tip-show { opacity: 1; }
    `;
    document.head.appendChild(s);

    const tip = document.createElement('div');
    tip.className = 'tip-box';
    document.body.appendChild(tip);

    let delayTimer;

    const update = (e) => {
        const b = e.currentTarget, d = b.dataset;
        clearTimeout(delayTimer);

        delayTimer = setTimeout(() => {
            // Logic to handle multiple keys from the data attribute
            const keysAttr = d.shortcut || "";
            const keysHtml = keysAttr ? keysAttr.split('|').map(k => `<span class="tip-key">${k}</span>`).join('') : '';

            tip.innerHTML = `
                ${d.name ? `<span class="tip-name">${d.name}</span>` : ''}
                ${d.description ? `<span class="tip-desc">${d.description}</span>` : ''}
                ${keysHtml ? `<div class="tip-key-container">${keysHtml}</div>` : ''}
            `;

            const r = b.getBoundingClientRect();
            tip.classList.add('tip-show');
            
            let x = r.right + 10;
            let y = r.top + (r.height / 2) - (tip.offsetHeight / 2);

            if (x + tip.offsetWidth > window.innerWidth) x = r.left - tip.offsetWidth - 10;
            if (y + tip.offsetHeight > window.innerHeight) y = window.innerHeight - tip.offsetHeight - 10;
            
            tip.style.transform = `translate(${x}px, ${y}px)`;
        }, 400);
    };

    const hide = () => {
        clearTimeout(delayTimer);
        tip.classList.remove('tip-show');
    };

    window.TooltipLib = {
        refresh: () => {
            document.querySelectorAll('[data-name], [data-description]').forEach(el => {
                el.removeEventListener('mouseenter', update);
                el.removeEventListener('mouseleave', hide);
                el.addEventListener('mouseenter', update);
                el.addEventListener('mouseleave', hide);
            });
        },
        assign: function(config) {
            Object.entries(config).forEach(([id, data]) => {
                const el = document.getElementById(id);
                if (el) {
                    if (data.name) el.dataset.name = data.name;
                    if (data.desc) el.dataset.description = data.desc;
                    
                    // NEW: Join array of keys with a separator for storage in dataset
                    if (data.keys) {
                        el.dataset.shortcut = Array.isArray(data.keys) ? data.keys.join('|') : data.keys;
                    }
                }
            });
            this.refresh();
        }
    };
})();

// --- ASSIGNMENT WITH MULTIPLE KEYS ---
window.TooltipLib.assign({
	//~ Assets > Drawing
	'newDrawingBtn': { 
        name: "New Drawing", 
        desc: "Creates new Drawing in the Active Level", 
        keys: ["Backtick"] 
    },
    'deleteDrawingBtn': { 
        name: "Delete Drawing", 
        desc: "Delete Active Drawing", 
        keys: [] 
    },
	'prevDrawingBtn': { 
        name: "Prev Drawing", 
        desc: "Jump to the previous drawing in the Active Level", 
        keys: ["Alt + Q","Shift + Comma"] 
    },
    'nextDrawingBtn': { 
        name: "Next Drawing", 
        desc: "Jump to the next drawing in the Active Level", 
        keys: ["Alt + W", "Shift + Dot"] // Array of keys
    },
    //~ Tools
    'toolBrushBtn': { 
        name: "Brush Tool", 
        desc: "Hold [Ctrl] to Erase", 
        keys: ["W"] 
    },
     'toolEraserBtn': { 
        name: "Eraser Tool", 
        desc: "", 
        keys: ["E"] 
    }
    
});
