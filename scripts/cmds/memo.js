const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gifencoder');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

if (!global.memoryStats) global.memoryStats = new Map();
if (!global.memoryXP) global.memoryXP = new Map();

const EMOJIS = ['🍎','🍌','🍇','🍓','🍒','🥑','🍕','🍔','🍟','🍩','⚽','🎮','💎','🔥'];
const frame = "≪ °❈° ≫≪ °❈° ≫≪ °❈° ≫≪ °❈° ≫";

function drawCyberBg(ctx, w, h) {
  let g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#060814');
  g.addColorStop(1, '#11152d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

async function fetchAvatar(id, name) {
  const cleanName = name ? name.substring(0, 2).toUpperCase() : "??";
  try {
    const res = await axios.get(`https://images.weserv.nl/?url=https://graph.facebook.com/${id}/picture?type=large`, {
      responseType: 'arraybuffer',
      timeout: 4000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return await loadImage(Buffer.from(res.data));
  } catch {
    const c = createCanvas(100, 100);
    const ctx = c.getContext('2d');
    let g = ctx.createLinearGradient(0, 0, 100, 100);
    g.addColorStop(0, '#00bfff');
    g.addColorStop(1, '#ff0055');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(50, 50, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 35px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(cleanName, 50, 50);
    return c;
  }
}

// Générateur de GIF animé (Interface clignotante Néon)
async function genUIGIF(id, name, title, sub, color) {
  const w = 700;
  const h = 220;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const encoder = new GIFEncoder(w, h);
  const cacheDir = path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  
  const file = path.join(cacheDir, `mem_${Date.now()}_${id}.gif`);
  const writeStream = fs.createWriteStream(file);

  encoder.createReadStream().pipe(writeStream);
  encoder.start();
  encoder.setRepeat(0); // Boucle infinie
  encoder.setDelay(400); // Vitesse du clignotement
  encoder.setQuality(10);

  const avatar = await fetchAvatar(id, name);
  const neonColors = [color, '#ffffff']; // Alternance pour l'effet néon animé

  for (let f = 0; f < 2; f++) {
    drawCyberBg(ctx, w, h);

    // Bordure animée
    ctx.strokeStyle = neonColors[f];
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Avatar circulaire
    ctx.save();
    ctx.beginPath(); ctx.arc(80, h / 2, 45, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(avatar, 35, h / 2 - 45, 90, 90);
    ctx.restore();

    ctx.strokeStyle = neonColors[f];
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(80, h / 2, 47, 0, Math.PI * 2); ctx.stroke();

    // Textes
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px Arial";
    ctx.fillText(name, 150, 60);

    ctx.fillStyle = color;
    ctx.font = "bold 28px Arial";
    ctx.fillText(title, 150, 110);

    ctx.fillStyle = "#ccc";
    ctx.font = "16px Arial";
    ctx.fillText(sub, 150, 155);

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return new Promise((resolve) => {
    writeStream.on('finish', () => resolve(file));
  });
}

module.exports = {
  config: {
    name: "memo",
    version: "11.0",
    author: "Célestin",
    role: 0,
    description: "Memory ULTIME en format GIF animé",
    category: "jeux"
  },

  onStart: async function({ api, event, usersData }) {
    const { threadID, senderID } = event;

    let stats = global.memoryStats.get(senderID) || { streak: 0, last: 0 };

    if (Date.now() - stats.last < 4000) {
      return api.sendMessage("⏳ Doucement 😏", threadID);
    }

    stats.last = Date.now();

    const length = stats.streak >= 3 ? 6 : 4;
    const shuffled = [...EMOJIS].sort(() => Math.random() - 0.5);
    const selectedEmojis = shuffled.slice(0, length);

    const show = selectedEmojis.join(" ");
    const answer = selectedEmojis.join("");

    const name = await usersData.getName(senderID);
    
    // Génération du GIF animé
    const gifPath = await genUIGIF(senderID, name, "MÉMORISE VITE ! 🧠", `Série actuelle : ${stats.streak} 🔥`, "#00ffcc");

    api.sendMessage({
      body: `${frame}\n\n🧠 **SUITE À RETENIR :**\n\n👉 [ ${show} ] 👈\n\n⏳ Disparition dans 4 secondes...\n\n${frame}`,
      attachment: fs.createReadStream(gifPath)
    }, threadID, (err, info) => {
      if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      if (err) return;

      setTimeout(() => {
        try { api.unsendMessage(info.messageID); } catch(e) {}
      }, 4000);

      setTimeout(async () => {
        const askGif = await genUIGIF(senderID, name, "À TOI DE JOUER 👑", "Réponds vite au bot !", "#00bfff");

        api.sendMessage({
          body: `${frame}\n\n👑 ${name}... Qu'avez-vous mémorisé ?\n\n✍️ Réponds sans espace (Ex: 🍎🍕💎)\n⚠️ Une seule chance\n\n${frame}`,
          attachment: fs.createReadStream(askGif)
        }, threadID, (e, i) => {
          if (fs.existsSync(askGif)) fs.unlinkSync(askGif);
          if (e) return;

          if (global.GoatBot?.onReply) {
            global.GoatBot.onReply.set(i.messageID, {
              commandName: this.config.name,
              authorID: senderID,
              answer: answer
            });
          }
        });
      }, 4500);
    });

    global.memoryStats.set(senderID, stats);
  },

  onReply: async function({ event, Reply, message, usersData }) {
    const { senderID, body } = event;

    if (senderID !== Reply.authorID) return;

    let stats = global.memoryStats.get(senderID) || { streak: 0 };
    let xp = global.memoryXP.get(senderID) || { xp: 0, level: 1 };

    let user = await usersData.get(senderID);
    let money = parseInt(user.money || 0);

    const rep = body.replace(/\s/g, '');

    if (rep === Reply.answer) {
      stats.streak++;

      const gain = 2000 + (stats.streak * 700);
      const xpGain = 20;

      money += gain;
      xp.xp += xpGain;

      if (xp.xp >= xp.level * 100) {
        xp.xp = 0;
        xp.level++;
      }

      await usersData.set(senderID, { money: money });

      message.reply(`${frame}\n\n🎉 PARFAIT\n\n🔥 Série : ${stats.streak}\n⭐ Niveau : ${xp.level}\n💰 +${gain}$\n\n🧠 Monstre mental...\n\n${frame}`);
    } else {
      stats.streak = 0;

      const loss = 500;
      money = Math.max(0, money - loss);

      await usersData.set(senderID, { money: money });

      message.reply(`${frame}\n\n💀 ÉCHEC\n\n❌ Mauvais : ${rep || "vide"}\n👁️ Bon : ${Reply.answer}\n\n💸 -${loss}$\n\n${frame}`);
    }

    global.memoryStats.set(senderID, stats);
    global.memoryXP.set(senderID, xp);

    if (global.GoatBot?.onReply) {
      global.GoatBot.onReply.delete(Reply.messageID);
    }
  }
};

