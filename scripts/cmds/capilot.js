const axios = require("axios");

module.exports = {
    config: {
        name: "copilot",
        aliases: ["lune", "apollo"],
        version: "2.0.0",
        author: "olua",
        countDown: 5,
        role: 0,
        description: {
            fr: "Surveillance de la lune : IA Copilot avec système de modération par éjection automatique."
        },
        category: "moderation",
        guide: {
            fr: "{p}copilot [votre message] (ou laissez l'IA surveiller le chat en arrière-plan)"
        }
    },

    // ─── 1. EFFET HOMME SUR LA LUNE : SURVEILLANCE PARALLÈLE ET SANS BRUIT ───
    onChat: async function ({ api, event, message }) {
        const { body, senderID, threadID, isGroup, messageID } = event;
        if (!isGroup || !body || senderID === api.getCurrentUserID()) return;

        // Liste noire des mots vulgaires / déclencheurs de ban immédiat
        const listeNoire = ["putain", "merde", "salope", "connard", "fdp", "chienne"]; 
        const messageNormalise = body.toLowerCase().trim();

        // Détection du mot vulgaire
        const contientVulgarite = listeNoire.some(mot => messageNormalise.includes(mot));

        if (contientVulgarite) {
            try {
                // Réaction de l'ombre
                await api.setMessageReaction("🌑", messageID, () => {}, true);
                
                // Message d'avertissement solennel
                await message.reply("🚨 [SYSTEM LUNE] Vulgarité détectée. Extraction de la cible de l'orbite immédiatement.");

                // Éjection immédiate du participant du groupe
                await api.removeUserFromGroup(senderID, threadID);
                console.log(`[LUNE] L'utilisateur ${senderID} a été éjecté du groupe ${threadID} pour vulgarité.`);
            } catch (err) {
                console.error("[LUNE ERROR] Impossible d'éjecter le membre : ", err.message);
            }
        }
    },

    // ─── 2. COMMANDE DIRECTE : DISCUSSION AVEC L'IA COPILOT ───
    onStart: async function ({ api, event, args, message }) {
        const text = args.join(" ");
        if (!text) return message.reply("👨‍🚀 [Lune] Établissez une liaison radio. Posez une question à Copilot.");

        try {
            // Appel de l'API via axios avec encodage de l'URL sécurisé
            const url = `https://delfaapiai.vercel.app/ai/copilot?message=${encodeURIComponent(text)}&model=default`;
            const response = await axios.get(url);
            
            const replyAI = response.data.message || response.data.result || "Aucune réponse de la base lunaire.";

            // Réponse stylisée dans le chat
            return message.reply(`🛰️ **[COPILOT LUNARES]**\n━━━━━━━━━━━━━━━━━━\n${replyAI}`);

        } catch (error) {
            console.error("[API ERROR]", error);
            return message.reply("❌ Rupture de la liaison satellite avec l'API Copilot.");
        }
    }
};
