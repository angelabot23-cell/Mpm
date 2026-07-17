const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

async function generateNotifyCanvas(adminId, adminName, groupName, groupIconUrl, messageContent) {
    // Canvas format étendu style bannière moderne
    const canvas = createCanvas(1000, 580);
    const ctx = canvas.getContext('2d');

    // 1. Fond Néon Cyberpunk (Dégradé Violet & Cyan)
    const bgGradient = ctx.createLinearGradient(0, 0, 1000, 580);
    bgGradient.addColorStop(0, '#0f0c20'); // Sombre profond
    bgGradient.addColorStop(0.5, '#2b1055'); // Violet Électrique
    bgGradient.addColorStop(1, '#00f2fe'); // Cyan Néon
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1000, 580);

    // 2. Cadre Lumineux avec coins arrondis
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 15; // Effet néon brillant
    
    ctx.beginPath();
    ctx.roundRect(30, 30, 940, 520, 25);
    ctx.stroke();
    ctx.shadowBlur = 0; // Réinitialisation de l'ombre

    // 3. Avatar de l'Admin + "Cercle d'animation" pulsant
    const avatarX = 200;
    const avatarY = 290;
    const avatarRadius = 110;

    // Anneau externe "effet chargement"
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 12, 0.3, Math.PI * 1.5); // Arc partiel style chargement
    ctx.stroke();

    // ✨ URL AVATAR MISE À JOUR AVEC JETON DE SÉCURITÉ + SYSTEME DE SECOURS STABLE
    const avatarUrl = `https://graph.facebook.com/${adminId}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    try {
        const adminAvatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(adminAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();
    } catch (e) {
        // En cas de blocage de Facebook, appel à l'API de secours alternative
        try {
            const backupAvatar = await loadImage(`https://api.mestaria.com/fb/avatar?id=${adminId}`);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(backupAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
            ctx.restore();
        } catch (err) {
            // Remplacement par défaut uniquement si tout échoue
            ctx.fillStyle = '#00f2fe';
            ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2); ctx.fill();
        }
    }

    // 4. Intégration de l'icône du Groupe
    if (groupIconUrl) {
        try {
            const groupImg = await loadImage(groupIconUrl);
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(420, 155, 50, 50, 10);
            ctx.clip();
            ctx.drawImage(groupImg, 420, 155, 50, 50);
            ctx.restore();
        } catch (e) {}
    }

    // 5. Zone de Textes
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText("👑 COMMUNIQUÉ OFFICIEL", 420, 115);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Par : ${adminName}`, 420, 145);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    const groupTextX = groupIconUrl ? 485 : 420;
    ctx.fillText(`🏰 ${groupName.substring(0, 22)}`, groupTextX, 190);

    // 6. Cadre Décoratif Textuel (HAUT)
    const decoration = "✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧";
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(decoration, 420, 240);

    // Message principal avec retour à la ligne automatique
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 24px sans-serif';

    const maxLineWidth = 500;
    const words = messageContent.split(' ');
    let line = '';
    let currentY = 290;
    const lineHeight = 35;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && n > 0) {
            ctx.fillText(line, 420, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 420, currentY);

    // Cadre Décoratif Textuel (BAS)
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(decoration, 420, currentY + 50);

    // Sauvegarde de l'image
    const tmpDir = path.join(__dirname, "cache");
    await fs.ensureDir(tmpDir);
    const imagePath = path.join(tmpDir, `notify_${Date.now()}.png`);
    await fs.promises.writeFile(imagePath, canvas.toBuffer('image/png'));
    return imagePath;
}

module.exports = {
    config: {
        name: "notification",
        version: "3.7",
        author: "Généré x Célestin",
        role: 2,
        description: "Envoie un communiqué visuel cyberpunk avec cadre déco",
        category: "owner",
        guide: "{p}notification [votre message]"
    },

    onStart: async function ({ message, api, event, args, threadsData, usersData }) {
        if (!args[0]) return message.reply("⚠️ Message requis.");

        const allThreads = (await threadsData.getAll()).filter(t => t.isGroup);
        const adminId = event.senderID;
        const adminName = await usersData.getName(adminId);
        const messageContent = args.join(" ");
        
        message.reply(`📡 Envoi du visuel Cyberpunk en cours à ${allThreads.length} groupes...`);

        for (const thread of allThreads) {
            try {
                const info = await api.getThreadInfo(thread.threadID);
                const groupIconUrl = info.imageSrc || null;

                const imagePath = await generateNotifyCanvas(
                    adminId, adminName, info.threadName || "Groupe", 
                    groupIconUrl, messageContent
                );

                await api.sendMessage({
                    body: `👑 *𝘾𝙊𝙈𝙈𝙐𝙉𝙄𝙌𝙐𝙀́ 𝙊𝙁𝙁𝙄𝘾𝙄𝙀𝙇*\n\n📢 ${messageContent}`,
                    attachment: fs.createReadStream(imagePath)
                }, thread.threadID);

                await fs.unlink(imagePath);
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.error("Erreur groupe", thread.threadID, e.message);
            }
        }
        message.reply("✅ Envoyé avec style dans tous les groupes !");
    }
};
