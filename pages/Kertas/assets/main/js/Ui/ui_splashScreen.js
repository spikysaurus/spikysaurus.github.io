(function createAnimeSplash() {
    const overlay = document.createElement('div');
    overlay.id = 'splash-overlay';
    
    overlay.innerHTML = `
        <div id="splash-container">
            <!-- Content Grid (Now Single Column) -->
            <div class="splash-content">
                <div class="top-content">
                    <!-- Top: Logo & Title -->
                    <header class="splash-header">
                        <h1>Kertas<span>(2026-02-28)</span></h1>
                    </header>

                    <!-- Middle: Changelog Section -->
                    <div class="changelog-section">
                        <h3>Click anywhere outside the box to close this</h3>
                        <ul>
							<li>Create Drawing by go to <b>Assets Stuff > Click Add Level</b>, then <b>Click Add Drawing</b> </li>
							<li>Create Xsheet by go to <b>Xsheet Stuff > New Xsheet</b></li>
							<li>Or click this button to create all of them and start drawing! <button id="newProjectBtn">Create New Project</button></li>
							<li><b>Ctrl+LMB</b> on the Xsheet cell to edit their values</li>
                            <li>You can load .xdts by dropping the file into <b>Xsheet Area</b></li>
                            <li>Dropping assets .zip file into <b>Assets Area</b> also works</li>
							<li>You can hover over a button to display a tooltip to see its keyboard shortcut</li>
                            <li>Press <b>F1</b> to show more shortcuts</li>
                            <li><b>Hold Shift and Drag</b> tabs to detatch it into a floating window, <b>Hold Shift and Drag</b> the window's title bar into any areas and <b>Release LMB</b> to dock it</li>
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
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; justify-content: center; align-items: center;
            z-index: 9999; transition: opacity 0.4s ease;
            /* Allow clicking through the overlay to the app below */
            pointer-events: none; 
        }

        #splash-container {
            display: grid;
            grid-template-columns: 1fr;
            width: 90%; max-width: 500px; height: auto;
            background: #121218; color: #ececed;
            border-radius: 20px; overflow: hidden;
            border: 3px solid green;
            /* Re-enable clicks for the box itself */
            pointer-events: auto;
            cursor: default;
        }

        .splash-content {
            padding: 45px; display: flex; flex-direction: column; justify-content: space-between;
        }

        .splash-header { display: flex; align-items: center; gap: 18px; margin-bottom: 25px; }
        .splash-header h1 { font-size: 1.6rem; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
        .splash-header span { color: #f43f5e; margin-left: 10px; font-weight: 400; opacity: 0.8; }

        .changelog-section h3 { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; }
        .changelog-section ul { padding-left: 20px; margin: 0; color: #94a3b8; font-size: 0.9rem; }
        .changelog-section li { margin-bottom: 8px; }

        .splash-credits { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 25px; margin-top: 30px; }
        .splash-credits p { margin: 0; font-size: 0.9rem; color: #94a3b8; }
        .splash-credits a { color: green; text-decoration: none; }

        @media (max-width: 750px) {
            #splash-container { width: 95%; }
            .splash-content { padding: 30px; }
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


// Attach listener to document so we catch clicks passing through the overlay
document.addEventListener("mousedown", handleOutsideClick);

document.getElementById("newProjectBtn").addEventListener("click", () => {
  // Simulate creating tracks/levels/drawings
  newTimesheetBtn.click();
  addTrackBtn.click();
  addTrackBtn.click();

  newLevelBtn.click();
  newDrawingBtn.click();

  newLevelBtn.click();
  newDrawingBtn.click();

  newLevelBtn.click();
  newDrawingBtn.click();

  // Now activate and edit Drawing 1 in Level A
  activateAndEdit("A", 0, {
    color: "blue",
    x: 50,
    y: 20
  });

  removeSplash();
});




})();



