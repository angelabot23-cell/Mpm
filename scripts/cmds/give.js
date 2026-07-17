"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  GIVE SOVEREIGN v3.5 — Édition Néon Bleu & Noir
//  Canvas   : 1200 × 540 px — Design épuré, futuriste et contrasté
//  Symboles : ◈ ◉ ◆ ◇ ▣ ▲ ◎ ◑
// ═══════════════════════════════════════════════════════════════════════════════

const fs    = require("fs-extra");
const path  = require("path");
const axios = require("axios");
const moment = require("moment-timezone");

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
  const cv = require("canvas");
  loadImage    = cv.loadImage;
  createCanvas = cv.createCanvas;
  registerFont = cv.registerFont;
  canvasAvailable = true;
} catch (e) { console.error("Canvas indisponible :", e.message); }

let fonts;
try { fonts = require("../../func/font.js"); } catch (_) {}

if (canvasAvailable && registerFont) {
  const fd = path.join(__dirname, "assets", "font");
  [
    ["BeVietnamPro-Bold.ttf",    "BF", "bold"],
    ["BeVietnamPro-Regular.ttf", "BF", "normal"],
    ["BeVietnamPro-SemiBold.ttf","BF", "600"],
    ["NotoSans-Bold.ttf",        "BF", "bold"],
    ["NotoSans-Regular.ttf",     "BF", "normal"],
  ].forEach(([f, fam, w]) => {
    try {
      const fp = path.join(fd, f);
      if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w });
    } catch (_) {}
  });
}

const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

