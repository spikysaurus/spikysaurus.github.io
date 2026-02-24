let profiles=[],allMedia=[],currentPage=0,pageSize=18,sortLatestFirst=true;
const gallery=document.getElementById("gallery"),
prevBtn=document.getElementById("prevBtn"),
nextBtn=document.getElementById("nextBtn"),
modal=document.getElementById("modal"),
modalContent=document.getElementById("modalContent"),
closeBtn=document.querySelector(".close-btn"),
fileInput=document.getElementById("fileInput"),
sortToggleBtn=document.getElementById("sortToggleBtn"),
pageSizeInput=document.getElementById("pageSizeInput"),
applyPageSizeBtn=document.getElementById("applyPageSizeBtn");

async function loadProfilesFromFile(file){
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      profiles=JSON.parse(e.target.result).profiles||[];
      localStorage.setItem("lastProfiles",JSON.stringify(profiles));
      allMedia=[];currentPage=0;
      const newSize=parseInt(pageSizeInput.value,10);
      if(!isNaN(newSize)&&newSize>0){pageSize=newSize;localStorage.setItem("pageSize",pageSize);}
      for(const h of profiles)await fetchProfileMedia(h);
      renderPage();
    }catch(err){console.error("Invalid JSON",err);}
  };
  reader.readAsText(file);
}

async function fetchProfileMedia(handle){
  try{
    const resp=await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=50`);
    const data=await resp.json();
    data.feed.forEach(p=>{
      if(p.reason?.$type==="app.bsky.feed.defs#reasonRepost"||p.reply)return;
      const e=p.post.embed,uri=p.post.uri,url=`https://bsky.app/profile/${handle}/post/${uri.split("/").pop()}`,date=new Date(p.post.indexedAt);
      if(!e)return;
      if(e.$type==="app.bsky.embed.images#view")e.images.forEach(img=>allMedia.push({type:"image",src:img.fullsize,alt:handle,postUrl:url,date}));
      if(e.$type==="app.bsky.embed.video#view")allMedia.push({type:"video",src:e.video.url,alt:handle,postUrl:url,date});
      if(e.$type==="app.bsky.embed.recordWithMedia#view"){
        if(e.media?.$type==="app.bsky.embed.images#view")e.media.images.forEach(img=>allMedia.push({type:"image",src:img.fullsize,alt:handle,postUrl:url,date}));
        if(e.media?.$type==="app.bsky.embed.video#view")allMedia.push({type:"video",src:e.media.video.url,alt:handle,postUrl:url,date});
      }
    });
  }catch(err){console.error("Error fetching",handle,err);}
}

function renderPage(){
  allMedia.sort((a,b)=>sortLatestFirst?b.date-a.date:a.date-b.date);
  gallery.innerHTML="";
  const start=currentPage*pageSize,end=start+pageSize;
  allMedia.slice(start,end).forEach(item=>{
    const wrap=document.createElement("div");wrap.className="gallery-item";
    const el=item.type==="image"?Object.assign(document.createElement("img"),{src:item.src,alt:item.alt}):Object.assign(document.createElement("video"),{src:item.src,controls:true,preload:"metadata",style:"max-height:200px"});
    wrap.appendChild(el);wrap.addEventListener("click",()=>openModal(item));gallery.appendChild(wrap);
  });
  prevBtn.disabled=currentPage===0;nextBtn.disabled=end>=allMedia.length;
}

function openModal(item){
  modalContent.innerHTML="";
  const el=item.type==="image"?Object.assign(document.createElement("img"),{src:item.src,alt:item.alt}):Object.assign(document.createElement("video"),{src:item.src,controls:true,autoplay:true,muted:true});
  modalContent.appendChild(el);
  const btns=document.createElement("div");btns.className="modal-buttons";
  btns.appendChild(Object.assign(document.createElement("a"),{href:item.postUrl,target:"_blank",textContent:"View Post"}));
  btns.appendChild(Object.assign(document.createElement("a"),{href:item.src,download:"",textContent:"Download Media",className:"download"}));
  modalContent.appendChild(btns);modal.style.display="flex";
}

closeBtn.onclick=()=>{modal.style.display="none";modalContent.innerHTML="";};
window.onclick=e=>{if(e.target===modal){modal.style.display="none";modalContent.innerHTML="";}};
prevBtn.onclick=()=>{if(currentPage>0){currentPage--;renderPage();}};
nextBtn.onclick=()=>{if((currentPage+1)*pageSize<allMedia.length){currentPage++;renderPage();}};
fileInput.onchange=async e=>{if(e.target.files[0])await loadProfilesFromFile(e.target.files[0]);};

document.getElementById("saveBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({profiles:["spikysaurus.bsky.social","sadewoo.bsky.social"]},null,2)],{type:"application/json"});
  const link=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"profiles.json"});document.body.appendChild(link);link.click();document.body.removeChild(link);
};

sortToggleBtn.onclick=()=>{sortLatestFirst=!sortLatestFirst;sortToggleBtn.textContent=sortLatestFirst?"Sort: Latest":"Sort: Oldest";currentPage=0;renderPage();};
applyPageSizeBtn.onclick=()=>{
  const n=parseInt(pageSizeInput.value,10);
  if(!isNaN(n)&&n>0){pageSize=n;localStorage.setItem("pageSize",pageSize);currentPage=0;renderPage();}
  else alert("Enter valid positive number");
};

window.addEventListener("DOMContentLoaded",async()=>{
  const savedSize=localStorage.getItem("pageSize");if(savedSize){pageSize=parseInt(savedSize,10);pageSizeInput.value=pageSize;}
  const savedProfiles=localStorage.getItem("lastProfiles");
  if(savedProfiles){profiles=JSON.parse(savedProfiles);allMedia=[];currentPage=0;for(const h of profiles)await fetchProfileMedia(h);renderPage();}
});

document.getElementById("clearStorageBtn").onclick=()=>{
  if(confirm("Clear all saved profiles?")){localStorage.removeItem("lastProfiles");localStorage.removeItem("pageSize");allMedia=[];profiles=[];currentPage=0;gallery.innerHTML="";}
};

