const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// Évite les blocages si l'URL de l'image est lente
async function safeLoadImage(url) {
    try {
        return await Promise.race([
            loadImage(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
    } catch (e) {
        return null;
    }
}

// 🎨 MOTEUR GRAPHIQUE : Arrière-plan Galactique Avancé
function drawAdvancedGalaxy(ctx, width, height) {
    let gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#090214');
    gradient.addColorStop(0.5, '#140727');
    gradient.addColorStop(1, '#030108');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 50; i++) {
        let x = (i * 123456) % width;
        let y = (i * 654321) % height;
        
        if (i % 10 === 0) {
            ctx.strokeStyle = 'rgba(224, 170, 255, 0.8)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
            ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (i % 13 === 0) {
            let gradComet = ctx.createLinearGradient(x, y, x - 30, y + 15);
            gradComet.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradComet.addColorStop(1, 'rgba(199, 125, 255, 0.0)');
            ctx.strokeStyle = gradComet;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 30, y + 15);
            ctx.stroke();
        } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 1.8 + 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 🎨 ENGIN CANVAS 1 : LISTE DES GROUPES
async function generateGroupListCanvas(groupsData) {
    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    
    const maxDisplay = Math.min(groupsData.length, 5);
    const canvasHeight = 160 + (maxDisplay * 95);
    const canvas = createCanvas(900, canvasHeight);
    const ctx = canvas.getContext('2d');

    drawAdvancedGalaxy(ctx, 900, canvasHeight);

    ctx.strokeStyle = '#c77dff'; ctx.lineWidth = 5; ctx.strokeRect(25, 25, 850, canvasHeight - 50);
    ctx.strokeStyle = '#e0aaff'; ctx.lineWidth = 1.5; ctx.strokeRect(20, 20, 860, canvasHeight - 40);

    ctx.fillStyle = '#e0aaff'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText("✨ REGISTRE DES ROYAUMES ✨", 60, 85);

    let yOffset = 150;
    for (let i = 0; i < maxDisplay; i++) {
        const group = groupsData[i];

        ctx.fillStyle = 'rgba(157, 78, 221, 0.15)';
        ctx.fillRect(50, yOffset - 40, 800, 80);
        ctx.strokeStyle = 'rgba(199, 125, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, yOffset - 40, 800, 80);

        const groupAvatarUrl = group.imageSrc || `https://graph.facebook.com/${group.threadID}/picture?type=large`;
        const groupImg = await safeLoadImage(groupAvatarUrl);

        if (groupImg) {
            ctx.save(); ctx.beginPath(); ctx.arc(95, yOffset, 32, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(groupImg, 63, yOffset - 32, 64, 64); ctx.restore();
        } else {
            ctx.fillStyle = '#7b2cbf'; ctx.beginPath(); ctx.arc(95, yOffset, 32, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.font = '30px sans-serif'; ctx.fillText("🏰", 77, yOffset + 11);
        }

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 25px sans-serif';
        const cleanName = group.threadName ? group.threadName.substring(0, 28) : "Royaume sans nom";
        ctx.fillText(`[${i + 1}] ${cleanName}`, 155, yOffset - 3);

        ctx.fillStyle = '#e0aaff'; ctx.font = '17px sans-serif';
        ctx.fillText(`👥 Population : ${group.participantIDs.length} sujets  |  🆔 ID : ${group.threadID}`, 155, yOffset + 24);

        yOffset += 95;
    }

    const imagePath = path.join(cacheDir, `groups_${Date.now()}.png`);
    await fs.writeFile(imagePath, canvas.toBuffer('image/png'));
    return imagePath;
}

// 🎨 ENGIN CANVAS 2 : ÉCRAN DE SORTIE
async function generateOutCanvas(botId, botName, threadName) {
    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    
    const canvas = createCanvas(900, 450);
    const ctx = canvas.getContext('2d');

    drawAdvancedGalaxy(ctx, 900, 450);

    ctx.strokeStyle = '#c77dff'; ctx.lineWidth = 5; ctx.strokeRect(25, 25, 850, 400);
    ctx.strokeStyle = '#e0aaff'; ctx.lineWidth = 1.5; ctx.strokeRect(20, 20, 860, 410);
    
    try {
        const avatarUrl = `https://api.readyto.top/api/avatar?id=${botId}`;
        const botAvatar = await safeLoadImage(avatarUrl);
        if (botAvatar) {
            ctx.save(); ctx.beginPath(); ctx.arc(200, 225, 115, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(botAvatar, 85, 110, 230, 230); ctx.restore();
        } else { throw new Error(); }
    } catch (e) {
        ctx.fillStyle = '#7b2cbf'; ctx.beginPath(); ctx.arc(200, 225, 115, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif'; ctx.fillText("🤖", 175, 245);
    }

    ctx.fillStyle = '#e0aaff'; ctx.font = 'bold 40px sans-serif';
    ctx.fillText("✨ DÉCONNEXION DU SYSTEME", 390, 130);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`🤖 Nom : ${botName}`, 390, 205);
    ctx.fillText(`🏰 Groupe : ${threadName.substring(0, 22)}`, 390, 270);
    ctx.fillStyle = '#c77dff'; ctx.font = 'italic 19px sans-serif';
    ctx.fillText("Séquence de départ initiée avec succès...", 390, 335);

    const imagePath = path.join(cacheDir, `out_${Date.now()}.png`);
    await fs.writeFile(imagePath, canvas.toBuffer('image/png'));
    return imagePath;
}

module.exports = {
    config: {
        name: "grouplist",
        version: "3.0",
        role: 1, 
        category: "admin"
    },

    onStart: async function ({ message, api, event, args }) {
        try {
            const list = await api.getThreadList(20, null, ["INBOX"]);
            if (!list) return message.reply("❌ Impossible de charger Facebook.");
            const groupList = list.filter(group => group.isGroup && group.isSubscribed);

            if (groupList.length === 0) return message.reply("❌ Aucun royaume actif.");

            // 🛑 MODE ACTION : QUITTER UN GROUPE DIRECTEMENT VIA PARAMÈTRE
            if (args[0] === "quit" || args[0] === "leave") {
                const index = parseInt(args[1]) - 1;
                if (isNaN(index) || index < 0 || index >= groupList.length) {
                    return message.reply("❌ Numéro invalide. Exemple d'utilisation : /grouplist quit 1");
                }

                const targetGroup = groupList[index];
                const botId = api.getCurrentUserID();

                const statusMsg = await message.reply(`⏳ Exécution de la sentence de sortie pour : **${targetGroup.threadName || 'Sans Nom'}**...`);

                // Infos du Bot
                const botUserInfo = await api.getUserInfo(botId);
                const botName = botUserInfo[botId]?.name || "Bot Actuel";

                // Génération et envoi de l'image de déconnexion dans le groupe ciblé
                const outImagePath = await generateOutCanvas(botId, botName, targetGroup.threadName || "Royaume Privé");

                await api.sendMessage({
                    body: "🛑 Ordre de sortie impérial reçu. À bientôt dans les étoiles ! ✨",
                    attachment: fs.createReadStream(outImagePath)
                }, targetGroup.threadID);

                // Quitter le groupe après 4 secondes pour être sûr que le message part
                setTimeout(async () => {
                    try {
                        await api.removeUserFromGroup(botId, targetGroup.threadID);
                        if (fs.existsSync(outImagePath)) fs.unlinkSync(outImagePath);
                    } catch (e) {
                        console.error(e);
                    }
                }, 4000);

                if (statusMsg && statusMsg.messageID) await api.unsendMessage(statusMsg.messageID);
                return message.reply(`✅ Le bot a quitté le royaume **${targetGroup.threadName}**.`);
            }

            // 🌌 MODE AFFICHAGE : MONTRER LA CARTE CANVAS
            const animMsg = await message.reply("🔮 Déploiement de la carte stellaire...");
            const imagePath = await generateGroupListCanvas(groupList);

            await api.sendMessage({
                body: "📜 🌌 __REGISTRE DES ROYAUMES CONNECTÉS__ 🌌 📜\n\nPour faire quitter le bot d'un groupe, tape :\n👉 `/grouplist quit [Numéro]`",
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => {
                try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch(e) {}
            });

            if (animMsg && animMsg.messageID) await api.unsendMessage(animMsg.messageID);

        } catch (error) {
            console.error(error);
            message.reply("❌ Une erreur critique est survenue.");
        }
    }
};
