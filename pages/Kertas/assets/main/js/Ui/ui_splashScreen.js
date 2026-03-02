(function createAnimeSplash() {
    const overlay = document.createElement('div');
    overlay.id = 'splash-overlay';
    
    overlay.innerHTML = `
        <div id="splash-container">
        <button id="splash-close-btn" aria-label="Close">CLOSE</button>
            <!-- Content Grid (Single Column) -->
            <div class="splash-content">
                <div class="top-content">
                    <!-- Top: Logo & Title -->
                    <header class="splash-header">
                        <h1>Kertas<span>(2026-03-03)</span></h1>
                    </header>

                    <!-- Middle: Changelog Section -->
                    <div class="changelog-section">
						<h3>WARNING!: THIS APP IS STILL EXPERIMENTAL!!</h3>
                        <ul>
							<li>Create Drawing by go to top area <b>Assets > Click Add Level</b>, then <b>Click Add Drawing</b> </li>
							<li>Create Xsheet by go to top area <b>Xsheet > New Xsheet</b></li>
							<li>Or click this button to create all of them and start Animating! <button id="newProjectBtn">Create New Project</button></li>
							
							<li>Find <b>Debug</b> tab on the <b>Left Area</b> to see more informations !</li>
							
                        </ul>
                    </div>
                </div>

                <!-- Bottom: Credits -->
                <footer class="splash-credits">
                    <p>Coded by <a href="https://spikysaurus.github.io" target="_blank"><strong>Spikysaurus</strong></a></p>
                    <p>Interface Icons are from <a target="_blank" href="https://docs.blender.org"><strong>Blender</strong></a></p>
                </footer>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
    #splash-overlay {
        position: fixed; 
        top: 0; left: 0; 
        width: 100vw; height: 100vh;
        display: flex; 
        justify-content: center; 
        align-items: center;
        z-index: 9999; 
        transition: opacity 0.4s ease;
        pointer-events: none; 
        padding: 20px;
        box-sizing: border-box;
    }

    #splash-container {
    position:relative;
        display: flex;
        flex-direction: column;
        width: 100%; 
        max-width: 500px; 
        max-height: 90vh; 
        background: #121218; 
        color: #ececed;
        border-radius: 20px; 
        border: 3px solid green;
        pointer-events: auto;
        cursor: default;
        overflow-y: auto; 
        -webkit-overflow-scrolling: touch;
    }
	
	#splash-close-btn {
		position: absolute;
		top: 15px;
		right: 15px;
		width: auto;
		height: auto;
		background: rgba(255, 255, 255, 0.05);
		border: none;
		color: #94a3b8;
		font-size: 12px;
		line-height: 1;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
		}

		#splash-close-btn:hover {
			background: #f43f5e;
			color: white;
		}


    .splash-content {
        padding: 45px; 
        display: flex; 
        flex-direction: column;
    }

    .splash-header { display: flex; align-items: center; gap: 18px; margin-bottom: 25px; flex-shrink: 0; }
    .splash-header h1 { font-size: 1.6rem; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
    .splash-header span { color: #f43f5e; margin-left: 10px; font-weight: 400; opacity: 0.8; }

    .changelog-section h3 { font-size: 0.75rem; color: orange; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; }
    .changelog-section ul { padding-left: 20px; margin: 0; color: #94a3b8; font-size: 0.9rem; }
    .changelog-section li { margin-bottom: 8px; }

    .splash-credits { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 25px; margin-top: 30px; flex-shrink: 0; }
    .splash-credits p { margin: 0; font-size: 0.9rem; color: #94a3b8; }
    .splash-credits a { color: orange; text-decoration: none; }

    /* Better handling for small mobile devices */
    @media (max-width: 500px) {
        #splash-overlay { padding: 10px; }
        #splash-container { border-radius: 15px; max-height: 95vh; }
        .splash-content { padding: 25px; }
        .splash-header h1 { font-size: 1.3rem; }
    }
`;


    document.head.appendChild(style);
    document.body.appendChild(overlay);
	
	function removeSplash(){
        overlay.style.opacity = '0';
            setTimeout(() => { 
                overlay.remove(); 
                style.remove(); 
                document.removeEventListener('mousedown', handleOutsideClick);
            }, 400);
        }
    // Global listener to detect clicks outside the container
    const handleOutsideClick = (e) => {
		const container = document.getElementById('splash-container');
        if (container && !container.contains(e.target)) {
            
            removeSplash();
        }
    };

document.getElementById('splash-close-btn').addEventListener('pointerdown', (e) => {
    e.stopPropagation(); // Prevent handleOutsideClick from firing twice
    removeSplash();
});

// Attach listener to document so we catch clicks passing through the overlay
document.addEventListener("mousedown", handleOutsideClick);

document.getElementById("newProjectBtn").addEventListener("click", () => {
  // Simulate creating tracks/levels/drawings
  newTimesheetBtn.click();
  addTrackBtn.click();
  addTrackBtn.click();

  newLevelBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();

  newLevelBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();

  newLevelBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();
  newDrawingBtn.click();

  // Now activate and edit Drawing 1 in Level A
  activateAndEdit("C", 0, {
    color: "blue",
    x: 50,
    y: 20
  });
	
		insertValueDirectly(0, 1, "1");
		insertValueDirectly(0, 4, "2");
		insertValueDirectly(0, 7, "3");
		insertValueDirectly(0, 10, "4");
		insertValueDirectly(0, 13, "5");
		insertValueDirectly(0, 16, "6");
		insertValueDirectly(0, 19, "7");
		insertValueDirectly(0, 22, "8");

		insertValueDirectly(1, 1, "1");
		insertValueDirectly(1, 4, "2");
		insertValueDirectly(1, 7, "3");
		insertValueDirectly(1, 10, "4");
		insertValueDirectly(1, 13, "5");
		insertValueDirectly(1, 16, "6");
		insertValueDirectly(1, 19, "7");
		insertValueDirectly(1, 22, "8");

		insertValueDirectly(2, 1, "1");
		insertValueDirectly(2, 4, "2");
		insertValueDirectly(2, 7, "3");
		insertValueDirectly(2, 10, "4");
		insertValueDirectly(2, 13, "5");
		insertValueDirectly(2, 16, "6");
		insertValueDirectly(2, 19, "7");
		insertValueDirectly(2, 22, "8");
	
		simulateCellClick(2, 1);
  removeSplash();
});




})();



