const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// 🎨 Fonction de génération du Badge Whitelist
async function generateWhitelistCanvas(userName, userId, action) {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    // Fond
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 300);
    ctx.strokeStyle = action === "add" ? '#10b981' : '#ef4444';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 800, 300);

    // Avatar
    try {
        const avatar = await loadImage(`https://graph.facebook.com/${userId}/picture?width=200&height=200`);
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 150, 60, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 40, 90, 120, 120);
        ctx.restore();
    } catch(e) {}

    // Texte
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText("SYSTÈME WHITELIST", 200, 120);
    
    ctx.fillStyle = action === "add" ? '#10b981' : '#ef4444';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(action === "add" ? "UTILISATEUR AJOUTÉ" : "UTILISATEUR RETIRÉ", 200, 180);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Nom : ${userName}`, 200, 220);

    const p = path.join(__dirname, 'cache', `wl_${Date.now()}.png`);
    await fs.ensureDir(path.join(__dirname, 'cache'));
    await fs.writeFile(p, canvas.toBuffer('image/png'));
    return p;
}

module.exports = {
    config: {
        name: "whitelist",
        version: "1.2",
        role: 2,
        category: "admin"
    },

    onStart: async function ({ message, event, args, usersData }) {
        const action = args[0]; // add ou del
        let targetID = event.messageReply?.senderID || Object.keys(event.mentions)[0] || args[1];

        if (!targetID || !['add', 'del'].includes(action)) {
            return message.reply("⚠️ Usage : whitelist add/del @tag");
        }

        const userName = await usersData.getName(targetID);
        
        // --- LOGIQUE DE TA BASE DE DONNÉES ICI ---
        // Ex: const wl = global.db.whitelist;
        // ... ajoute ou retire targetID de ta liste ...

        // Génération de l'image
        const imagePath = await generateWhitelistCanvas(userName, targetID, action);
        
        await message.reply({
            body: action === "add" ? "✅ Ajouté avec succès." : "🌿 Retiré de la liste.",
            attachment: fs.createReadStream(imagePath)
        });

        await fs.unlink(imagePath);
    }
};
