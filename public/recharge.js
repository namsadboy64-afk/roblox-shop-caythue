document.getElementById("topupForm").addEventListener("submit",async e=>{
 e.preventDefault(); const body=Object.fromEntries(new FormData(e.target));
 const r=await fetch("/api/topups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const d=await r.json(); document.getElementById("msg").innerHTML=`<div class="alert ${r.ok?"alert-success":"alert-danger"}">${d.error||d.message}</div>`;
 if(r.ok)e.target.reset();
});