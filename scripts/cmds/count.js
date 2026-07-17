const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// Helper : Dessiner un rectangle arrondi
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  return ctx;
}

// 1. CANVAS DU CLASSEMENT PAR PAGE (GRAND FORMAT STYLISÉ)
async function generateLeaderboardCanvas(arraySort, page, totalPages, topGlobalUser) {
  const width = 600;
  const height = 900; 
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond dégradé Cyber Sombre profond
  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#05070f');
  gradient.addColorStop(0.5, '#0e152f');
  gradient.addColorStop(1, '#05070f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Grille holographique futuriste en arrière-plan
  ctx.strokeStyle = "rgba(0, 210, 255, 0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
  }
  for (let j = 0; j < height; j += 30) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
  }

  // Double bordure lumineuse néon cyan/bleue
  ctx.strokeStyle = '#0052ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, width - 24, height - 24);
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Titre principal
  ctx.fillStyle = '#00d2ff';
  ctx.font = 'bold 28px "Sans-Serif"';
  ctx.fillText("🏆 CLASSEMENT DES MEMBRES", 40, 60);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '11px "Sans-Serif"';
  ctx.fillText(`PAGE ${page} SUR ${totalPages}  •  SYNCHRONISATION ACTIVE`, 40, 82);

  // Séparateur brillant
  const sepGrad = ctx.createLinearGradient(30, 0, width - 30, 0);
  sepGrad.addColorStop(0, "rgba(0, 210, 255, 0)");
  sepGrad.addColorStop(0.5, "rgba(0, 210, 255, 0.5)");
  sepGrad.addColorStop(1, "rgba(0, 210, 255, 0)");
  ctx.fillStyle = sepGrad;
  ctx.fillRect(30, 95, width - 60, 2);

  // 👑 LE GAGNANT ABSOLU (Top #1 Global)
  if (topGlobalUser) {
    // Carte du vainqueur avec dégradé doré semi-transparent
    const topGrad = ctx.createLinearGradient(40, 115, width - 40, 115);
    topGrad.addColorStop(0, 'rgba(255, 215, 0, 0.12)');
    topGrad.addColorStop(1, 'rgba(255, 215, 0, 0.02)');
    ctx.fillStyle = topGrad;
    roundRect(ctx, 40, 115, width - 80, 95, 12).fill();
    
    ctx.strokeStyle = '#ffd700'; 
    ctx.lineWidth = 2;
    roundRect(ctx, 40, 115, width - 80, 95, 12).stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px "Sans-Serif"';
    ctx.fillText("👑 LE GAGNANT DU GROUPE (TOP #1) 👑", 60, 138);

    const topAvatarX = 60;
    const topAvatarY = 148;
    
    // Avatar du gagnant avec masque arrondi et ombre dorée
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(topAvatarX + 24, topAvatarY + 24, 24, 0, Math.PI * 2, true);
    ctx.fillStyle = '#0b1126';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(topAvatarX + 24, topAvatarY + 24, 24, 0, Math.PI * 2, true);
    ctx.clip();
    try {
      const imgUrl = `https://graph.facebook.com/${topGlobalUser.uid}/picture?type=large&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const img = await loadImage(imgUrl);
      ctx.drawImage(img, topAvatarX, topAvatarY, 48, 48);
    } catch (e) {
      ctx.fillStyle = '#0b1126';
      ctx.fillRect(topAvatarX, topAvatarY, 48, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px "Sans-Serif"';
      ctx.fillText("👤", topAvatarX + 13, topAvatarY + 31);
    }
    ctx.restore();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(topAvatarX + 24, topAvatarY + 24, 25, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Sans-Serif"';
    let topName = topGlobalUser.name || "Inconnu";
    if (topName.length > 18) topName = topName.substring(0, 16) + "..";
    ctx.fillText(topName, 130, 178);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px "Sans-Serif"';
    ctx.fillText(`${topGlobalUser.count} messages`, width - 195, 178);
  }

  // Liste des 10 membres de la page active
  const startX = 40;
  const startY = 235; 
  const rowHeight = 58;

  for (let i = 0; i < arraySort.length; i++) {
    const user = arraySort[i];
    const currentY = startY + (i * rowHeight);

    // Fond des cartes des membres
    const cardGrad = ctx.createLinearGradient(startX, currentY, width - startX, currentY);
    cardGrad.addColorStop(0, 'rgba(0, 82, 255, 0.08)');
    cardGrad.addColorStop(1, 'rgba(0, 82, 255, 0.01)');
    ctx.fillStyle = cardGrad;
    roundRect(ctx, startX, currentY, width - 80, 48, 8).fill();
    
    ctx.strokeStyle = 'rgba(0, 82, 255, 0.2)';
    ctx.lineWidth = 1;
    roundRect(ctx, startX, currentY, width - 80, 48, 8).stroke();

    // Couleur dynamique des médailles/rands
    const rankColor = user.stt === 1 ? '#ffd700' : user.stt === 2 ? '#c0c0c0' : user.stt === 3 ? '#cd7f32' : '#00d2ff';
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 16px "Sans-Serif"';
    ctx.fillText(`#${user.stt}`, startX + 15, currentY + 29);

    // Avatar arrondi
    const avatarX = startX + 55;
    const avatarY = currentY + 8;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + 16, avatarY + 16, 16, 0, Math.PI * 2, true);
    ctx.clip();
    try {
      const imgUrl = `https://graph.facebook.com/${user.uid}/picture?type=large&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const img = await loadImage(imgUrl);
      ctx.drawImage(img, avatarX, avatarY, 32, 32);
    } catch (e) {
      ctx.fillStyle = '#0b1126';
      ctx.fillRect(avatarX, avatarY, 32, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Sans-Serif"';
      ctx.fillText("👤", avatarX + 9, avatarY + 21);
    }
    ctx.restore();

    ctx.strokeStyle = rankColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(avatarX + 16, avatarY + 16, 17, 0, Math.PI * 2); ctx.stroke();

    // Nom du membre
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Sans-Serif"';
    let name = user.name || "Inconnu";
    if (name.length > 22) name = name.substring(0, 20) + "..";
    ctx.fillText(name, startX + 110, currentY + 28);

    // Nombre de messages
    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 12px "Sans-Serif"';
    ctx.fillText(`${user.count} msgs`, width - 150, currentY + 28);
  }

  // Barre de chargement cyberpunk fixe à 100% en bas
  const loadingY = height - 45;
  ctx.fillStyle = 'rgba(0, 210, 255, 0.1)';
  roundRect(ctx, 40, loadingY, width - 80, 15, 4).fill();
  
  ctx.fillStyle = '#00d2ff';
  roundRect(ctx, 40, loadingY, width - 80, 15, 4).fill();

  ctx.fillStyle = '#05070f';
  ctx.font = 'bold 10px "Sans-Serif"';
  ctx.fillText(`PAGE DATA SYNCED ██████████ 100%`, 55, loadingY + 11);

  const tmpDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `count_page_${Date.now()}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

// 2. CANVAS INDIVIDUEL (HAUT DE GAMME CHIC)
async function generateUserCanvas(user) {
  const width = 600;
  const height = 800; 
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#05070f');
  gradient.addColorStop(0.5, '#0e152f');
  gradient.addColorStop(1, '#05070f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Grille
  ctx.strokeStyle = "rgba(0, 210, 255, 0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
  }
  for (let j = 0; j < height; j += 30) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
  }

  ctx.strokeStyle = '#0052ff';
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  ctx.fillStyle = '#00d2ff';
  ctx.font = 'bold 30px "Sans-Serif"';
  ctx.fillText("📊 PERFORMANCES DE MEMBRE", 50, 75);

  ctx.strokeStyle = 'rgba(0, 210, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, 100); ctx.lineTo(width - 40, 100); ctx.stroke();

  const avRadius = 100;
  const avX = width / 2;
  const avY = 260;

  // Avatar avec lueur néon bleu
  ctx.save();
  ctx.shadowColor = '#00d2ff';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(avX, avY, avRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = '#0b1126';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(avX, avY, avRadius, 0, Math.PI * 2, true);
  ctx.clip();
  try {
    const imgUrl = `https://graph.facebook.com/${user.uid}/picture?type=large&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    const img = await loadImage(imgUrl);
    ctx.drawImage(img, avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
  } catch (e) {
    ctx.fillStyle = '#0b1126';
    ctx.fillRect(avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = '70px "Sans-Serif"';
    ctx.textAlign = 'center';
    ctx.fillText("👤", avX, avY + 25);
    ctx.textAlign = 'left';
  }
  ctx.restore();

  ctx.strokeStyle = '#00d2ff';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(avX, avY, avRadius + 2, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Sans-Serif"';
  ctx.textAlign = 'center';
  ctx.fillText(user.name || "Utilisateur", width / 2, 420);

  // Boite de statistiques
  const boxX = 60, boxY = 470, boxW = width - 120, boxH = 180;
  ctx.fillStyle = 'rgba(0, 82, 255, 0.05)';
  roundRect(ctx, boxX, boxY, boxW, boxH, 12).fill();
  
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
  ctx.lineWidth = 2;
  roundRect(ctx, boxX, boxY, boxW, boxH, 12).stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '20px "Sans-Serif"';
  ctx.fillText("POSITION DU RANG :", boxX + 30, boxY + 65);
  
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 32px "Sans-Serif"';
  ctx.fillText(`#${user.stt}`, boxX + boxW - 120, boxY + 68);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '20px "Sans-Serif"';
  ctx.fillText("VOLUME DE MESSAGES :", boxX + 30, boxY + 130);

  ctx.fillStyle = '#00d2ff';
  ctx.font = 'bold 28px "Sans-Serif"';
  ctx.fillText(`${user.count} msgs`, boxX + boxW - 185, boxY + 130);

  // Pied de page
  const lY = height - 60;
  ctx.fillStyle = 'rgba(0, 210, 255, 0.1)';
  roundRect(ctx, 50, lY, width - 100, 16, 4).fill();
  ctx.fillStyle = '#0052ff';
  roundRect(ctx, 50, lY, width - 100, 16, 4).fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Sans-Serif"';
  ctx.fillText("USER CORE DATA SYNCED ██████████ 100%", 65, lY + 12);

  const tmpDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `count_user_${Date.now()}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "count",
    version: "4.0",
    author: "NTKhang, Christus & AI",
    countDown: 5,
    role: 0,
    description: {
      vi: "Xem số lượng tin nhắn dạng Canvas phân trang lớn",
      en: "View members message counts split into perfectly sized Canvas photos"
    },
    category: "box chat",
    guide: {
      en: "{pn} | {pn} @tag | {pn} all [page]"
    }
  },

  langs: {
    vi: { invalidPage: "Số trang không hợp lệ" },
    en: { invalidPage: "Invalid page number" }
  },

  onStart: async function ({ args, threadsData, message, event, api, commandName, getLang }) {
    const { threadID, senderID } = event;
    const threadData = await threadsData.get(threadID);
    const { members } = threadData;
    const usersInGroup = (await api.getThreadInfo(threadID)).participantIDs;
    
    let arraySort = [];
    for (const user of members) {
      if (!usersInGroup.includes(user.userID)) continue;
      arraySort.push({
        name: user.name,
        count: user.count || 0,
        uid: user.userID
      });
    }

    let stt = 1;
    arraySort.sort((a, b) => b.count - a.count);
    arraySort.map(item => item.stt = stt++);

    if (args[0] && args[0].toLowerCase() === "all") {
      let page = parseInt(args[1]) || 1;
      const pageSize = 10;
      const totalPages = Math.ceil(arraySort.length / pageSize);

      if (page < 1 || page > totalPages) page = 1;

      const startIndex = (page - 1) * pageSize;
      const currentSelection = arraySort.slice(startIndex, startIndex + pageSize);
      const topGlobalUser = arraySort[0]; // Vainqueur absolu

      const imagePath = await generateLeaderboardCanvas(currentSelection, page, totalPages, topGlobalUser);

      // --- CRÉATION DE L'AFFICHAGE TEXTUEL DES NOMBRES ---
      let bodyText = `📊 [ CLASSEMENT DES MEMBRES — PAGE ${page}/${totalPages} ]\n`;
      bodyText += `👑 Champion : ${topGlobalUser.name} (${topGlobalUser.count} msgs)\n`;
      bodyText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      currentSelection.forEach(item => {
        const medal = item.stt === 1 ? "🥇" : item.stt === 2 ? "🥈" : item.stt === 3 ? "🥉" : `[#${item.stt}]`;
        bodyText += `${medal} ${item.name} — ${item.count} msgs\n`;
      });
      bodyText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 Répondez avec un numéro de page pour naviguer.`;

      return message.reply({
        body: bodyText,
        attachment: fs.createReadStream(imagePath)
      }, (err, info) => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        if (err) return message.err(err);
        
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: senderID,
          arraySort
        });
      });
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      const targetID = Object.keys(event.mentions)[0];
      const findUser = arraySort.find(item => item.uid == targetID);
      if (!findUser) return message.reply("Aucune donnée disponible pour cet utilisateur.");

      const imagePath = await generateUserCanvas(findUser);
      const textStats = `📊 [ STATS DE ${findUser.name.toUpperCase()} ]\n🏆 Rang : #${findUser.stt}\n💬 Total : ${findUser.count} messages`;

      return message.reply({ body: textStats, attachment: fs.createReadStream(imagePath) }, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    } else {
      const findUser = arraySort.find(item => item.uid == senderID);
      if (!findUser) return message.reply("Aucune donnée disponible pour votre profil.");

      const imagePath = await generateUserCanvas(findUser);
      const textStats = `📊 [ STATS DE ${findUser.name.toUpperCase()} ]\n🏆 Rang : #${findUser.stt}\n💬 Total : ${findUser.count} messages`;

      return message.reply({ body: textStats, attachment: fs.createReadStream(imagePath) }, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    }
  },

  onReply: async ({ message, event, Reply, commandName, getLang }) => {
    const { senderID, body } = event;
    const { author, arraySort } = Reply;
    if (author != senderID) return;

    const page = parseInt(body, 10);
    const pageSize = 10;
    const totalPages = Math.ceil(arraySort.length / pageSize);

    if (isNaN(page) || page < 1 || page > totalPages) {
      return message.reply(getLang("invalidPage"));
    }

    const startIndex = (page - 1) * pageSize;
    const currentSelection = arraySort.slice(startIndex, startIndex + pageSize);
    const topGlobalUser = arraySort[0];

    const imagePath = await generateLeaderboardCanvas(currentSelection, page, totalPages, topGlobalUser);

    // --- CRÉATION DE L'AFFICHAGE TEXTUEL DES NOMBRES EN RÉPONSE ---
    let bodyText = `📊 [ CLASSEMENT DES MEMBRES — PAGE ${page}/${totalPages} ]\n`;
    bodyText += `👑 Champion : ${topGlobalUser.name} (${topGlobalUser.count} msgs)\n`;
    bodyText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    currentSelection.forEach(item => {
      const medal = item.stt === 1 ? "🥇" : item.stt === 2 ? "🥈" : item.stt === 3 ? "🥉" : `[#${item.stt}]`;
      bodyText += `${medal} ${item.name} — ${item.count} msgs\n`;
    });
    bodyText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 Répondez avec un numéro de page pour naviguer.`;

    message.reply({
      body: bodyText,
      attachment: fs.createReadStream(imagePath)
    }, (err, info) => {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (err) return message.err(err);
      
      try { message.unsend(Reply.messageID); } catch(e) {}

      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: senderID,
        arraySort
      });
    });
  }
};
                  
