(function() {
    'use strict';

    // --- Create container elements dynamically ---
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '50%';
    wrapper.style.left = '50%';
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.width = '100%';
    wrapper.style.textAlign = 'center';
    wrapper.style.zIndex = '-1';

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "cubeCanvas");
    svg.setAttribute("viewBox", "0 0 900 500");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.width = "100%";
    svg.style.height = "auto";

    wrapper.appendChild(svg);
    document.body.appendChild(wrapper);

    const overlay = document.createElement('div');
    overlay.setAttribute("id", "overlay");
    document.body.appendChild(overlay);

    // --- Your cube code continues here ---
    class Point2 { constructor(x,y){ this.x=typeof x==='number'?x:0; this.y=typeof y==='number'?y:0; } }
    class Point3 extends Point2 { constructor(x,y,z){ super(x,y); this.z=typeof z==='number'?z:0; } }

    class Cube {
        constructor(center, size) {
            const d = size/2;
            this.vertices = [
                new Point3(center.x-d, center.y-d, center.z+d),
                new Point3(center.x-d, center.y-d, center.z-d),
                new Point3(center.x+d, center.y-d, center.z-d),
                new Point3(center.x+d, center.y-d, center.z+d),
                new Point3(center.x+d, center.y+d, center.z+d),
                new Point3(center.x+d, center.y+d, center.z-d),
                new Point3(center.x-d, center.y+d, center.z-d),
                new Point3(center.x-d, center.y+d, center.z+d)
            ];
            this.faces = [
                [this.vertices[0],this.vertices[1],this.vertices[2],this.vertices[3]],
                [this.vertices[3],this.vertices[2],this.vertices[5],this.vertices[4]],
                [this.vertices[4],this.vertices[5],this.vertices[6],this.vertices[7]],
                [this.vertices[7],this.vertices[6],this.vertices[1],this.vertices[0]],
                [this.vertices[7],this.vertices[0],this.vertices[3],this.vertices[4]],
                [this.vertices[1],this.vertices[6],this.vertices[5],this.vertices[2]]
            ];
        }

        render(container, dx, dy) {
    container.innerHTML = "";

    // Draw faces
    for (let i = 0; i < this.faces.length; i++) {
        let face = this.faces[i];
        let point = Project(face[0]);
        let str = `<path d="M${point.x + dx} ${-point.y + dy}`;
        for (let o = 1; o < face.length; o++) {
            point = Project(face[o]);
            str += ` L ${point.x + dx} ${-point.y + dy}`;
        }
        str += ` Z" fill="none" stroke="blue" stroke-dasharray="5,5">`;
        container.innerHTML += str;
    }

    // Labels for 8 vertices
    const labels = ["Create", "Limitless", "World", "Evolve", "Mankind", "Choice", "Heaven", "Hell"];
    for (let i = 0; i < this.vertices.length; i++) {
        let v = Project(this.vertices[i]);
        let x = v.x + dx;
        let y = -v.y + dy;
        container.innerHTML += `
            <text x="${x}" y="${y}" font-size="14" fill="red"
                  text-anchor="middle" dominant-baseline="middle">
                ${labels[i]}
            </text>`;
    }
}

    }

    const Project = (v)=>new Point2(v.x,v.z);
    const Rotate = (v,c,theta,phi)=>{
        let ct=Math.cos(theta),st=Math.sin(theta),cp=Math.cos(phi),sp=Math.sin(phi);
        let x=v.x-c.x,y=v.y-c.y,z=v.z-c.z;
        v.x=ct*x-st*cp*y+st*sp*z+c.x;
        v.y=st*x+ct*cp*y-ct*sp*z+c.y;
        v.z=sp*y+cp*z+c.z;
    };

    const container=document.getElementById('cubeCanvas');
    const vb=container.viewBox.baseVal;
    const width=vb.width,height=vb.height;
    const dx=width/2,dy=height/2;
    const center=new Point3(0,dy,0);
    const cube=new Cube(center,dy);

    const mouse={down:false,x:0,y:0};

    const Tick=()=>{
        for(let i=0;i<8;i++){ Rotate(cube.vertices[i],center,Math.PI/270,Math.PI/450); }
        cube.render(container,dx,dy);
        !mouse.down?requestAnimationFrame(Tick):null;
    };

    cube.render(container,dx,dy);

    container.addEventListener('mousedown',(e)=>{mouse.down=true;mouse.x=e.clientX;mouse.y=e.clientY;});
    container.addEventListener('mousemove',(e)=>{
        if(mouse.down){
            let theta=(e.clientX-mouse.x)*Math.PI/360;
            let phi=(e.clientY-mouse.y)*Math.PI/180;
            for(let i=0;i<8;i++){ Rotate(cube.vertices[i],center,theta,phi); }
            mouse.x=e.clientX;mouse.y=e.clientY;
            cube.render(container,dx,dy);
        }
    });
    container.addEventListener('mouseup',(e)=>{setTimeout(()=>{mouse.down=false;requestAnimationFrame(Tick);},200);});

    requestAnimationFrame(Tick);

}());
