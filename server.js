require("dotenv").config();
const express=require("express"),session=require("express-session"),bcrypt=require("bcryptjs"),path=require("path"),fs=require("fs");
const app=express(),PORT=process.env.PORT||3000,dataDir=path.join(__dirname,"data"),dbFile=path.join(dataDir,"database.json");
fs.mkdirSync(dataDir,{recursive:true});
const empty={users:[],services:[],orders:[],topups:[]};
let db; try{db=fs.existsSync(dbFile)?JSON.parse(fs.readFileSync(dbFile,"utf8")):empty}catch{db=empty}
for(const k of Object.keys(empty))if(!Array.isArray(db[k]))db[k]=[];
for(const u of db.users){if(u.balance===undefined)u.balance=0;if(u.is_admin===undefined)u.is_admin=0;if(u.active===undefined)u.active=1}
for(const o of db.orders)if(o.refunded===undefined)o.refunded=false;
const save=()=>{const t=dbFile+".tmp";fs.writeFileSync(t,JSON.stringify(db,null,2));fs.renameSync(t,dbFile)};
const next=a=>a.length?Math.max(...a.map(x=>Number(x.id)||0))+1:1,now=()=>new Date().toISOString();
const byId=id=>db.users.find(u=>u.id===Number(id));
if(!db.services.length){db.services=[
{id:1,game:"Roblox - Chưa chọn game",title:"Cày level cơ bản",description:"Dịch vụ mẫu. Thay bằng game Roblox cụ thể của bạn.",price:50000,eta:"1-2 ngày",active:1},
{id:2,game:"Roblox - Chưa chọn game",title:"Cày nhiệm vụ",description:"Dịch vụ mẫu cho hệ thống. Bạn có thể đổi tên, mô tả và giá.",price:70000,eta:"1-3 ngày",active:1},
{id:3,game:"Roblox - Chưa chọn game",title:"Gói cày theo yêu cầu",description:"Khách gửi yêu cầu riêng để shop báo giá.",price:100000,eta:"Liên hệ",active:1}];save()}
(async()=>{const e=process.env.ADMIN_EMAIL,p=process.env.ADMIN_PASSWORD;if(e&&p&&!db.users.some(u=>u.email===e.trim().toLowerCase())){db.users.push({id:next(db.users),name:"Administrator",email:e.trim().toLowerCase(),password:await bcrypt.hash(p,12),balance:0,is_admin:1,created_at:now()});save()}})();
app.use(express.urlencoded({extended:true}));app.use(express.json());app.use(session({secret:process.env.SESSION_SECRET||"dev-only-change-me",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:604800000}}));app.use(express.static(path.join(__dirname,"public")));
const me=req=>{if(!req.session.userId)return null;const u=byId(req.session.userId);if(!u||u.active===0)return null;return{id:u.id,name:u.name,email:u.email,balance:Number(u.balance)||0,is_admin:Number(u.is_admin)||0,active:u.active===undefined?1:Number(u.active),created_at:u.created_at||null}};
const login=(req,res,next)=>me(req)?next():res.status(401).json({error:"Bạn cần đăng nhập."});
const admin=(req,res,next)=>{const u=me(req);u&&Number(u.is_admin)===1?next():res.status(403).json({error:"Không có quyền admin."})};
const safeUser=u=>u?{id:u.id,name:u.name,email:u.email,balance:Number(u.balance)||0,is_admin:Number(u.is_admin)||0,active:u.active===undefined?1:Number(u.active),created_at:u.created_at||null}:null;
app.get("/api/me",(req,res)=>res.json({user:me(req)}));
app.get("/api/services",(req,res)=>res.json({services:db.services.filter(s=>s.active)}));
app.post("/api/register",async(req,res)=>{const{name,email,password}=req.body;if(!name||!email||!password||password.length<6)return res.status(400).json({error:"Tên, email và mật khẩu tối thiểu 6 ký tự là bắt buộc."});const em=email.trim().toLowerCase();if(db.users.some(u=>u.email===em))return res.status(409).json({error:"Email đã tồn tại."});const u={id:next(db.users),name:name.trim(),email:em,password:await bcrypt.hash(password,12),balance:0,is_admin:0,active:1,created_at:now()};db.users.push(u);save();req.session.userId=u.id;res.json({ok:true})});
app.post("/api/login",async(req,res)=>{const em=(req.body.email||"").trim().toLowerCase(),u=db.users.find(x=>x.email===em);if(!u||!(await bcrypt.compare(req.body.password||"",u.password)))return res.status(401).json({error:"Email hoặc mật khẩu không đúng."});if(u.active===0)return res.status(403).json({error:"Tài khoản đã bị khóa."});req.session.userId=u.id;res.json({ok:true})});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.post("/api/orders",login,(req,res)=>{const{serviceId,gameAccount,note=""}=req.body,u=byId(req.session.userId),s=db.services.find(x=>x.id===Number(serviceId)&&x.active);if(!s)return res.status(404).json({error:"Dịch vụ không tồn tại."});if(!gameAccount?.trim())return res.status(400).json({error:"Vui lòng nhập thông tin tài khoản game."});if(u.balance<s.price)return res.status(400).json({error:"Số dư không đủ. Hãy nạp tiền trước."});u.balance-=s.price;const o={id:next(db.orders),user_id:u.id,service_id:s.id,game_account:gameAccount.trim(),note:note.trim(),price:s.price,status:"pending",created_at:now()};db.orders.push(o);save();res.json({ok:true,orderId:o.id})});
app.get("/api/orders",login,(req,res)=>res.json({orders:db.orders.filter(o=>o.user_id===req.session.userId).sort((a,b)=>b.id-a.id).map(o=>{const s=db.services.find(x=>x.id===o.service_id)||{};return{...o,game:s.game||"N/A",title:s.title||"N/A"}})}));
app.post("/api/topups",login,(req,res)=>{const{provider,denomination,serial,code}=req.body;if(!["Viettel","MobiFone","VinaPhone","Vietnamobile"].includes(provider)||!Number(denomination)||!serial||!code)return res.status(400).json({error:"Thông tin thẻ chưa đầy đủ."});const t={id:next(db.topups),user_id:req.session.userId,provider,denomination:Number(denomination),serial:serial.trim(),code:code.trim(),status:"pending",created_at:now()};db.topups.push(t);save();res.json({ok:true,topupId:t.id,message:"Đã ghi nhận yêu cầu. Bản demo chưa kết nối cổng thẻ thật."})});
app.get("/api/topups",login,(req,res)=>res.json({topups:db.topups.filter(t=>t.user_id===req.session.userId).sort((a,b)=>b.id-a.id).map(({code,...x})=>x)}));
// =========================
// ADMIN DASHBOARD API
// =========================

