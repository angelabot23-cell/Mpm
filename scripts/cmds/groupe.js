const { createCanvas, loadImage } = require('canvas');
const fs = require("fs-extra");
const path = require("path");
const GIFEncoder = require('gifencoder');

module.exports = {
    config: {
        name: "groupe",
        aliases: ["makegroup", "newgroup", "cg", "creergroupe"],
        version: "5.0.0",
        author: "olua",
        countDown: 15,
        role: 0,
        description: {
            fr: "Copie les membres du groupe avec une interface Sung Jin-woo et des réactions dynamiques."
        },
        category: "box",
        guide: {
            fr: "{p}groupe [Nom du nouveau groupe]"
        }
    },

    onStart: async function({ api, event, args, message }) {
        const { senderID, threadID, isGroup } = event;
        
        if (!isGroup) {
            return message.reply("⚠️ Cette commande doit être lancée dans un groupe pour pouvoir copier ses membres.");
        }

        let groupName = args.join(" ").trim();
        if (!groupName) {
            groupName = `Monarque de l'Ombre - ${Date.now().toString().slice(-4)}`;
        }

        // Ajout d'une réaction immédiate de chargement (Réaction groupe)
        try { api.setMessageReaction("⏳", event.messageID, () => {}, true); } catch(e) {}

        const cacheDir = path.join(__dirname, '..', 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const gifPath = path.join(cacheDir, `jinwoo_group_${Date.now()}.gif`);

        try {
            // 1. Récupération des membres du groupe actuel
            const threadInfo = await api.getThreadInfo(threadID);
            let allMembers = threadInfo.participantIDs;
            const botID = api.getCurrentUserID();

            allMembers = [...new Set(allMembers)].filter(id => id !== botID && id !== senderID && !id.includes("fbid"));

            if (allMembers.length === 0) {
                return message.reply("❌ Il n'y a pas assez de membres valides pour cloner ce salon.");
            }
            
            const firstPartner = allMembers.shift(); 
            const initialParticipants = [senderID, firstPartner];
            const extraMembers = allMembers.slice(0, 30);
            const totalToInvite = extraMembers.length;

            // 2. Chargement du visuel de Sung Jin-woo (Ombre / Éveil)
            let jinwooImg = null;
            try {
                // Utilisation d'une image brute de Jin-woo de haute qualité
                jinwooImg = await loadImage("[attachment_0](attachment)");
            } catch (e) {
                console.log("Erreur de chargement de l'image de fond Jin-woo.");
            }

            // 3. Génération du canvas animé (Thème Sung Jin-woo éveillé)
            const width = 1000;
            const height = 580;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            const encoder = new GIFEncoder(width, height);
            const writeStream = fs.createWriteStream(gifPath);
            
            encoder.createReadStream().pipe(writeStream);
            encoder.start(); encoder.setRepeat(0); encoder.setDelay(90); encoder.setQuality(12);

            const totalFrames = 25;
            for (let f = 0; f < totalFrames; f++) {
                ctx.clearRect(0, 0, width, height);

                // Fond d'ambiance nécro-sombre
                ctx.fillStyle = '#030208';
                ctx.fillRect(0, 0, width, height);

                // Dessin de Sung Jin-woo si disponible
                if (jinwooImg) {
                    ctx.globalAlpha = 0.45; // Effet d'incrustation en arrière-plan
                    ctx.drawImage(jinwooImg, width - 480, 0, 480, height);
                    ctx.globalAlpha = 1.0;
                }

                // Dégradé de l'Aura Électrique du Monarque (Bleu néon / Violet)
                const auraColor = ctx.createLinearGradient(30, 30, width - 30, height - 30);
                auraColor.addColorStop(0, '#00ffff');
                auraColor.addColorStop(0.5, '#7b2cbf');
                auraColor.addColorStop(1, '#0055ff');

                // Cadre magique
                ctx.strokeStyle = auraColor;
                ctx.lineWidth = 6;
                ctx.beginPath(); ctx.roundRect(30, 30, width - 60, height - 60, 20); ctx.stroke();

                // Ligne de balayage façon "Système" de Solo Leveling
                const systemY = 45 + ((f * 20) % (height - 90));
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(45, systemY); ctx.lineTo(width - 45, systemY); ctx.stroke();

                // --- TEXTES INTERFACE DU SYSTÈME ---
                ctx.textAlign = 'left';
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 38px "Impact", sans-serif';
                ctx.fillText(groupName.substring(0, 24).toUpperCase(), 70, 115);

                ctx.fillStyle = '#00ffff';
                ctx.font = 'bold 15px monospace';
                ctx.fillText("» ALERTE DU SYSTÈME : ÉVEIL DU SALON «", 70, 155);

                const separator = "❖ ══════════ ♆ ══════════ ❖";
                ctx.fillStyle = auraColor; ctx.font = 'bold 20px Arial';
                ctx.fillText(separator, 70, 210);

                // Message d'état de l'extraction des ombres
                ctx.fillStyle = '#e6e6fa';
                ctx.font = 'bold 28px sans-serif';
                ctx.fillText(`👥 Soldats de l'Ombre : En cours...`, 70, 280);
                
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '22px monospace';
                ctx.fillText(`⚡ Capacité : [${f}/${totalFrames}] Extraction active`, 70, 330);
                ctx.fillText(`🔮 Cible : ${totalToInvite} profils scannés`, 70, 375);

                ctx.fillStyle = auraColor; ctx.font = 'bold 20px Arial';
                ctx.fillText(separator, 70, 465);

                ctx.fillStyle = 'rgba(0, 255, 255, 0.4)'; ctx.font = '11px monospace';
                ctx.fillText("» PROTOCOLE DE TRANSFERT DE SUNG JIN-WOO ACTIF «", 70, 520);

                encoder.addFrame(ctx);
            }

            encoder.finish();
            await new Promise((resolve) => writeStream.on('finish', resolve));

            // Réaction "Création" lancée (Réaction groupe)
            try { api.setMessageReaction("🏗️", event.messageID, () => {}, true); } catch(e) {}

            // 4. Initialisation du groupe Facebook
            const newThreadID = await new Promise((resolve, reject) => {
                api.createNewGroup(initialParticipants, groupName, (err, groupID) => {
                    if (err) return reject(err);
                    resolve(groupID);
                });
            });

            await new Promise(resolve => setTimeout(resolve, 2500));

            try { await api.changeAdminStatus(newThreadID, senderID, true); } catch (e) {}

            // Envoi de la notification avec le super design Jin-woo
            await message.reply({
                body: `⚔️ **[SYSTÈME] ÉVEIL DU MONARQUE DE L'OMBRE**\n\n👑 Le salon **${groupName}** vient d'apparaître depuis le portail.\n🚀 Transfert des ${totalToInvite} ombres de soldats en cours...`,
                attachment: fs.createReadStream(gifPath)
            });

            if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);

            // Réaction "Ajout progressif" (Réaction groupe)
            try { api.setMessageReaction("🚀", event.messageID, () => {}, true); } catch(e) {}

            // 5. Ajout des soldats de l'ombre (Membres)
            let successCount = 1; 
            let failCount = 0;

            for (const memberID of extraMembers) {
                try {
                    await api.addUserToGroup(memberID, newThreadID);
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 2200)); // Latence sécurisée
                } catch (addError) {
                    failCount++;
                }
            }

            // Réaction de succès finale (Réaction groupe)
            try { api.setMessageReaction("👑", event.messageID, () => {}, true); } catch(e) {}

            return message.reply(`🎉 **MUTATION ET INVOCATION COMPLÈTE**\n━━━━━━━━━━━━━━━━━━━━\n👤 **Armée du Monarque :** ${successCount} membres intégrés.\n❌ **Ombres perdues :** ${failCount}\n\nLe portail est stable, le pouvoir est à vous !`);

        } catch (error) {
            console.error(error);
            if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
            try { api.setMessageReaction("❌", event.messageID, () => {}, true); } catch(e) {}
            return message.reply(`❌ Le Système a rencontré un obstacle : ${error.message}`);
        }
    }
};

