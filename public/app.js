async function loadServices(){
 const box=document.getElementById("service-list");
 const r=await fetch("/api/services"); const d=await r.json();
 box.innerHTML=d.services.map(s=>`<div class="col-md-6 col-lg-4"><div class="service-card">
 <div class="section-tag small">${escapeHtml(s.game)}</div><h4>${escapeHtml(s.title)}</h4><p class="text-secondary">${escapeHtml(s.description)}</p>
 <div class="d-flex justify-content-between align-items-center mt-4"><div><div class="price">${money(s.price)}</div><small class="text-secondary">${escapeHtml(s.eta)}</small></div>
 <button class="btn btn-primary" onclick="buy(${s.id})">Mua ngay</button></div></div></div>`).join("");
}
async function buy(id){
 const me=await fetch("/api/me").then(r=>r.json());
 if(!me.user){location.href="/login.html";return}
 const gameAccount=prompt("Nhập username/ID Roblox để shop thực hiện đơn:");
 if(!gameAccount)return;
 const note=prompt("Ghi chú cho đơn (có thể bỏ trống):")||"";
 const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({serviceId:id,gameAccount,note})});
 const d=await r.json(); alert(d.error||`Đặt đơn thành công #${d.orderId}`); if(r.ok) location.href="/orders.html";
}
function money(n){return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(n)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
loadServices();