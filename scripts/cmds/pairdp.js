const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "pairdp",
    aliases: ["animepdp"],
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "media",
    guide: "{p}animecdp"
  },

  onStart: async function ({ message, api, event }) {
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
`࿇ ══━━✥🌸✥━━══ ࿇
⚠️ Accès refusé

Modification non autorisée détectée.

࿇ ══━━✥🌸✥━━══ ࿇`,
        event.threadID,
        event.messageID
      );
    }

    try {
      const apiBase = await mahmud();
      const baseUrl = `${apiBase}/api/cdpvip2`;

      const getStream = async (url) => {
        const res = await axios({
          url,
          method: "GET",
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        return res.data;
      };

      const category = "anime";

      const res = await axios.get(`${baseUrl}?category=${category}`);
      const groupImages = res.data?.group || [];

      if (!groupImages.length)
        return message.reply(
`࿇ ══━━✥🌸✥━━══ ࿇
⚠️ Aucune donnée trouvée

Aucun contenu disponible dans cette catégorie.

࿇ ══━━✥🌸✥━━══ ࿇`);

      const streamAttachments = [];
      for (const url of groupImages) {
        try {
          const stream = await getStream(url);
          streamAttachments.push(stream);
        } catch {
          console.warn(`⚠ Failed to load image: ${url}`);
        }
      }

      if (!streamAttachments.length)
        return message.reply(
`࿇ ══━━✥🌸✥━━══ ࿇
❌ Échec de chargement

Impossible de récupérer les images.

࿇ ══━━✥🌸✥━━══ ࿇`);

      return message.reply({
        body:
`࿇ ══━━✥🌸✥━━══ ࿇
🎀 COLLECTION DISPONIBLE

Voici une sélection aléatoire de profils anime.

Qualité : validée
Accès : ouvert

࿇ ══━━✥🌸✥━━══ ࿇`,
        attachment: streamAttachments
      });

    } catch (err) {
      console.error("Full error:", err.response?.data || err.message);
      return message.reply(
`࿇ ══━━✥🌸✥━━══ ࿇
❌ Système instable

Une erreur est survenue.
Réessayez plus tard.

࿇ ══━━✥🌸✥━━══ ࿇`);
    }
  }
};
