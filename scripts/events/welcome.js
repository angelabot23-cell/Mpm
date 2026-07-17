const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "welcome",
    version: "3.0",
    author: "Saimx69x + Celestin 😎 (Canvas Remake)",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    const botID = api.getCurrentUserID();

    // Vérification du type de message de groupe
    if (logMessageType !== "log:subscribe" && logMessageType !== "log:unsubscribe") return;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "Ce groupe";
    const memberCount = threadInfo.participantIDs.length;

    const tmp = path.join(__dirname, "..", "cache");
    await fs.ensureDir(tmp);

    // ==========================================
    // ⚙️ FONCTION DE GÉNÉRATION CANVAS PRO UNIQUE
    // ==========================================
    async function generateCanvas(userId, fullName, type) {
      const canvas = createCanvas(900, 450);
      const ctx = canvas.getContext('2d');

      // 1. Fond dégradé futuriste sombre (Animation Look)
      let gradient = ctx.createLinearGradient(0, 0, 900, 450);
      gradient.addColorStop(0, '#0f0c1b');
      gradient.addColorStop(0.5, '#16122c');
      gradient.addColorStop(1, '#0f0c1b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Cercles lumineux en arrière-plan (Effet d'ambiance)
      ctx.fillStyle = type === "welcome" ? 'rgba(0, 180, 216, 0.05)' : 'rgba(233, 69, 96, 0.05)';
      ctx.beginPath(); ctx.arc(150, 225, 200, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(750, 225, 150, 0, Math.PI * 2); ctx.fill();

      // 3. Cadres doubles stylisés (✦ ▬▭▬) gravés sur l'image
      ctx.strokeStyle = type === "welcome" ? '#00b4d8' : '#e94560';
      ctx.lineWidth = 4;
      ctx.strokeRect(25, 25, 850, 400);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(32, 32, 836, 386);

      // 4. Intégration de la photo de profil de l'utilisateur
      const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      try {
        const userAvatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(190, 225, 110, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userAvatar, 80, 115, 220, 220);
        ctx.restore();

        // Contour de l'avatar
        ctx.strokeStyle = type === "welcome" ? '#00b4d8' : '#e94560';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(190, 225, 112, 0, Math.PI * 2);
        ctx.stroke();
      } catch (e) {
        // En cas d'échec de chargement, rond coloré par défaut
        ctx.fillStyle = type === "welcome" ? '#00b4d8' : '#e94560';
        ctx.beginPath(); ctx.arc(190, 225, 110, 0, Math.PI * 2); ctx.fill();
      }

      // 5. Dessin des éléments décoratifs textuels (Style Éléments)
      ctx.fillStyle = type === "welcome" ? '#00b4d8' : '#e94560';
      ctx.font = 'bold 16px "Sans-Serif"';
      ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 65);
      ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 395);

      // 6. Écriture des textes principaux avec ton style
      if (type === "welcome") {
        ctx.fillStyle = '#00b4d8';
        ctx.font = 'bold 42px "Sans-Serif"';
        ctx.fillText("🎉 𝑩𝑰𝑬𝑵𝑽𝑬𝑵𝑼𝑬 !", 400, 125);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Sans-Serif"';
        // Ajustement si le nom est trop long
        let txtName = fullName.length > 22 ? fullName.substring(0, 22) + "..." : fullName;
        ctx.fillText(`👤 𝑼𝒕𝒊𝒍𝒊𝒔𝒂𝒕𝒆𝒖𝒓 : ${txtName}`, 400, 185);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '22px "Sans-Serif"';
        let txtGroup = groupName.length > 25 ? groupName.substring(0, 25) + "..." : groupName;
        ctx.fillText(`📌 𝑮𝒓𝒐𝒖𝒑𝒆 : ${txtGroup}`, 400, 240);

        ctx.fillStyle = '#00b4d8';
        ctx.font = 'bold 24px "Sans-Serif"';
        ctx.fillText(`👥 𝑴𝒆𝒎𝒃𝒓𝒆 𝒏° : ${memberCount}`, 400, 295);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 18px "Sans-Serif"';
        ctx.fillText("🤝 𝑨𝒎𝒖𝒔𝒆-𝒕𝒐𝒊 𝒃𝒊𝒆𝒏 𝒂𝒗𝒆𝒄 𝒏𝒐𝒖𝒔 !", 400, 345);
      } else {
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 42px "Sans-Serif"';
        ctx.fillText("🚀 𝑨𝑼 𝑹𝑬𝑽𝑶𝑰𝑹 !", 400, 125);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Sans-Serif"';
        let txtName = fullName.length > 22 ? fullName.substring(0, 22) + "..." : fullName;
        ctx.fillText(`👤 ${txtName}`, 400, 185);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '22px "Sans-Serif"';
        ctx.fillText("🚪 𝑨 𝒒𝒖𝒊𝒕𝒕𝒆́ 𝒍𝒆 𝒏𝒂𝒗𝒊𝒓𝒆...", 400, 245);

        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 24px "Sans-Serif"';
        ctx.fillText(`👥 𝑴𝒆𝒎𝒃𝒓𝒆𝒔 𝒓𝒆𝒔𝒕𝒂𝒏𝒕𝒔 : ${memberCount}`, 400, 305);
      }

      const imagePath = path.join(tmp, `${type}_${userId}.png`);
      fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
      return imagePath;
    }

    // ==========================================
    // 1️⃣ CAS : ARRIVÉE (SUBSCRIBE)
    // ==========================================
    if (logMessageType === "log:subscribe") {
      const newUsers = logMessageData.addedParticipants;

      // SI C'EST LE BOT QUI REJOINT
      if (newUsers.some(u => u.userFbId === botID)) {
        let botName = "BOT";
        if (global.GoatBot && global.GoatBot.config && global.GoatBot.config.nickNameBot) {
          botName = global.GoatBot.config.nickNameBot;
        }
        try {
          await api.changeNickname(`✧ ${botName} ✧`, threadID, botID);
        } catch (e) {
          console.log("Erreur rename bot:", e);
        }

        return api.sendMessage(
`✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n🤖 𝑩𝑶𝑻 𝑪𝑶𝑵𝑵𝑬𝑪𝑻𝑬́\n\n👋 𝑺𝒂𝒍𝒖𝒕 ! 𝑱𝒆 𝒗𝒊𝒆𝒏𝒔 𝒅'𝒆̂𝒕𝒓𝒆 𝒂𝒋𝒐𝒖𝒕𝒆́.\n💡 𝑻𝒂𝒑𝒆 "help" 𝒑𝒐𝒖𝒓 𝒗𝒐𝒊𝒓 𝒎𝒆𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅𝒆𝒔.\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
          threadID
        );
      }

      // POUR CHAQUE NOUVEAU MEMBRE
      for (const user of newUsers) {
        try {
          const imagePath = await generateCanvas(user.userFbId, user.fullName, "welcome");

          await api.sendMessage({
            body: `✧ ▬▭▬ ▬▬ ✦✧✦ ▬▬ ▬▬ ✧\n🎉 𝑩𝒊𝒆𝒏𝒗𝒆𝒏𝒖𝒆 𝒂̀ 𝒕𝒐𝒊 ${user.fullName} !\n𝑹𝒆𝒈𝒂𝒓𝒅𝒆 𝒕𝒐𝒏 𝒃𝒂𝒅𝒈𝒆 𝒄𝒊-𝒅𝒆𝒔𝒔𝒐𝒖𝒔.\n✧ ▬▭▬ ▭▬ ✦✧✦ ▬▭ ▬▭▬ ✧`,
            attachment: fs.createReadStream(imagePath),
            mentions: [{ tag: user.fullName, id: user.userFbId }]
          }, threadID);

          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch (err) {
          console.error("Erreur Canvas Welcome:", err);
        }
      }
    }

    // ==========================================
    // 2️⃣ CAS : DÉPART (UNSUBSCRIBE)
    // ==========================================
    if (logMessageType === "log:unsubscribe") {
      const leftUser = logMessageData.leftParticipantFbId;
      
      // On ne fait rien si c'est le bot qui part
      if (leftUser === botID) return;

      try {
        // Récupération du nom de celui qui est parti
        const userInfo = await api.getUserInfo(leftUser);
        const fullName = userInfo[leftUser]?.name || "Un membre";

        const imagePath = await generateCanvas(leftUser, fullName, "leave");

        await api.sendMessage({
          body: `✧ ▬▭▬ ▬▬ ✦✧✦ ▬▬ ▬▬ ✧\n🚪 ${fullName} 𝒂 𝒒𝒖𝒊𝒕𝒕𝒆́ 𝒍𝒆 𝒈𝒓𝒐𝒖𝒑𝒆.\n𝑩𝒐𝒏𝒏𝒆 𝒄𝒉𝒂𝒏𝒄𝒆 𝒂̀ 𝒍𝒖𝒊/𝒆𝒍𝒍𝒆 !\n✧ ▬▭▬ ▭▬ ✦✧✦ ▬▭ ▬▭▬ ✧`,
          attachment: fs.createReadStream(imagePath)
        }, threadID);

        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      } catch (err) {
        console.error("Erreur Canvas Leave:", err);
      }
    }
  }
};
