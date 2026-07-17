const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');

module.exports = {
	config: {
		name: "uid",
		version: "3.1",
		author: "Modifié",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem user id và tên bằng ảnh canvas",
			en: "View facebook user id and name with a canvas image"
		},
		category: "info",
		guide: {
			vi: "   {pn}: xem uid de bạn\n   {pn} @tag: xem uid người được tag",
			en: "   {pn}: view your uid\n   {pn} @tag: view tagged user's uid"
		}
	},

	onStart: async function ({ message, event, args }) {
		let targetID = event.senderID;
		let targetName = "SUBJECT_UNKNOWN";

		// Détermination de la cible et extraction du nom si disponible
		if (event.messageReply) {
			targetID = event.messageReply.senderID;
			// Essaye de récupérer le nom via le système de reply ou laisse le placeholder
			targetName = "REPLY_TARGET";
		} else if (Object.keys(event.mentions).length > 0) {
			targetID = Object.keys(event.mentions)[0];
			// Nettoyage du nom (enlève le '@')
			targetName = event.mentions[targetID].replace("@", "").toUpperCase();
		} else if (args[0] && !isNaN(args[0])) {
			targetID = args[0];
		} else {
			// Si c'est l'utilisateur lui-même, on peut essayer d'extraire son nom global
			targetName = "USER_OPERATOR";
		}

		const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/png?seed=${targetID}`;

		try {
			// Canvas format large
			const canvas = createCanvas(850, 350);
			const ctx = canvas.getContext('2d');

			// --- FOND CYBER ROBOT ---
			ctx.fillStyle = "#0a0a0c"; 
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Grille techno
			ctx.strokeStyle = "rgba(0, 110, 255, 0.05)";
			ctx.lineWidth = 2;
			for (let i = 0; i < canvas.width; i += 40) {
				ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
			}
			for (let j = 0; j < canvas.height; j += 40) {
				ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
			}

			// Cadre HUD robot
			ctx.strokeStyle = "#0055ff";
			ctx.lineWidth = 4;
			ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
			
			// Coins renforcés cyber
			ctx.fillStyle = "#00d4ff";
			ctx.fillRect(15, 15, 20, 6);   ctx.fillRect(15, 15, 6, 20);
			ctx.fillRect(815, 15, 20, 6);  ctx.fillRect(829, 15, 6, 20);
			ctx.fillRect(15, 329, 20, 6);  ctx.fillRect(15, 315, 6, 20);
			ctx.fillRect(815, 329, 20, 6); ctx.fillRect(829, 315, 6, 20);

			// Chargement Avatar
			let avatarImage;
			try {
				avatarImage = await loadImage(avatarURL);
			} catch (error) {
				avatarImage = await loadImage(fallbackAvatar);
			}

			// Masque Octogonal Cyber
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(70, 175);
			ctx.lineTo(135, 75);
			ctx.lineTo(235, 75);
			ctx.lineTo(300, 175);
			ctx.lineTo(235, 275);
			ctx.lineTo(135, 275);
			ctx.closePath();
			
			ctx.lineWidth = 5;
			ctx.strokeStyle = "#00d4ff";
			ctx.stroke();
			ctx.clip();
			ctx.drawImage(avatarImage, 70, 75, 230, 200);
			ctx.restore();

			// --- TEXTES INTERFACE ---
			
			// Tag système du haut
			ctx.font = "11px monospace";
			ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
			ctx.fillText("SYSTEM // IDENTITY_DATA_CORE", 350, 85);

			// AFFICHAGE DU NOM (En gros, style robotique blanc)
			ctx.font = "bold 38px Impact";
			ctx.fillStyle = "#ffffff";
			ctx.fillText(targetName, 350, 135);

			// Separateur tech
			ctx.strokeStyle = "rgba(0, 85, 255, 0.3)";
			ctx.lineWidth = 2;
			ctx.beginPath(); ctx.moveTo(350, 155); ctx.lineTo(780, 155); ctx.stroke();

			// Label UID
			ctx.font = "12px monospace";
			ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
			ctx.fillText("SECURE_ACCESS_ID:", 350, 185);

			// Valeur UID (Lueur néon bleu)
			ctx.shadowColor = "#00d4ff";
			ctx.shadowBlur = 12;
			ctx.font = "bold 38px monospace";
			ctx.fillStyle = "#00d4ff"; 
			ctx.fillText(`> ${targetID}`, 350, 230);
			ctx.shadowBlur = 0; // Reset lueur

			// Barre de statut du bas
			ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
			ctx.fillRect(350, 265, 450, 6);
			ctx.fillStyle = "#0055ff";
			ctx.fillRect(350, 265, 380, 6); 

			// Exportation du fichier
			const pathImg = __dirname + `/cache/uid_${targetID}.png`;
			const buffer = canvas.toBuffer();
			await fs.outputFile(pathImg, buffer);

			return message.reply({
				body: `🌐 [ RÉSULTAT DU SCAN ] Données extraites avec succès.\n🆔 UID : ${targetID}`,
				attachment: fs.createReadStream(pathImg)
			}, () => fs.unlinkSync(pathImg));

		} catch (error) {
			return message.reply(`Erreur système : ${error.message}`);
		}
	}
};
