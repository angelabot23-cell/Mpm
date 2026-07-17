/**
 * @file presence.js
 * @description Module pour forcer le statut en ligne (point vert) et activer l'écoute active sur GoatBot.
 */

module.exports = {
    config: {
        name: "presence",
        version: "1.1.0",
        author: "Système",
        countDown: 0,
        role: 2, // Réservé à l'administrateur
        shortDescription: "Active la présence en ligne permanente du bot (Point vert)",
        longDescription: "Force l'affichage du point vert en ligne sur le compte du bot et maintient la session active.",
        category: "system",
        guide: "{p}presence"
    },

    onLoad: async function ({ api }) {
        console.log("🟢 [PRÉSENCE] Initialisation et activation du mode en ligne...");
        try {
            // Force la présence en ligne et active l'écoute des événements au démarrage
            if (typeof api.setOptions === "function") {
                await api.setOptions({ 
                    listenEvents: true, 
                    selfListen: false, 
                    online: true 
                });
                console.log("✅ [PRÉSENCE] Statut en ligne injecté avec succès.");
            }
        } catch (error) {
            console.error("❌ [PRÉSENCE] Erreur de configuration initiale :", error.message);
        }
    },

    onStart: async function ({ message, api, event }) {
        try {
            if (typeof api.setOptions === "function") {
                await api.setOptions({ online: true });
                return message.reply("✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n🟢 Le point vert est désormais forcé et actif en permanence sur ce compte !\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧");
            } else {
                return message.reply("❌ Fonction d'état non supportée par votre instance FCA.");
            }
        } catch (error) {
            return message.reply(`❌ Erreur lors de l'activation : ${error.message}`);
        }
    }
};
