const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

module.exports = {
  config: {
    name: "noxi",
    version: "6.3",
    author: "Aesther",
    countDown: 5,
    role: 0,
    shortDescription: "🔞 Recherche et téléchargement de vidéos Noxi",
    longDescription: "Recherche + navigation stylisée avec téléchargement individuel ou multiple",
    category: "nsfw",
    guide: {
      fr: "{p}noxi <mot-clé> → recherche Noxi\n→ réponds avec numéro, 'all', 'next' ou 'prev'"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    const query = args.join(" ");
    if (!query) return message.reply("⛩ | Veuillez entrer un mot-clé pour rechercher sur Noxi.");

    try {
      const res = await axios.get(`https://delirius-apiofc.vercel.app/search/xnxxsearch?query=${encodeURIComponent(query)}`);
      const data = res.data.data;

      if (!data || data.length === 0) return message.reply("❌ | Aucun résultat trouvé.");

      const pageSize = 9;
      const page = 1;
      const totalPages = Math.ceil(data.length / pageSize);

      const styled = renderPage(data, query, page, pageSize, totalPages);
      const msg = await message.reply(styled);

      global.GoatBot.onReply.set(msg.messageID, {
        commandName: "noxi",
        author: event.senderID,
        data,
        query,
        page,
        pageSize
      });
    } catch (e) {
      console.error(e);
      message.reply("❌ | Erreur lors de la recherche.");
    }
  },

  onReply: async function ({ event, api, message, Reply }) {
    const { data, author, query, page, pageSize } = Reply;
    if (event.senderID !== author) return;

    const input = event.body.trim().toLowerCase();
    const totalPages = Math.ceil(data.length / pageSize);
    let newPage = page;

    if (input === "next") newPage++;
    else if (input === "prev") newPage--;
    else if (input === "all") {
      await message.reply("📦 Téléchargement des 9 premières vidéos (qualité basse)...");
      for (const item of data.slice(0, 9)) {
        try {
          const dl = await axios.get(`https://delirius-apiofc.vercel.app/download/xnxxdl?url=${encodeURIComponent(item.link)}`);
          const video = dl.data.data;
          const filePath = path.join(CACHE_DIR, `${Date.now()}.mp4`);

          // Message début téléchargement
          const processingMsg = await api.sendMessage({
            body: `📥 Vidéo #${data.indexOf(item) + 1} [Qualité: basse] en cours de téléchargement... Veuillez patienter... ♻️`
          }, event.threadID);

          await global.utils.downloadFile(video.download.low, filePath);

          // Supprimer message traitement
          await api.unsendMessage(processingMsg.messageID);

          await api.sendMessage({
            body: `✅ Téléchargement de la vidéo #${data.indexOf(item) + 1} [Qualité: basse] terminé avec succès\n\n🎞『 ${video.title} 』\n👁 Vues: ${video.views} | ⏳ Durée: ${video.duration} | ⚙ Qualité: basse`,
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => fs.unlinkSync(filePath));

          // Réaction OK
          await api.setMessageReaction("✅", event.messageID, () => { }, true);
        } catch (err) {
          console.log("❌ Erreur sur une vidéo :", err.message);
          await api.setMessageReaction("❌", event.messageID, () => { }, true);
        }
      }
      return;
    } else {
      const parts = input.split(" ");
      const num = parseInt(parts[0]);
      const quality = parts[1] || "low";

      if (!num || num < 1 || num > data.length)
        return message.reply("❌ | Numéro invalide.");

      try {
        // Message début téléchargement
        const processingMsg = await api.sendMessage({
          body: `📥 Vidéo #${num} [Qualité: ${quality}] en cours de téléchargement... Veuillez patienter... ♻️`
        }, event.threadID);

        const dl = await axios.get(`https://delirius-apiofc.vercel.app/download/xnxxdl?url=${encodeURIComponent(data[num - 1].link)}`);
        const video = dl.data.data;

        // Qualités disponibles
        const availableQualities = Object.keys(video.download || {}).join(", ");
        if (!video.download?.[quality]) {
          await api.unsendMessage(processingMsg.messageID);
          return message.reply(`❌ | La qualité "${quality}" n'est pas disponible.\n\nQualités disponibles : ${availableQualities}`);
        }

        const videoUrl = video.download[quality];
        const filePath = path.join(CACHE_DIR, `${Date.now()}.mp4`);
        await global.utils.downloadFile(videoUrl, filePath);

        // Supprimer message traitement
        await api.unsendMessage(processingMsg.messageID);

        await api.sendMessage({
          body: `✅ Téléchargement de la vidéo #${num} [Qualité: ${quality}] terminé avec succès\n\n🎌『 ${video.title} 』\n👁 Vues : ${video.views}\n⏳ Durée : ${video.duration}\n⚙ Qualité : ${quality}\n\nAutres qualités disponibles : ${availableQualities}`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));

        // Réaction OK
        await api.setMessageReaction("✅", event.messageID, () => { }, true);
      } catch (err) {
        console.error(err);
        await api.setMessageReaction("❌", event.messageID, () => { }, true);
        message.reply("❌ | Téléchargement impossible.");
      }
      return;
    }

    if (newPage < 1 || newPage > totalPages)
      return message.reply("⛔ Page invalide.");

    const styled = renderPage(data, query, newPage, pageSize, totalPages);
    const msg = await message.reply(styled);

    global.GoatBot.onReply.set(msg.messageID, {
      commandName: "noxi",
      author,
      data,
      query,
      page: newPage,
      pageSize
    });
  }
};

// -------------------
// Fonctions d'affichage
// -------------------

function formatViews(views) {
  if (!views) return "0";
  if (typeof views === "string") views = views.replace(/[^\d.]/g, "");
  views = Number(views);
  if (isNaN(views)) return "0";
  if (views >= 1e6) return (views / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (views >= 1e3) return (views / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return views.toString();
}

function renderPage(data, query, page, pageSize, totalPages) {
  const start = (page - 1) * pageSize;
  const pageData = data.slice(start, start + pageSize);

  const list = pageData.map((item, i) => {
    const views = formatViews(item.views);
    // Affichage statique du pourcentage à 100% comme dans l'exemple
    const percentage = "100%";
    const qualities = "low, high";

    // Durée + auteur, auteur aligné à gauche, durée à droite (jusqu'à ~20 chars)
    const author = item.author ? item.author.trim() : "";
    const duration = item.duration || "";

    const authorDuration = author
      ? `${author.padEnd(20, " ")}${duration}`
      : duration;

    return `🎌 ${start + i + 1}. 『 ${item.title} 』\n` +
           `👁 ${views}   💯 ${percentage}   🕒 ${authorDuration}\n` +
           `⚙ Qualités : ${qualities}`;
  }).join("\n\n");

  return `📺 𝗥𝗘𝗦𝗨𝗟𝗧𝗔𝗧𝗦 𝗡𝗢𝗫𝗜 🔞 (Page ${page}/${totalPages})\n` +
         `━━━━━━━━━━━━━━━━━━\n` +
         `🔍 Mot-clé : *${query}*\n\n` +
         `${list}\n` +
         `━━━━━━━━━━━━━━━━━━\n` +
         `📥 Réponds avec :\n` +
         `• un numéro (1-${data.length}) + optionnellement "low", "high", "hd"\n` +
         `• Exemple : "2 hd" ou "1"\n` +
         `• "all" pour tout recevoir\n` +
         `• "next" ou "prev" pour naviguer.`;
    }