function fmt(n) {
  if (n == null || isNaN(n)) return "$0";
  n = Number(n);
  if (!isFinite(n)) return "$∞";
  const S = [{v:1e18,s:"Qi"},{v:1e15,s:"Qa"},{v:1e12,s:"T"},{v:1e9,s:"B"},{v:1e6,s:"M"},{v:1e3,s:"K"}];
  const sc = S.find(s => Math.abs(n) >= s.v);
  if (sc) return `${n<0?"-":""}$${(Math.abs(n)/sc.v).toFixed(2).replace(/\.00$/,"")}${sc.s}`;
  const p = Math.abs(n).toFixed(2).split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n<0?"-":""}$${p.join(".")}`;
}

const SUFFIXES = { k:1e3, m:1e6, b:1e9, t:1e12, q:1e15, Q:1e18 };
function parseAmount(input) {
  if (!input || typeof input !== "string") return NaN;
  const m = input.trim().toLowerCase().match(/^([\d,.]+)\s*([kmbtq]?)$/i);
  if (!m) return NaN;
  let v = parseFloat(m[1].replace(/,/g, "."));
  if (m[2] && SUFFIXES[m[2]]) v *= SUFFIXES[m[2]];
  return isNaN(v) ? NaN : Math.floor(v);
}

const TIERS = [
  { name:"Starter", min:0,       max:999,      color:"#85A9FF", sym:"◈" },
  { name:"Rookie",  min:1_000,   max:4_999,    color:"#A0C0F0", sym:"◇" },
  { name:"Pro",     min:5_000,   max:19_999,   color:"#3399FF", sym:"◆" },
  { name:"Elite",   min:20_000,  max:49_999,   color:"#00DFFF", sym:"◉" },
  { name:"Master",  min:50_000,  max:99_999,   color:"#00FFCC", sym:"▣" },
  { name:"Legend",  min:100_000, max:499_999,  color:"#1A8CFF", sym:"▲" },
  { name:"GOD",     min:500_000, max:Infinity,  color:"#0055FF", sym:"◎" },
];
function getTier(b) { return TIERS.find(t => (b||0)>=t.min && (b||0)<=t.max) || TIERS[0]; }

// ═══════════════════════════════════════════════════════════════════════════════
//  THÈMES CYBER-NEON BLEU & NOIR
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  cyber_neon: {
    name:"Cyber Neon", sym:"◈",
    bg(ctx,W,H){
      // Fond d'un noir absolu et abyssal
      ctx.fillStyle="#020205"; ctx.fillRect(0,0,W,H);
      
      // Structure de lignes matricielles discrètes (Bleu néon très atténué)
      ctx.strokeStyle="rgba(0,150,255,0.03)"; ctx.lineWidth=1;
      for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      
      // Halos radiaux d'énergie cyber (Glow bleu électrique)
      [[W*.5,H*.5,"#0055FF",450],[W*.1,H*.2,"#00FFCC",300],[W*.9,H*.8,"#0022AA",400]].forEach(([gx,gy,gc,gr])=>{
        const g=ctx.createRadialGradient(gx,gy,0,gx,gy,gr);
        g.addColorStop(0,gc+"1C");g.addColorStop(1,"transparent");
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      });
      
      // Particules de lumière (Étoiles de données)
      for(let i=0;i<40;i++){ctx.beginPath();ctx.arc(Math.random()*W,Math.random()*H,Math.random()*1.5,0,Math.PI*2);ctx.fillStyle=`rgba(0,223,255,${Math.random()*.4})`;ctx.fill();}
    },
    primary:"#0077FF",accent:"#00FFCC",gold:"#FFFFFF",
    text:"#E5F0FF",muted:"rgba(229,240,255,0.45)",
    card:"rgba(4,6,14,0.95)",border:"#0044CC",glow:"#0066FF",
    arrowColor:"#00FFCC",
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES CANVAS
// ═══════════════════════════════════════════════════════════════════════════════
function rr(ctx, x, y, w, h, r) {
  if (typeof r === "number") r = [r,r,r,r];
  const [tl,tr,br,bl] = r;
  ctx.beginPath();
  ctx.moveTo(x+tl,y); ctx.lineTo(x+w-tr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+tr);
  ctx.lineTo(x+w,y+h-br); ctx.quadraticCurveTo(x+w,y+h,x+w-br,y+h);
  ctx.lineTo(x+bl,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-bl);
  ctx.lineTo(x,y+tl); ctx.quadraticCurveTo(x,y,x+tl,y); ctx.closePath();
}

function T(ctx, s, x, y, sz, color, {align="left",weight="bold",glow=null,alpha=1}={}) {
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.font=`${weight} ${sz}px BF, Arial`;
  ctx.textAlign=align; ctx.textBaseline="middle";
  if(glow){ctx.shadowColor=glow;ctx.shadowBlur=18;}
  ctx.fillStyle=color; ctx.fillText(s,x,y); ctx.restore();
}

function GL(ctx, x1,y1,x2,y2, color, w=1.5) {
  const g=ctx.createLinearGradient(x1,y1,x2,y2);
  g.addColorStop(0,"transparent");g.addColorStop(.5,color);g.addColorStop(1,"transparent");
  ctx.save();ctx.strokeStyle=g;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
}

function MBORDER(ctx, W, H, t) {
  const P=18;
  ctx.save();ctx.shadowColor=t.glow;ctx.shadowBlur=28;ctx.strokeStyle=t.border;ctx.lineWidth=2.2;rr(ctx,P,P,W-P*2,H-P*2,26);ctx.stroke();ctx.restore();
  ctx.save();ctx.strokeStyle=t.accent+"25";ctx.lineWidth=1;rr(ctx,P+5,P+5,W-P*2-10,H-P*2-10,22);ctx.stroke();ctx.restore();
  const L=38;
  [[P,P,1,1],[W-P,P,-1,1],[P,H-P,1,-1],[W-P,H-P,-1,-1]].forEach(([cx,cy,dx,dy])=>{
    ctx.save();ctx.strokeStyle=t.accent;ctx.lineWidth=2.8;ctx.shadowColor=t.accent;ctx.shadowBlur=10;
    ctx.beginPath();ctx.moveTo(cx,cy+dy*L);ctx.lineTo(cx,cy);ctx.lineTo(cx+dx*L,cy);ctx.stroke();ctx.restore();
  });
}

async function AVATAR(ctx, imgBuf, cx, cy, R, t) {
  for(let i=0;i<3;i++){
    const ri=R+10+i*9,op=[0.5,0.24,0.1][i];
    ctx.save();ctx.strokeStyle=t.primary+Math.round(op*255).toString(16).padStart(2,"0");
    ctx.lineWidth=[2.2,1.4,0.8][i];ctx.shadowColor=t.glow;ctx.shadowBlur=[18,9,4][i];
    ctx.beginPath();ctx.arc(cx,cy,ri,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
  ctx.drawImage(imgBuf,cx-R,cy-R,R*2,R*2);ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);
  ctx.strokeStyle=t.primary;ctx.lineWidth=2.5;ctx.shadowColor=t.glow;ctx.shadowBlur=18;ctx.stroke();ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
  const sh=ctx.createLinearGradient(cx-R,cy-R,cx+R,cy+R*.3);
  sh.addColorStop(0,"rgba(255,255,255,0.1)");sh.addColorStop(.5,"transparent");
  ctx.fillStyle=sh;ctx.fill();ctx.restore();
}

async function loadAvatar(uid, name) {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${uid}/picture?width=300&height=300&access_token=${FB_TOKEN}`,
      { responseType:"arraybuffer", timeout:8000 }
    );
    return await loadImage(Buffer.from(res.data));
  } catch (_) {
    const cv  = createCanvas(300,300);
    const ctx = cv.getContext("2d");
    const colors = ["#0055FF","#00C8FF","#00FFCC","#1A8CFF"];
    ctx.fillStyle = colors[parseInt(uid||"0") % colors.length];
    ctx.fillRect(0,0,300,300);
    ctx.fillStyle="#FFF"; ctx.font="bold 120px BF, Arial";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText((name||"?").charAt(0).toUpperCase(),150,150);
    return await loadImage(cv.toBuffer());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CANVAS PRINCIPAL — 1200 × 540
// ═══════════════════════════════════════════════════════════════════════════════
const CW = 1200, CH = 540;
const PAD     = 30;
const AV_Y    = 196;   
const AV_R    = 90;    
const LEFT_X  = 280;   
const RIGHT_X = 920;   
const MID_X   = CW / 2; 

async function buildCanvas(sData, rData, amount, theme) {
  const canvas = createCanvas(CW, CH);
  const ctx    = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";

  theme.bg(ctx, CW, CH);

  ctx.save();ctx.shadowColor="rgba(0,0,0,0.9)";ctx.shadowBlur=52;ctx.shadowOffsetY=5;
  ctx.fillStyle=theme.card;rr(ctx,18,18,CW-36,CH-36,26);ctx.fill();ctx.restore();

  MBORDER(ctx, CW, CH, theme);

  const HDR_Y = PAD + 46;
  ctx.save();
  const hg=ctx.createLinearGradient(PAD,HDR_Y-20,CW-PAD,HDR_Y+20);
  hg.addColorStop(0,theme.primary);hg.addColorStop(0.5,theme.accent);hg.addColorStop(1,theme.primary);
  ctx.font="bold 38px BF, Arial";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.shadowColor=theme.glow;ctx.shadowBlur=22;ctx.fillStyle=hg;
  ctx.fillText("◈  TRANSFERT REUSSI  ◈",MID_X,HDR_Y);ctx.restore();

  GL(ctx, PAD+20, HDR_Y+32, CW-PAD-20, HDR_Y+32, theme.border, 1.2);

  const sImg = await loadAvatar(sData.uid, sData.name);
  await AVATAR(ctx, sImg, LEFT_X, AV_Y, AV_R, theme);

  const rImg = await loadAvatar(rData.uid, rData.name);
  await AVATAR(ctx, rImg, RIGHT_X, AV_Y, AV_R, theme);

  const sDisplayName = sData.name.length > 16 ? sData.name.slice(0,14)+"…" : sData.name;
  const rDisplayName = rData.name.length > 16 ? rData.name.slice(0,14)+"…" : rData.name;
  T(ctx, sDisplayName, LEFT_X,  AV_Y+AV_R+24, 22, theme.text,   {align:"center"});
  T(ctx, rDisplayName, RIGHT_X, AV_Y+AV_R+24, 22, theme.text,   {align:"center"});

  const sTier = getTier(sData.newBalance);
  const rTier = getTier(rData.newBalance);
  T(ctx,`${sTier.sym} ${sTier.name}`, LEFT_X,  AV_Y+AV_R+50, 15, sTier.color, {align:"center",glow:sTier.color});
  T(ctx,`${rTier.sym} ${rTier.name}`, RIGHT_X, AV_Y+AV_R+50, 15, rTier.color, {align:"center",glow:rTier.color});

  T(ctx,"◈  ENVOYEUR",  LEFT_X,  AV_Y-AV_R-22, 14, theme.muted, {align:"center",weight:"600"});
  T(ctx,"◈  RECEVEUR",  RIGHT_X, AV_Y-AV_R-22, 14, theme.muted, {align:"center",weight:"600"});

  const ARR_Y  = AV_Y;
  const ARR_X1 = LEFT_X  + AV_R + 32;
  const ARR_X2 = RIGHT_X - AV_R - 32;
  
  ctx.save();
  ctx.strokeStyle = theme.arrowColor + "AA"; ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 7]);
  ctx.shadowColor = theme.glow; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(ARR_X1, ARR_Y); ctx.lineTo(ARR_X2 - 16, ARR_Y); ctx.stroke();
  ctx.restore();
  
  ctx.save();
  ctx.fillStyle = theme.arrowColor; ctx.shadowColor = theme.glow; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(ARR_X2,      ARR_Y);
  ctx.lineTo(ARR_X2 - 24, ARR_Y - 14);
  ctx.lineTo(ARR_X2 - 24, ARR_Y + 14);
  ctx.closePath(); ctx.fill(); ctx.restore();

  const amtStr = fmt(amount);
  ctx.font = "bold 40px BF, Arial";
  const amtW = ctx.measureText(amtStr).width + 50;
  const amtH = 58;
  const amtX = MID_X - amtW / 2;
  const amtBoxY = ARR_Y - amtH / 2 - 2;
  
  ctx.save();
  ctx.shadowColor=theme.glow; ctx.shadowBlur=22;
  ctx.fillStyle=theme.primary+"25"; rr(ctx,amtX,amtBoxY,amtW,amtH,amtH/2); ctx.fill();
  ctx.strokeStyle=theme.primary+"88"; ctx.lineWidth=1.8;
  rr(ctx,amtX,amtBoxY,amtW,amtH,amtH/2); ctx.stroke(); ctx.restore();
  
  ctx.save();
  const mg=ctx.createLinearGradient(amtX,0,amtX+amtW,0);
  mg.addColorStop(0,theme.primary); mg.addColorStop(0.5,theme.accent); mg.addColorStop(1,theme.primary);
  ctx.font="bold 40px BF, Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.shadowColor=theme.glow; ctx.shadowBlur=24;
  ctx.fillStyle=mg; ctx.fillText(amtStr, MID_X, ARR_Y); ctx.restore();

  const STAT_Y = CH - PAD - 28;
  GL(ctx, PAD+20, STAT_Y-20, CW-PAD-20, STAT_Y-20, theme.border, 1);

  ctx.save();
  ctx.fillStyle=theme.card; rr(ctx, PAD+20, STAT_Y-14, 380, 36, 10); ctx.fill();
  ctx.strokeStyle=theme.border+"50"; ctx.lineWidth=1; rr(ctx,PAD+20,STAT_Y-14,380,36,10); ctx.stroke();
  ctx.restore();
  T(ctx,"◈",          PAD+36,   STAT_Y+4, 14, theme.accent);
  T(ctx,sData.name.length>14?sData.name.slice(0,12)+"…":sData.name, PAD+56, STAT_Y+4, 14, theme.muted, {weight:"600"});
  T(ctx,fmt(sData.newBalance), PAD+390, STAT_Y+4, 16, theme.primary, {align:"right",glow:theme.glow});

  const RB_X = CW - PAD - 20 - 380;
  ctx.save();
  ctx.fillStyle=theme.card; rr(ctx,RB_X,STAT_Y-14,380,36,10); ctx.fill();
  ctx.strokeStyle=theme.border+"50"; ctx.lineWidth=1; rr(ctx,RB_X,STAT_Y-14,380,36,10); ctx.stroke();
  ctx.restore();
  T(ctx,"◈",      RB_X+16,      STAT_Y+4, 14, theme.accent);
  T(ctx,rData.name.length>14?rData.name.slice(0,12)+"…":rData.name, RB_X+36, STAT_Y+4, 14, theme.muted, {weight:"600"});
  T(ctx,fmt(rData.newBalance), RB_X+374, STAT_Y+4, 16, theme.primary, {align:"right",glow:theme.glow});

  const now = moment().tz("Europe/Paris").format("DD/MM/YYYY  HH:mm");
  T(ctx,`${theme.sym}  ${now}  ·  Maison Void  ${theme.sym}`, MID_X, CH-PAD+2, 13, theme.muted, {align:"center",weight:"600"});

  return canvas;
}

