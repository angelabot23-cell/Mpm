const axios = require("axios");const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "anime",
    version: "2.2",
    author: "Celestin x A",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Recherche un anime avec sa vraie image officielle MAL." },
    category: "anime",
    guide: { en: ".anime [nom de l'anime]" }
  },

  onStart: async function ({ message, args, event }) {
    try {
      const query = args.join(" ");

      if (!query) {
        return message.reply("⚠️ Spécifiez le nom exact d'un anime.\nExemple : `.anime Naruto Shippuden`");
      }

      const waitingMsg = await message.reply("🔍 Connexion aux serveurs MyAnimeList (Jikan v4)...");

      // 🎌 Requête stricte vers l'API Jikan
      const res = await axios.get("https://api.jikan.moe/v4/anime", {
        params: { 
          q: query, 
          limit: 1,
          order_by: "popularity" // Donne la version la plus recherchée/vraie en premier
        }
      });

      const anime = res.data?.data?.[0];

      if (!anime) {
        return message.reply("❌ Aucun anime trouvé dans la base de données officielle.");
      }

      // Extraction stricte des données certifiées
      const title = anime.title || "Inconnu";
      const episodes = anime.episodes || "En cours";
      const score = anime.score ? `${anime.score}/10` : "N/A";
      const year = anime.year || anime.aired?.from?.split("-")[0] || "N/A";
      const type = anime.type || "TV";
      
      // Récupération de l'image officielle HD (priorité au format Webp ou JPG large)
      const imgUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
      const synopsisRaw = anime.synopsis || "Aucune description disponible pour cet index.";

      // 🌐 Traduction du Synopsis
      async function translate(text) {
        try {
          const t = await axios.get("https://translate.googleapis.com/translate_a/single", {
            params: { client: "gtx", sl: "auto", tl: "fr", dt: "t", q: text }
          });
          return t.data[0].map(x => x[0]).join("");
        } catch {
          return text;
        }
      }
      const descriptionFR = await translate(synopsisRaw);

      // ---- CALCUL DYNAMIQUE DU CANVAS ----
      const canvasWidth = 850;
      const textX = 330;
      const maxWidth = canvasWidth - textX - 40;
      const lineHeight = 20;
      
      const dummyCanvas = createCanvas(100, 100);
      const dummyCtx = dummyCanvas.getContext('2d');
      dummyCtx.font = '14px "Sans-Serif"';
      
      const words = descriptionFR.split(' ');
      let line = '';
      let linesCount = 1;
      
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (dummyCtx.measureText(testLine).width > maxWidth && n > 0) {
          line = words[n] + ' ';
          linesCount++;
        } else {
          line = testLine;
        }
      }

      const synopsisHeight = linesCount * lineHeight;
      const startSynopsisY = 270;
      const canvasHeight = Math.max(480, startSynopsisY + synopsisHeight + 40);

      // ---- DESSIN DU CANVAS ----
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');

      // Fond Matrix Sombre
      let bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      bgGradient.addColorStop(0, '#0a0b14');
      bgGradient.addColorStop(0.5, '#121424');
      bgGradient.addColorStop(1, '#0a0b14');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Bordure Néon Émeraude
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);

      // Téléchargement et intégration de la VRAIE image
      if (imgUrl) {
        try {
          const poster = await loadImage(imgUrl);
          ctx.drawImage(poster, 45, 45, 250, 370);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 2;
          ctx.strokeRect(45, 45, 250, 370);
        } catch (e) {
          // Fallback si l'image crash au chargement
          ctx.fillStyle = '#1a1d36';
          ctx.fillRect(45, 45, 250, 370);
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px "Sans-Serif"';
          ctx.fillText("Image non chargeable", 100, 220);
        }
      }

      // Zone de texte
      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 24px "Sans-Serif"';
      const cleanTitle = title.length > 26 ? title.substring(0, 23) + "..." : title;
      ctx.fillText(cleanTitle.toUpperCase(), textX, 75);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(textX, 90); ctx.lineTo(canvasWidth - 45, 90); ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '15px "Sans-Serif"';
      ctx.fillText(`• Format : ${type}`, textX, 130);
      ctx.fillText(`• Épisodes : ${episodes}`, textX, 160);
      ctx.fillText(`• Année : ${year}`, textX, 190);
      ctx.fillText(`• Note : ⭐ ${score}`, textX, 220);

      ctx.fillStyle = '#ff007f';
      ctx.font = 'bold 15px "Sans-Serif"';
      ctx.fillText("SYNOPSIS :", textX, 260);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '14px "Sans-Serif"';
      
      let currentY = startSynopsisY + 10;
      line = '';
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
          ctx.fillText(line, textX, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, textX, currentY);

      // Sauvegarde du fichier cache
      const tmpDir = path.join(__dirname, "..", "cache");
      await fs.ensureDir(tmpDir);
      const imagePath = path.join(tmpDir, `anime_canvas_${Date.now()}.png`);
      fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));

      // Désaffichage du message d'attente
      if (global.api && event) {
        try {
          await global.api.unsendMessage(waitingMsg.messageID);
        } catch(e) {}
      }

      await message.reply({
        attachment: fs.createReadStream(imagePath)
      });

      setTimeout(() => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, 5000);

    } catch (err) {
      console.error(err);
      return message.reply("❌ Erreur lors de la synchronisation avec la base de données d'images.");
    }
  }
};
