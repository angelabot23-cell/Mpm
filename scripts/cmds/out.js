const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// 🎨 ENGIN CANVAS
async function generateOutCanvas(botId, botName, threadName, memberCount) {
    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    
    const canvas = createCanvas(900, 450);
    const ctx = canvas.getContext('2d');

    // Fond
    let gradient = ctx.createLinearGradient(0, 0, 900, 450);
    gradient.addColorStop(0, '#110414');
    gradient.addColorStop(1, '#110414');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 450);

    // Cadres
    ctx.strokeStyle = '#9d4edd'; ctx.lineWidth = 4; ctx.strokeRect(25, 25, 850, 400);
    
    // Avatar
    try {
        const avatarUrl = `https://graph.facebook.com/${botId}/picture?width=300&height=300`;
        const botAvatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(190, 225, 110, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(botAvatar, 80, 115, 220, 220);
        ctx.restore();
    } catch (e) {
        ctx.fillStyle = '#9d4edd'; ctx.beginPath(); ctx.arc(190, 225, 110, 0, Math.PI * 2); ctx.fill();
    }

    // Texte
    ctx.fillStyle = '#9d4edd'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText("🔌 DÉCONNEXION DU BOT", 400, 130);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`🤖 Nom : ${botName}`, 400, 195);
    ctx.fillText(`🏰 Groupe : ${threadName.substring(0, 20)}`, 400, 250);

    const imagePath = path.join(cacheDir, `out_${Date.now()}.png`);
    await fs.writeFile(imagePath, canvas.toBuffer('image/png'));
    return imagePath;
}

module.exports = {
    config: {
        name: "out",
        version: "2.1",
        role: 1, // Admin uniquement
        category: "admin"
    },

    onStart: async function ({ message, event, api }) {
        if (!event.isGroup) return message.reply("❌ Uniquement dans un groupe.");

        const animMsg = await message.reply("⚙️ Initialisation de la séquence de sortie...");
        
        try {
            const botId = api.getCurrentUserID();
            const threadInfo = await api.getThreadInfo(event.threadID);
            
            const imagePath = await generateOutCanvas(botId, "NéoBot", threadInfo.threadName, threadInfo.participantIDs.length);

            await api.sendMessage({
                body: "🛑 Ordre d'exécution reçu. Bye bye !",
                attachment: fs.createReadStream(imagePath)
            }, event.threadID);

            // Attendre un court instant pour que l'image parte avant de quitter
            setTimeout(async () => {
                await api.removeUserFromGroup(botId, event.threadID);
                await fs.unlink(imagePath);
            }, 2000);

        } catch (error) {
            console.error(error);
            message.reply("❌ Erreur : Le bot n'est peut-être pas administrateur du groupe.");
        }
    }
};
