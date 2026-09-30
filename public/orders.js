async function load(){
 const r=await fetch("/api/orders"); if(r.status===401){location.href="/login.html";return}
 const d=await r.json(); const box=document.getElementById("orders");
 if(!d.orders.length){box.innerHTML='<p class="text-secondary">Bạn chưa có đơn hàng.</p>';return}
 box.innerHTML=`<div class="table-responsive"><table class="table table-dark table-hover align-middle"><thead><tr><th>#</th><th>Dịch vụ</th><th>Tài khoản</th><th>Giá</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>${d.orders.map(o=>`<tr><td>${o.id}</td><td>${esc(o.game)} - ${esc(o.title)}</td><td>${esc(o.game_account)}</td><td>${money(o.price)}</td><td><span class="status">${esc(o.status)}</span></td><td>${esc(o.created_at)}</td></tr>`).join("")}</tbody></table></div>`;
}
function money(n){return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(n)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
load();