module.exports = {
  config: {
    name:        "give",
    aliases:     ["gift","donate","don"],
    version:     "3.5",
    author:      "Christus",
    countDown:   5,
    role:        0,
    description: { fr: "◈ Transfert sécurisé — Édition Cyber Néon Bleu & Noir." },
    category:    "economy",
    guide: {
      fr: [
        "◈  GIVE CYBER NEON",
        "",
        "  give @user <montant>  — Transférer des fonds",
        "  give @user 1k",
        "  give @user 2.5m",
      ].join("\n"),
    },
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { senderID, mentions, messageReply } = event;

    let targetID = Object.keys(mentions)[0] || messageReply?.senderID;
    const amountArg = args.find(a => /^[\d,.]+[kmbtqQ]?$/i.test(a));
    const amount    = parseAmount(amountArg);

    if (!targetID) {
      return message.reply(`◆ Veuillez mentionner un utilisateur et indiquer un montant valide.`);
    }
    if (isNaN(amount) || amount <= 0) {
      return message.reply(`◆ Montant invalide numérique requis (ex: 500, 1k, 2.5m).`);
    }
    if (targetID === senderID) {
      return message.reply("◆ Impossible de s'envoyer des fonds à soi-même.");
    }

    const [senderData, receiverData] = await Promise.all([
      usersData.get(senderID),
      usersData.get(targetID),
    ]);
    if (!receiverData) return message.reply("◆ Cible introuvable.");

    const sMoney = senderData.money || 0;
    if (sMoney < amount) {
      return message.reply(`◆ Fonds insuffisants. Votre solde actuel : ${fmt(sMoney)}`);
    }

    const newSMoney = sMoney - amount;
    const newRMoney = (receiverData.money || 0) + amount;
    await Promise.all([
      usersData.set(senderID, { money: newSMoney }),
      usersData.set(targetID, { money: newRMoney }),
    ]);

    let senderName = senderData.name || `User_${senderID}`;
    let receiverName = receiverData.name || `User_${targetID}`;
    try {
      const fbInfo = await api.getUserInfo([senderID, targetID]);
      senderName   = fbInfo[senderID]?.name   || senderName;
      receiverName = fbInfo[targetID]?.name    || receiverName;
    } catch (_) {}

    if (!canvasAvailable) {
      return message.reply(`◈ Transfert réussi de ${fmt(amount)} vers ${receiverName}.`);
    }

    const theme = THEMES.cyber_neon;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
    const outPath = path.join(cacheDir, `give_${senderID}_${Date.now()}.png`);

    const cvs = await buildCanvas(
      { uid: senderID,   name: senderName,   newBalance: newSMoney },
      { uid: targetID,   name: receiverName, newBalance: newRMoney },
      amount,
      theme
    );
    fs.writeFileSync(outPath, cvs.toBuffer("image/png"));

    const sTier = getTier(newSMoney);
    const rTier = getTier(newRMoney);
    const body  = [
      `🖤 [ 𝗠𝗔𝗜𝗦𝗢𝗡 𝗩𝗢𝗜𝗗 ] 🖤`,
      `──────────────────────`,
      `◆ Source : ${senderName}`,
      `◉ Cible  : ${receiverName}`,
      `▣ Flux   : ${fmt(amount)}`,
      `──────────────────────`,
      `◈ Solde ${senderName.slice(0,10)} : ${fmt(newSMoney)}`,
      `◈ Solde ${receiverName.slice(0,10)} : ${fmt(newRMoney)}`
    ].join("\n");

    await message.reply({ body, attachment: fs.createReadStream(outPath) });
    setTimeout(() => { try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {} }, 30_000);
  },
};
