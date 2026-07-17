const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

function toSmallCaps(text) {
  const smallCapsMap = {
    a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ꜰ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ',
    k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ', s:'ѕ', t:'ᴛ',
    u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ',
    A:'ᴀ', B:'ʙ', C:'ᴄ', D:'ᴅ', E:'ᴇ', F:'ꜰ', G:'ɢ', H:'ʜ', I:'ɪ', J:'ᴊ',
    K:'ᴋ', L:'ʟ', M:'ᴍ', N:'ɴ', O:'ᴏ', P:'ᴘ', Q:'ǫ', R:'ʀ', S:'ѕ', T:'ᴛ',
    U:'ᴜ', V:'ᴠ', W:'ᴡ', X:'x', Y:'ʏ', Z:'ᴢ',
    'é':'ᴇ́', 'è':'ᴇ̀', 'ê':'ᴇ̂', 'ç':'ᴄ̧', 'à':'ᴀ̀', 'ô':'ᴏ̂'
  };
  return text.split('').map(c => smallCapsMap[c] || c).join('');
}

async function generateGroupCanvas(groups, page, totalPages, startIndex) {
  // Dimensions pour un canvas carré optimisé (850x850)
  const width = 850;
  const height = 850;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Arrière-plan dégradé sombre Cyberpunk
  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#090a15');
  gradient.addColorStop(0.5, '#101124');
  gradient.addColorStop(1, '#090a15');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Bordure Premium Cyan
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  // En-tête
  ctx.fillStyle = '#00f2fe';
  ctx.font = 'bold 26px "Sans-Serif"';
  ctx.fillText("⚡ GLOBAL GROUPS INDEX", 40, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '13px "Sans-Serif"';
  ctx.fillText(`PAGE // 0${page} SUR 0${totalPages} | SYNC COMPLETED`, 40, 85);

  // Ligne de séparation
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(30, 110); ctx.lineTo(width - 30, 110); ctx.stroke();

  // Affichage des groupes en double colonne pour combler le format carré
  const startX1 = 50;
  const startX2 = 450;
  const startY = 140;
  const rowHeight = 85;

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const isSecondCol = i >= 7; 
    const colX = isSecondCol ? startX2 : startX1;
    const colY = startY + ((i % 7) * rowHeight);

    // Conteneur de fond pour chaque groupe (effet dalle vitrée)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(colX, colY, 360, 70);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
    ctx.strokeRect(colX, colY, 360, 70);

    // Index / Numéro du groupe
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 14px "Sans-Serif"';
    ctx.fillText(`${startIndex + i + 1}.`, colX + 15, colY + 40);

    // Dessin de l'avatar du groupe (cercle)
    const avatarX = colX + 45;
    const avatarY = colY + 15;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + 20, avatarY + 20, 20, 0, Math.PI * 2, true);
    ctx.clip();
    
    try {
      // Si une image existe, on la charge, sinon icône par défaut
      const imgUrl = g.imageSrc || `https://graph.facebook.com/${g.threadID}/picture?width=100&height=100`;
      const img = await loadImage(imgUrl);
      ctx.drawImage(img, avatarX, avatarY, 40, 40);
    } catch (e) {
      // Dessin de secours si l'image échoue
      ctx.fillStyle = '#101124';
      ctx.fillRect(avatarX, avatarY, 40, 40);
      ctx.fillStyle = '#00f2fe';
      ctx.font = 'bold 10px "Sans-Serif"';
      ctx.fillText("👥", avatarX + 12, avatarY + 24);
    }
    ctx.restore();

    // Bordure fine autour de l'image
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(avatarX + 20, avatarY + 20, 21, 0, Math.PI * 2); ctx.stroke();

    // Nom du groupe (tronqué si trop long)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Sans-Serif"';
    let gName = g.threadName || "Groupe sans nom";
    if (gName.length > 24) gName = gName.substring(0, 22) + "..";
    ctx.fillText(gName, colX + 100, colY + 30);

    // Compteur de membres
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px "Sans-Serif"';
    ctx.fillText(`👥 ${g.participantIDs.length} Membres`, colX + 100, colY + 48);
  }

  // Bas de page (Footer)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '11px "Sans-Serif"';
  ctx.fillText("SYSTÈME PRÉMIUM DE SÉLECTION DE MODULES DE REJOINDRE", 40, height - 40);

  const tmpDir = path.join(__dirname, "..", "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `join_canvas_${Date.now()}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "join",
    version: "4.0",
    author: "Christus",
    countDown: 5,
    role: 2,
    dev: true,
    shortDescription: "Rejoindre un groupe (Format Canvas Carré)",
    longDescription: "Liste graphique sous forme de grille carrée de tous les serveurs/groupes.",
    category: "owner",
    guide: { en: "{p}{n} [page|next|prev]" },
  },

  onStart: async function ({ api, event, args }) {
    try {
      const groupList = await api.getThreadList(200, null, ["INBOX"]);
      const filteredList = groupList.filter(g => g.isGroup && g.isSubscribed);

      if (!filteredList.length) return api.sendMessage("❌ Aucun groupe trouvé.", event.threadID);

      const pageSize = 14; // 14 éléments max par page (7 par colonne, sur 2 colonnes)
      const totalPages = Math.ceil(filteredList.length / pageSize);
      if (!global.joinPage) global.joinPage = {};
      const currentThread = event.threadID;

      let page = 1;
      if (args[0]) {
        const input = args[0].toLowerCase();
        if (input === "next") page = (global.joinPage[currentThread] || 1) + 1;
        else if (input === "prev") page = (global.joinPage[currentThread] || 1) - 1;
        else page = parseInt(input) || 1;
      }

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      global.joinPage[currentThread] = page;

      const startIndex = (page - 1) * pageSize;
      const currentGroups = filteredList.slice(startIndex, startIndex + pageSize);

      const imagePath = await generateGroupCanvas(currentGroups, page, totalPages, startIndex);

      const sentMessage = await api.sendMessage({
        body: `✨ 📊 ${toSmallCaps("Indexation des serveurs")} [ Page ${page}/${totalPages} ]\n\n👉 ${toSmallCaps("Répondez directement à cette image avec le numéro associé pour forcer l'entrée du bot.")}`,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });

      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: "join",
        messageID: sentMessage.messageID,
        author: event.senderID,
        list: filteredList,
        page,
        pageSize
      });

    } catch (e) {
      console.error(e);
      api.sendMessage("⚠️ Erreur lors de la génération de l'interface Canvas.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, list, page, pageSize } = Reply;
    if (event.senderID !== author) return;

    const groupIndex = parseInt(args[0], 10);
    if (isNaN(groupIndex) || groupIndex <= 0) {
      return api.sendMessage("⚠️ Numéro invalide.", event.threadID, event.messageID);
    }

    const startIndex = (page - 1) * pageSize;
    const currentGroups = list.slice(startIndex, startIndex + pageSize);

    if (groupIndex > (startIndex + currentGroups.length) || groupIndex <= startIndex) {
      return api.sendMessage("⚠️ Ce numéro n'est pas présent sur cette page.", event.threadID, event.messageID);
    }

    // Récupération de l'index relatif à la page actuelle
    const relativeIndex = groupIndex - startIndex - 1;

    try {
      const selected = currentGroups[relativeIndex];
      const groupID = selected.threadID;
      const members = await api.getThreadInfo(groupID);

      if (members.participantIDs.includes(event.senderID)) {
        return api.sendMessage(`⚠️ Vous êtes déjà membre de 『${selected.threadName}』`, event.threadID, event.messageID);
      }
      if (members.participantIDs.length >= 250) {
        return api.sendMessage(`🚫 Ce groupe a atteint la limite maximale de membres.`, event.threadID, event.messageID);
      }

      await api.addUserToGroup(event.senderID, groupID);
      api.sendMessage(`✅ Requête acceptée. Vous avez été injecté dans 『${selected.threadName}』`, event.threadID, event.messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("⚠️ Échec du traitement de liaison système.", event.threadID, event.messageID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  },
};
      
