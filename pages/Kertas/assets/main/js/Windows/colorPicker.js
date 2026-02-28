
  window.colorPicker = {
    activeColor: '#000000',
    activeColorBackground: '#ffffff',
    
    init: function() {
        // 1. Generate the HTML content
        const colors = [
            '#000000', '#808080', '#c0c0c0', '#ffffff', '#ff0000', '#ffc0cb', '#008000', '#90ee90',
            '#0080ff', '#00ffff', 'orange', 'yellow', '#800080', '#e6e6fa', '#ffdbac','rgba(0,0,0,0)'
        ];
        
        const gridHtml = colors.map(hex => 
            `<div class="cp-swatch" style="background-color:${hex};" data-hex="${hex}"></div>`
        ).join('');
        
        const uiContent = `
            <div class="cp-container">
                <div class="cp-preview-container">
					<div class="cp-preview-fg" id="cp-fg" style="background-color: ${this.activeColor}"></div>
                    <div class="cp-preview-bg" id="cp-bg" style="background-color: ${this.activeColorBackground}"></div>
                </div>
                <div class="cp-grid">${gridHtml}</div>
            </div>
        `;

        // 2. Create the window (using your existing function)
        // Params: title, targetArea, content, showResizer, isDockable
        const win = createWindow("Color Picker", null, uiContent, true, false);
        
        // 3. Force window to fit content
        win.style.minWidth = '0px';
        win.style.minHeight = '0px';
        win.style.width = '148px';
        win.style.height = 'auto';
        win.style.left = '235px';
        win.style.top = '10%';
        win.style.transform = 'none'; 
        
        // Ensure the content container allows the grid to expand
    const contentBody = win.querySelector('.content');
    if (contentBody) contentBody.style.height = '100%';

        // 4. NOW attach events to the elements inside the window
        this.attachEvents(win);
    },

    attachEvents: function(win) {
        const fgBox = win.querySelector('#cp-fg');
        const bgBox = win.querySelector('#cp-bg');

        const updateFG = (hex) => { 
            this.activeColor = hex; 
            if(fgBox) fgBox.style.backgroundColor = hex; 
        };
        const updateBG = (hex) => { 
            this.activeColorBackground = hex; 
            if(bgBox) bgBox.style.backgroundColor = hex; 
        };

        // Handle Swatch Clicks
        win.querySelectorAll('.cp-swatch').forEach(swatch => {
            swatch.onmousedown = (e) => {
                const hex = swatch.getAttribute('data-hex');
                if (e.button === 0) updateFG(hex); // Left Click
                if (e.button === 2) updateBG(hex); // Right Click
            };
            
            // Prevent context menu on right click
            swatch.oncontextmenu = (e) => e.preventDefault();

            // Double click for custom picker
            swatch.ondblclick = () => {
                const picker = document.createElement('input');
                picker.type = 'color';
                picker.value = swatch.getAttribute('data-hex');
                picker.oninput = () => {
                    const newHex = picker.value;
                    swatch.style.backgroundColor = newHex;
                    swatch.setAttribute('data-hex', newHex);
                    updateFG(newHex);
                };
                picker.click();
            };
        });

        // Global 'G' key swap
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'g') {
                const temp = this.activeColor;
                updateFG(this.activeColorBackground);
                updateBG(temp);
            }
        });
    }
};

// Start it up
window.colorPicker.init();
