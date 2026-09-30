const path=location.pathname;
const form=document.getElementById(path.includes("register")?"registerForm":"loginForm");
form?.addEventListener("submit",async e=>{
 e.preventDefault(); const body=Object.fromEntries(new FormData(form));
 const endpoint=path.includes("register")?"/api/register":"/api/login";
 const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const d=await r.json(); const msg=document.getElementById("msg");
 msg.innerHTML=`<div class="alert ${r.ok?"alert-success":"alert-danger"}">${d.error||"Thành công!"}</div>`;
 if(r.ok)setTimeout(()=>location.href="/",500);
});