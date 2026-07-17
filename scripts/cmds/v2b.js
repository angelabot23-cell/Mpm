const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

module.exports = {
  config: {
    name: "v2a",
    aliases: ["video2audio"],
    version: "2.0",
    author: "Christus",
    countDown: 15,
    role: 0,
    description: "Convertir une vidéo répondue en fichier audio MP3",
    category: "media",
    guide: {
      fr: "{pn} — répondre à une vidéo pour extraire l'audio MP3"
    }
  },

  onStart: async function ({ api, event, message }) {
    try {
      if (!event.messageReply || !event.messageReply.attachments?.length)
        return message.reply("🎥 Veuillez répondre à une vidéo pour la convertir en audio MP3.");

      const attachment = event.messageReply.attachments[0];
      if (attachment.type !== "video")
        return message.reply("⚠️ Le contenu répondu doit être une vidéo !");

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const videoPath = path.join(cacheDir, `v2a_${Date.now()}.mp4`);
      const audioPath = path.join(cacheDir, `v2a_${Date.now()}.mp3`);

      const convertingMsg = await message.reply("🎧 Conversion de la vidéo en audio... Veuillez patienter ⏳");

      const { data } = await axios.get(attachment.url, { responseType: "arraybuffer" });
      await fs.writeFile(videoPath, Buffer.from(data));

      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .noVideo()
          .audioCodec("libmp3lame")
          .audioBitrate("192k")
          .on("end", resolve)
          .on("error", reject)
          .save(audioPath);
      });

      await api.sendMessage(
        {
          body: "✅ Conversion terminée !\n🎵 Voici votre audio :",
          attachment: fs.createReadStream(audioPath)
        },
        event.threadID,
        async (err) => {
          if (err) console.error(err);
          await fs.remove(videoPath);
          await fs.remove(audioPath);

          if (convertingMsg?.messageID) {
            setTimeout(() => {
              api.unsendMessage(convertingMsg.messageID);
            }, 1500);
          }
        },
        event.messageID
      );

    } catch (err) {
      console.error(err);
      message.reply("❌ Erreur : Impossible de convertir la vidéo en MP3.\nVeuillez réessayer plus tard.");
    }
  }
};
