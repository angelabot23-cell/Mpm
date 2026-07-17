const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "edit2",
        aliases: [],
        version: "1.1",
        author: "Christus",
        countDown: 0,
        role: 0,
        shortDescription: "Modifier ou générer une image avec Gemini-Edit",
        category: "ai-image-edit",
        guide: {
            fr: "{pn} <texte> (répondre à une image optionnel)",
        },
    },
    onStart: async function ({ message, event, args, api }) {
        const prompt = args.join(" ");
        if (!prompt) return message.reply("⚠️ Veuillez fournir le texte pour générer ou modifier l'image.");

        const apiurl = "https://gemini-edit-omega.vercel.app/edit";
        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        try {
            let params = { prompt };
            if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments[0]) {
                params.imgurl = event.messageReply.attachments[0].url;
            }

            const res = await axios.get(apiurl, { params });

            if (!res.data || !res.data.images || !res.data.images[0]) {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return message.reply("❌ Impossible d'obtenir l'image.");
            }

            const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Image, "base64");

            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `${Date.now()}.png`);
            fs.writeFileSync(imagePath, imageBuffer);

            api.setMessageReaction("✅", event.messageID, () => {}, true);

            await message.reply(
                { attachment: fs.createReadStream(imagePath) },
                event.threadID,
                () => {
                    fs.unlinkSync(imagePath);
                    message.unsend(message.messageID);
                },
                event.messageID
            );

        } catch (error) {
            console.error("❌ ERREUR API :", error.response?.data || error.message);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return message.reply("❌ Une erreur est survenue lors de la génération/modification de l'image.");
        }
    }
};
