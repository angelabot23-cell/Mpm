const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const { client } = global;

// 🖼️ Fonction de génération d'image "Lourde"
async function createAdminStatusImage(userName, userId, status) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Fond style "Néo"
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 400);
    ctx.strokeStyle = status ? '#10b981' : '#ef4444';
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, 800, 400);

    // Avatar utilisateur
    try {
        const avatar = await loadImage(`https://graph.facebook.com/${userId}/picture?width=300&height=300`);
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 200, 80, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 40, 120, 160, 160);
        ctx.restore();
    } catch(e) {}

    // Texte Royal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 35px Arial';
    ctx.fillText("SYSTÈME ROYAL - NÉO", 230, 150);
    
    ctx.fillStyle = status ? '#10b981' : '#ef4444';
    ctx.font = 'bold 45px Arial';
    ctx.fillText(status ? "MODE ADMIN ACTIVÉ" : "MODE ADMIN DÉSACTIVÉ", 230, 220);
    
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px Arial';
    ctx.fillText(`Action effectuée par : ${userName}`, 230, 260);

    const p = path.join(__dirname, 'cache', `admin_${Date.now()}.png`);
    await fs.ensureDir(path.join(__dirname, 'cache'));
    await fs.writeFile(p, canvas.toBuffer('image/png'));
    return p;
}

module.exports = {
    config: {
        name: "adminonly",
        aliases: ["adonly", "onlyad"],
        version: "2.1",
        role: 2,
        category: "owner",
        description: "Active/Désactive le mode admin avec un visuel de haute qualité."
    },

    onStart: async function ({ args, message, event, usersData, config }) {
        if (!args[0] || (args[0] !== "on" && args[0] !== "off")) {
            return message.reply("⚠️ Usage: adminonly on/off");
        }

        const value = args[0] === "on";
        const userName = await usersData.getName(event.senderID);
        
        // Mise à jour de la config
        config.adminOnly.enable = value;
        fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));

        // Génération et envoi de l'image
        const imagePath = await createAdminStatusImage(userName, event.senderID, value);
        
        await message.reply({
            body: value ? "👑 Mode Royal activé." : "🌿 Mode Royal désactivé.",
            attachment: fs.createReadStream(imagePath)
        });

        await fs.unlink(imagePath);
    }
};
