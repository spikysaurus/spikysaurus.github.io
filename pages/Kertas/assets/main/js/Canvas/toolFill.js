let colorTolerance = 0;
let fillGrowShrink = 0.5; // positive = grow, negative = shrink

const toolFill = {
  getMergedImageData() {
    if (!activeCanvas) return null;
    const w = activeCanvas.width, h = activeCanvas.height;
    const temp = document.createElement("canvas"); temp.width = w; temp.height = h;
    const tctx = temp.getContext("2d");
    [...document.querySelectorAll("#canvasContainer canvas")]
      .filter(c => c !== backdropCanvas && c.style.display !== "none" && c.width > 0 && c.height > 0) // ignore backdrop
      .forEach(c => tctx.drawImage(c, 0, 0));
    return tctx.getImageData(0, 0, w, h);
  },

  floodFill(x, y, erase = false) {
    const w = activeCanvas.width, h = activeCanvas.height, imgData = this.getMergedImageData();
    if (!imgData || x < 0 || y < 0 || x >= w || y >= h) return;
    const d = imgData.data, idx = (y * w + x) * 4, target = d.slice(idx, idx + 4);
    const fillColor = erase ? [0,0,0,0] : this.parseCssColor(window.colorPicker?.activeColor || "rgba(0,200,255,1)");
    const match = i => Math.abs(d[i]-target[0])<=colorTolerance && Math.abs(d[i+1]-target[1])<=colorTolerance &&
                       Math.abs(d[i+2]-target[2])<=colorTolerance && Math.abs(d[i+3]-target[3])<=colorTolerance;
    const mask = new Uint8Array(w*h), stack=[[x,y]];
    while(stack.length){
      let [cx,cy]=stack.pop(); if(cx<0||cy<0||cx>=w||cy>=h) continue;
      let i=(cy*w+cx)*4; if(!match(i)||mask[cy*w+cx]) continue;
      let lx=cx,rx=cx; while(lx>=0&&match((cy*w+lx)*4)) lx--; lx++; while(rx<w&&match((cy*w+rx)*4)) rx++; rx--;
      for(let px=lx;px<=rx;px++){ const pi=(cy*w+px)*4; mask[cy*w+px]=1;
        if(cy>0&&!mask[(cy-1)*w+px]) stack.push([px,cy-1]);
        if(cy<h-1&&!mask[(cy+1)*w+px]) stack.push([px,cy+1]);
      }
    }

    // Grow/shrink mask
    if(fillGrowShrink!==0){
      const newMask=new Uint8Array(w*h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const idx=y*w+x;
        if(mask[idx]){
          if(fillGrowShrink>0){
            for(let dy=-fillGrowShrink;dy<=fillGrowShrink;dy++)
              for(let dx=-fillGrowShrink;dx<=fillGrowShrink;dx++){
                const nx=x+dx,ny=y+dy;
                if(nx>=0&&ny>=0&&nx<w&&ny<h) newMask[ny*w+nx]=1;
              }
          } else {
            let keep=true;
            for(let dy=fillGrowShrink;dy<=-fillGrowShrink;dy++)
              for(let dx=fillGrowShrink;dx<=-fillGrowShrink;dx++){
                const nx=x+dx,ny=y+dy;
                if(nx>=0&&ny>=0&&nx<w&&ny<h) if(!mask[ny*w+nx]) keep=false;
              }
            if(keep) newMask[idx]=1;
          }
        }
      }
      mask.set(newMask);
    }

    // Apply fill color
    for(let y=0;y<h;y++)for(let x=0;x<w;x++) if(mask[y*w+x]){
      const pi=(y*w+x)*4; d[pi]=fillColor[0]; d[pi+1]=fillColor[1]; d[pi+2]=fillColor[2]; d[pi+3]=fillColor[3];
    }

    activeCanvasCtx.putImageData(imgData,0,0);
    if(activeDrawing) activeDrawing.data=activeCanvas.toDataURL("image/png");
  },

  pickColor(x,y){
    const imgData=this.getMergedImageData(); if(!imgData||x<0||y<0||x>=activeCanvas.width||y>=activeCanvas.height) return;
    const d=imgData.data, idx=(y*activeCanvas.width+x)*4;
    const rgba=`rgba(${d[idx]},${d[idx+1]},${d[idx+2]},${(d[idx+3]/255).toFixed(3)})`;
    if(window.colorPicker) window.colorPicker.activeColor=rgba;
    console.log("Picked color:",rgba);
  },

  fillAtClick(e){
    const pos=getMousePos(e),x=Math.floor(pos.x),y=Math.floor(pos.y);
    if(e.altKey) this.pickColor(x,y); else this.floodFill(x,y,e.ctrlKey);
  },

  parseCssColor(str){
    const ctx=document.createElement("canvas").getContext("2d"); ctx.fillStyle=str; const computed=ctx.fillStyle;
    if(/^#/.test(computed)){ let hex=computed.slice(1); if(hex.length===3) hex=hex.split("").map(c=>c+c).join("");
      const num=parseInt(hex,16); return [(num>>16)&255,(num>>8)&255,num&255,255]; }
    const m=computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if(m) return [+m[1],+m[2],+m[3],Math.round((m[4]||1)*255)];
    const hsl=str.match(/hsla?\((\d+),\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)/i);
    if(hsl){ let h=+hsl[1]/360,s=+hsl[2]/100,l=+hsl[3]/100,a=(hsl[4]!==undefined?+hsl[4]:1);
      const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
      let r,g,b; if(s===0){r=g=b=l;} else {const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q; r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);}
      return [Math.round(r*255),Math.round(g*255),Math.round(b*255),Math.round(a*255)];
    }
    return [0,0,0,255];
  }
};

// Tool switching
function switchTool(tool,tmp=false){
  if(tool!==activeTool){ if(!tmp) previousTool=tool; activeTool=tool; isDrawing=false; isDragging=false; strokePoints=[]; }
  if(tool==="ToolFill") activeCanvas.style.cursor="crosshair";
}

// Input bindings
window.addEventListener("pointerdown",e=>{ if(activeTool==="ToolFill"&&activeDrawing) toolFill.fillAtClick(e); });
document.addEventListener("keydown",e=>{ if(e.key.toLowerCase()==="f") switchTool("ToolFill"); });
