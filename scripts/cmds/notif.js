const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const GIFEncoder = require('gifencoder');

module.exports = {
    config: {
        name: "notif",
        version: "10.1.0",
        author: "Célestin x Magic x AI",
        countDown: 5,
        role: 2, // Admin uniquement
        description: "Notification double visuel épurée (Admin + Groupe) - Rendu fluide",
        category: "admin",
        guide: {
            fr: "{p}notif [votre message]"
        }
    },

    onStart: async function ({ api, event, args, message, threadsData }) {
        const { senderID } = event;
        const messageText = args.join(" ");
        if (!messageText) return message.reply("⚠️ Tu dois spécifier un message pour l'annonce.");
        
        const cacheDir = path.join(__dirname, 'cache');
        await fs.ensureDir(cacheDir);

        let targetThreads = [];
        try {
            const allThreadsData = await threadsData.getAll() || [];
            for (const t of allThreadsData) {
                if (t.isGroup || t.threadID) targetThreads.push(t);
            }
        } catch(e) {}

        try {
            const threadList = await api.getThreadList(150, null, ["INBOX"]) || [];
            for (const t of threadList) {
                if (t.isGroup && t.threadID && !targetThreads.some(existing => existing.threadID === t.threadID)) {
                    targetThreads.push(t);
                }
            }
        } catch(e) {}

        if (targetThreads.length === 0) {
            return message.reply("❌ Aucun groupe détecté.");
        }

        await message.reply(`👑 [Cassidy Bot] Génération du double visuel épuré (Admin + Groupe)...`);

        // ─── CHARGEMENT SÉCURISÉ DE L'AVATAR ADMIN ───
        let adminImg = null;
        const adminAvatarUrl = `https://graph.facebook.com/${senderID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        try {
            adminImg = await loadImage(adminAvatarUrl);
        } catch (e) {
            try { 
                adminImg = await loadImage(`https://api.mestaria.com/fb/avatar?id=${senderID}`); 
            } catch (err) {
                console.log("Impossible de charger l'avatar admin, utilisation d'un fallback.");
            }
        }

        // Construction des frames de texte adaptées
        let framesText = [];
        for (let i = 1; i <= messageText.length; i += 3) {
            framesText.push(messageText.substring(0, i) + "┃");
        }
        
        // 52 frames de pause en fin de texte pour figer le GIF
        for (let i = 0; i < 52; i++) {
            framesText.push(messageText + " ");
        }

        const width = 1000;
        const height = 580;
        let count = 0;

        for (const thread of targetThreads) {
            const gifPath = path.join(cacheDir, `notif_double_${thread.threadID}_${Date.now()}.gif`);
            
            try {
                const info = await api.getThreadInfo(thread.threadID);
                const groupName = info.threadName || "Alliance Shinobi";
                
                let groupImg = null;
                if (info.imageSrc) {
                    try { groupImg = await loadImage(info.imageSrc); } catch (e) {}
                }

                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
                const encoder = new GIFEncoder(width, height);
                const writeStream = fs.createWriteStream(gifPath);
                
                encoder.createReadStream().pipe(writeStream);
                encoder.start();
                encoder.setRepeat(0);   
                encoder.setDelay(70); // Légèrement accéléré pour plus de fluidité
                encoder.setQuality(15); // Qualité augmentée pour éviter les pixels moches

                for (let f = 0; f < framesText.length; f++) {
                    ctx.clearRect(0, 0, width, height);

                    // Fond sombre premium uniforme
                    ctx.fillStyle = '#07070c';
                    ctx.fillRect(0, 0, width, height);

                    // Dégradé Or Royal pour les cadres
                    const gold = ctx.createLinearGradient(30, 30, width - 30, height - 30);
                    gold.addColorStop(0, '#bf953f'); 
                    gold.addColorStop(0.5, '#b38728'); 
                    gold.addColorStop(1, '#aa771c');

                    // Cadre principal épuré
                    ctx.strokeStyle = gold; 
                    ctx.lineWidth = 5;
                    ctx.beginPath(); 
                    ctx.roundRect(35, 35, width - 70, height - 70, 15); 
                    ctx.stroke();

                    // ─── POSITIONNEMENT DES DEUX VISUELS (STYLE PROPRE) ───
                    // 1. Photo de l'Admin (Haut Gauche)
                    ctx.strokeStyle = gold; 
                    ctx.lineWidth = 4;
                    ctx.beginPath(); 
                    ctx.arc(180, 170, 75, 0, Math.PI * 2); 
                    ctx.stroke();
                    if (adminImg) {
                        ctx.save(); ctx.beginPath(); ctx.arc(180, 170, 74, 0, Math.PI * 2); ctx.clip();
                        ctx.drawImage(adminImg, 105, 95, 150, 150); ctx.restore();
                    } else {
                        ctx.fillStyle = '#b38728'; ctx.beginPath(); ctx.arc(180, 170, 74, 0, Math.PI * 2); ctx.fill();
                    }

                    // 2. Photo du Groupe (Bas Gauche)
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3;
                    ctx.beginPath(); 
                    ctx.arc(180, 390, 75, 0, Math.PI * 2); 
                    ctx.stroke();
                    if (groupImg) {
                        ctx.save(); ctx.beginPath(); ctx.arc(180, 390, 74, 0, Math.PI * 2); ctx.clip();
                        ctx.drawImage(groupImg, 105, 315, 150, 150); ctx.restore();
                    } else {
                        ctx.fillStyle = '#3a86ff'; ctx.beginPath(); ctx.arc(180, 390, 74, 0, Math.PI * 2); ctx.fill();
                    }

                    // ─── ZONE TEXTUELLE DESIGN À DROITE ───
                    ctx.textAlign = 'left';
                    
                    // Titre du Groupe
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 34px "Sans-Serif"';
                    ctx.fillText(groupName.substring(0, 24).toUpperCase(), 340, 110);

                    // Sous-titre
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.font = 'bold 14px "Sans-Serif"';
                    ctx.fillText("TRANSMISSION OFFICIELLE DOUBLE CANAL", 340, 145);

                    // Séparateur épuré (Ligne fine au lieu du texte de décoration moche)
                    ctx.strokeStyle = gold;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(340, 175);
                    ctx.lineTo(920, 175);
                    ctx.stroke();

                    // Message Principal Dynamique
                    ctx.fillStyle = '#fbf5b7';
                    ctx.font = 'bold 28px "Sans-Serif"';
                    
                    const maxWidth = 580;
                    const words = framesText[f].split(' ');
                    let line = '';
                    let posY = 230;

                    for (let n = 0; n < words.length; n++) {
                        let testLine = line + words[n] + ' ';
                        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                            ctx.fillText(line, 340, posY);
                            line = words[n] + ' ';
                            posY += 42;
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line, 340, posY);

                    // Bas de page d'authentification
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.font = '11px "Sans-Serif"';
                    ctx.fillText(`⚡ SECURE BROADCAST PROTOCOL // SYSTEM_FRAME_${f.toString().padStart(2, '0')}`, 340, 520);
                    
                    encoder.addFrame(ctx);
                }

                encoder.finish();
                await new Promise((resolve) => writeStream.on('finish', resolve));

                await api.sendMessage({
                    body: `👑 **COMMUNIQUÉ OFFICIEL**\n\n📢 **Groupe :** ${groupName}\n📝 **Message :** ${messageText}`,
                    attachment: fs.createReadStream(gifPath)
                }, thread.threadID);

                count++;
                if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
                await new Promise(res => setTimeout(res, 1200));

            } catch (err) {
                console.log(`Erreur salon : ${thread.threadID}`, err.message);
                if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
            }
        }

        return message.reply(`🔥 Transmission terminée avec succès dans ${count} groupes !`);
    }
};