app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));

app.get("/api/admin/stats",admin,(req,res)=>{
 const orders=db.orders, topups=db.topups;
 res.json({
  users:db.users.length,activeUsers:db.users.filter(u=>u.active!==0).length,
  services:db.services.length,activeServices:db.services.filter(s=>Number(s.active)===1).length,
  orders:orders.length,pendingOrders:orders.filter(o=>o.status==="pending").length,
  processingOrders:orders.filter(o=>o.status==="processing").length,completedOrders:orders.filter(o=>o.status==="completed").length,
  cancelledOrders:orders.filter(o=>o.status==="cancelled").length,
  topups:topups.length,pendingTopups:topups.filter(t=>t.status==="pending").length,
  approvedTopups:topups.filter(t=>t.status==="approved").length,
  revenue:orders.filter(o=>o.status==="completed").reduce((a,o)=>a+Number(o.price||0),0),
  approvedTopupMoney:topups.filter(t=>t.status==="approved").reduce((a,t)=>a+Number(t.denomination||0),0)
 });
});

// SERVICES
app.get("/api/admin/services",admin,(req,res)=>res.json({services:db.services.slice().sort((a,b)=>a.id-b.id)}));
app.post("/api/admin/services",admin,(req,res)=>{
 const game=String(req.body.game||"").trim(),title=String(req.body.title||"").trim(),description=String(req.body.description||"").trim(),eta=String(req.body.eta||"").trim(),price=Number(req.body.price);
 if(!game||!title||!description||!eta||!Number.isFinite(price)||price<0)return res.status(400).json({error:"Vui lòng nhập đầy đủ thông tin dịch vụ và giá hợp lệ."});
 const service={id:next(db.services),game,title,description,price:Math.round(price),eta,active:req.body.active===false||req.body.active==="0"?0:1};db.services.push(service);save();res.json({ok:true,service});
});
app.patch("/api/admin/services/:id",admin,(req,res)=>{
 const s=db.services.find(x=>x.id===Number(req.params.id));if(!s)return res.status(404).json({error:"Không tìm thấy dịch vụ."});
 s.game=String(req.body.game??s.game).trim();s.title=String(req.body.title??s.title).trim();s.description=String(req.body.description??s.description).trim();s.eta=String(req.body.eta??s.eta).trim();s.price=Math.round(Number(req.body.price??s.price));s.active=req.body.active===false||req.body.active==="0"?0:1;
 if(!s.game||!s.title||!s.description||!s.eta||!Number.isFinite(s.price)||s.price<0)return res.status(400).json({error:"Thông tin dịch vụ không hợp lệ."});save();res.json({ok:true,service:s});
});
app.delete("/api/admin/services/:id",admin,(req,res)=>{const i=db.services.findIndex(x=>x.id===Number(req.params.id));if(i<0)return res.status(404).json({error:"Không tìm thấy dịch vụ."});db.services.splice(i,1);save();res.json({ok:true})});

