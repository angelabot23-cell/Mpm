const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tt"],
    version: "2 0",
    author: "Christus",
    role: 0,
    shortDescription: "Rechercher et télécharger des vidéos TikTok",
    longDescription: "Recherche paginée de vidéos TikTok (10 par page)",
    category: "media",
    guide: "{p}tiktok <mot-clé>"
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query)
      return api.sendMessage("🌀 | Tapez un mot-clé !\nExemple : /tiktok sakura haruka", event.threadID, event.messageID);

    try {
      api.setMessageReaction("⌛️", event.messageID, event.threadID, () => {});
    } catch (e) {
      console.error("Erreur réaction (début) :", e.message);
    }

    try {
      const res = await axios.get(`https://xsaim8x-xxx-api.onrender.com/api/tiktok?query=${encodeURIComponent(query)}`, { timeout: 15000 });
      const data = res.data?.results || res.data?.data || [];

      if (!data || data.length === 0) {
        try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
        return api.sendMessage("❌ | Aucune vidéo TikTok trouvée !", event.threadID, event.messageID);
      }

      const allResults = Array.isArray(data) ? data.slice(0, 30) : [];
      try { api.setMessageReaction("✅️", event.messageID, event.threadID, () => {}); } catch {}

      await sendPage(api, event, allResults, 1, query);
    } catch (err) {
      console.error("Erreur récupération :", err?.message || err);
      try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
      api.sendMessage("⚠️ | Échec de la récupération des résultats TikTok. Réessayez plus tard.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    try {
      if (event.senderID !== Reply.author) return;

      const body = event.body.trim().toLowerCase();

      try { api.setMessageReaction("⌛️", event.messageID, event.threadID, () => {}); } catch {}

      if (body === "next") {
        const nextPage = Reply.page + 1;
        const maxPage = Math.ceil(Reply.results.length / 10);
        if (nextPage > maxPage) {
          try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
          return api.sendMessage("⚠️ | Plus de résultats !", event.threadID, event.messageID);
        }

        try { api.unsendMessage(Reply.resultMsgID); } catch {}
        try { api.setMessageReaction("✅️", event.messageID, event.threadID, () => {}); } catch {}
        return await sendPage(api, event, Reply.results, nextPage, Reply.query);
      }

      const choice = parseInt(body);
      if (isNaN(choice) || choice < 1 || choice > 10) {
        try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
        return api.sendMessage("⚠️ | Répondez par un numéro (1–10) ou 'next'.", event.threadID, event.messageID);
      }

      const index = (Reply.page - 1) * 10 + (choice - 1);
      const selected = Reply.results[index];
      if (!selected) {
        try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
        return api.sendMessage("❌ | Choix invalide !", event.threadID, event.messageID);
      }

      try { api.unsendMessage(Reply.resultMsgID); } catch {}

      const filePath = path.join(__dirname, `cache_tt_video_${event.senderID}.mp4`);
      try {
        const videoRes = await axios.get(selected.noWatermark, { responseType: "arraybuffer", timeout: 30000 });
        fs.writeFileSync(filePath, Buffer.from(videoRes.data, "binary"));

        try { api.setMessageReaction("✅️", event.messageID, event.threadID, () => {}); } catch {}

        api.sendMessage(
          {
            body: `🎬 ${selected.title ? (selected.title.length > 60 ? selected.title.slice(0, 57) + "..." : selected.title) : "Vidéo TikTok"}\n👁️ ${selected.views || "0"} | ❤️ ${selected.likes || "0"} | 💬 ${selected.comments || "0"}`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          (err) => {
            try { fs.unlinkSync(filePath); } catch {}
            if (err) {
              console.error("Erreur envoi vidéo :", err);
              try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
              api.sendMessage("❌ | Échec de l'envoi de la vidéo.", event.threadID, event.messageID);
            }
          },
          event.messageID
        );
      } catch (err2) {
        console.error("Erreur téléchargement/envoi :", err2?.message || err2);
        try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
        api.sendMessage("❌ | Échec du téléchargement ou de l'envoi de la vidéo TikTok.", event.threadID, event.messageID);
      }
    } catch (err) {
      console.error("Erreur onReply :", err);
      try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
      api.sendMessage("⚠️ | Une erreur est survenue lors de la réponse !", event.threadID, event.messageID);
    }
  }
};

async function sendPage(api, event, allResults, page, query) {
  const start = (page - 1) * 10;
  const end = start + 10;
  const pageResults = allResults.slice(start, end);

  let message = `🎵 𝗥ésultats TikTok (${query}) - Page ${page}\n\n`;
  const attachments = [];

  for (let i = 0; i < pageResults.length; i++) {
    const v = pageResults[i];
    const shortTitle = v && v.title ? (v.title.length > 45 ? v.title.slice(0, 45) + "..." : v.title) : "Sans titre";
    message += `${i + 1}. 🎬 ${shortTitle}\n👁️ ${v.views || 0} vues\n\n`;

    try {
      const imgPath = path.join(__dirname, `cache_tt_${event.senderID}_${page}_${i}.jpg`);
      const imgRes = await axios.get(v.cover, { responseType: "arraybuffer", timeout: 10000 });
      fs.writeFileSync(imgPath, Buffer.from(imgRes.data, "binary"));
      attachments.push(fs.createReadStream(imgPath));
    } catch (e) {
      console.error("Échec récupération couverture :", e.message);
    }
  }

  message += "👉 Répondez avec un numéro (1–10) pour télécharger.\n➡️ Tapez 'next' pour plus de résultats.";

  return new Promise((resolve) => {
    api.sendMessage(
      { body: message.trim(), attachment: attachments.length ? attachments : undefined },
      event.threadID,
      (err, info) => {
        if (err) {
          console.error("Erreur sendPage :", err);
          try { api.setMessageReaction("❌️", event.messageID, event.threadID, () => {}); } catch {}
          api.sendMessage("⚠️ | Échec de l'envoi des résultats.", event.threadID, event.messageID);
          attachments.forEach((att) => {
            try { fs.unlinkSync(att.path); } catch {}
          });
          return resolve();
        }

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "tiktok",
          author: event.senderID,
          results: allResults,
          query,
          page,
          resultMsgID: info.messageID
        });

        setTimeout(() => {
          attachments.forEach((att) => {
            try { fs.unlinkSync(att.path); } catch {}
          });
        }, 60000);

        resolve();
      },
      event.messageID
    );
  });
          }