// ORDERS
app.get("/api/admin/orders",admin,(req,res)=>res.json({orders:db.orders.slice().sort((a,b)=>b.id-a.id).map(o=>{const u=byId(o.user_id)||{},s=db.services.find(x=>x.id===o.service_id)||{};return{...o,name:u.name||"",email:u.email||"",game:s.game||"",title:s.title||""}})}));
app.patch("/api/admin/orders/:id",admin,(req,res)=>{
 const allowed=["pending","processing","completed","cancelled"],st=String(req.body.status||"");if(!allowed.includes(st))return res.status(400).json({error:"Trạng thái đơn không hợp lệ."});
 const o=db.orders.find(x=>x.id===Number(req.params.id));if(!o)return res.status(404).json({error:"Không tìm thấy đơn."});
 if(o.status==="cancelled"&&st!=="cancelled")return res.status(400).json({error:"Đơn đã hủy và không thể mở lại."});
 if(st==="cancelled"&&o.status!=="cancelled"&&!o.refunded){const u=byId(o.user_id);if(u){u.balance=Number(u.balance||0)+Number(o.price||0);o.refunded=true;o.refunded_at=now()}}
 o.status=st;o.updated_at=now();save();res.json({ok:true,order:o});
});

// TOPUPS
app.get("/api/admin/topups",admin,(req,res)=>res.json({topups:db.topups.slice().sort((a,b)=>b.id-a.id).map(t=>{const u=byId(t.user_id)||{};return{...t,name:u.name||"",email:u.email||""}})}));
app.patch("/api/admin/topups/:id",admin,(req,res)=>{
 const st=String(req.body.status||"");if(!["pending","approved","rejected"].includes(st))return res.status(400).json({error:"Trạng thái nạp tiền không hợp lệ."});
 const t=db.topups.find(x=>x.id===Number(req.params.id));if(!t)return res.status(404).json({error:"Không tìm thấy giao dịch."});
 if(t.status==="approved"&&st!=="approved")return res.status(400).json({error:"Giao dịch đã duyệt, không thể hoàn tác."});
 if(st==="approved"&&t.status!=="approved"){const u=byId(t.user_id);if(!u)return res.status(404).json({error:"Không tìm thấy người dùng."});u.balance=Number(u.balance||0)+Number(t.denomination||0);t.approved_at=now();t.approved_by=req.session.userId}
 t.status=st;t.updated_at=now();save();res.json({ok:true,topup:t});
});

// USERS
app.get("/api/admin/users",admin,(req,res)=>res.json({users:db.users.slice().sort((a,b)=>b.id-a.id).map(u=>({...safeUser(u),order_count:db.orders.filter(o=>o.user_id===u.id).length,topup_count:db.topups.filter(t=>t.user_id===u.id).length}))}));
app.patch("/api/admin/users/:id",admin,async(req,res)=>{
 const u=byId(req.params.id),meu=byId(req.session.userId);if(!u)return res.status(404).json({error:"Không tìm thấy người dùng."});
 if(u.id===meu.id&&req.body.active===false)return res.status(400).json({error:"Không thể tự khóa admin đang đăng nhập."});
 if(u.id===meu.id&&req.body.is_admin===false)return res.status(400).json({error:"Không thể tự hạ quyền admin đang đăng nhập."});
 if(req.body.name!==undefined){u.name=String(req.body.name).trim();if(!u.name)return res.status(400).json({error:"Tên không được để trống."})}
 if(req.body.balance!==undefined){const b=Number(req.body.balance);if(!Number.isFinite(b)||b<0)return res.status(400).json({error:"Số dư không hợp lệ."});u.balance=Math.round(b)}
 if(req.body.active!==undefined)u.active=req.body.active===false||req.body.active==="0"?0:1;
 if(req.body.is_admin!==undefined)u.is_admin=req.body.is_admin===false||req.body.is_admin==="0"?0:1;
 if(req.body.password){const pw=String(req.body.password);if(pw.length<6)return res.status(400).json({error:"Mật khẩu mới phải có ít nhất 6 ký tự."});u.password=await bcrypt.hash(pw,12)}
 save();res.json({ok:true,user:safeUser(u)});
});

app.use((req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));app.listen(PORT,"0.0.0.0",()=>console.log(`Shop running on 0.0.0.0:${PORT}`));