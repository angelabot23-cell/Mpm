const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');

module.exports = {
	config: {
		name: "tid",
		version: "2.0",
		author: "Archives du Roi",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem id nhóm chat của bạn bằng ảnh canvas",
			en: "View threadID and group info with a cyber canvas image"
		},
		category: "info",
		guide: {
			en: "{pn}"
		}
	},

	onStart: async function ({ message, event, threadsData }) {
		const threadID = event.threadID.toString();
		let threadName = "THREAD_UNKNOWN";
		let threadAvatarURL = "";

		// Récupération sécurisée du nom et de l'avatar du groupe via l'API interne du bot
		try {
			if (threadsData && typeof threadsData.get === "function") {
				const info = await threadsData.get(threadID);
				if (info) {
					threadName = info.threadName || `GROUP_${threadID.slice(0, 4)}`;
					threadAvatarURL = info.imageSrc || "";
				}
			}
		} catch (e) {
			// Protection en cas de faille de la base de données locale
			threadName = "SECURE_CHAT_ROOM";
		}

		// Filtrage visuel du nom (Majuscules obligatoires pour le look cyber)
		threadName = threadName.toUpperCase();

		// Système de secours d'image si le groupe n'a pas d'avatar configuré
		const fallbackAvatar = `https://api.dicebear.com/7.x/identicon/png?seed=${threadID}`;
		const finalAvatarURL = threadAvatarURL || fallbackAvatar;

		try {
			// Canvas format large haut de gamme
			const canvas = createCanvas(850, 350);
			const ctx = canvas.getContext('2d');

			// --- FOND CYBER ROBOT ---
			ctx.fillStyle = "#0a0a0c"; 
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Grille de données futuriste
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

			// Chargement de l'avatar du groupe
			let groupImage;
			try {
				groupImage = await loadImage(finalAvatarURL);
			} catch (error) {
				groupImage = await loadImage(fallbackAvatar);
			}

			// Masque Octogonal Cyber pour l'avatar du groupe
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
			ctx.drawImage(groupImage, 70, 75, 230, 200);
			ctx.restore();

			// --- TEXTES INTERFACE ---
			
			// Tag d'archive royale
			ctx.font = "11px monospace";
			ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
			ctx.fillText("SYSTEM // ARCHIVES_ROYALES_THREAD_DETECTOR", 350, 85);

			// NOM DU GROUPE (Impact blanc)
			ctx.font = "bold 35px Impact";
			ctx.fillStyle = "#ffffff";
			// Limiter la taille du texte si le nom est trop long pour éviter les bugs d'affichage
			const displayName = threadName.length > 22 ? threadName.substring(0, 20) + "..." : threadName;
			ctx.fillText(displayName, 350, 135);

			// Séparateur de flux
			ctx.strokeStyle = "rgba(0, 85, 255, 0.3)";
			ctx.lineWidth = 2;
			ctx.beginPath(); ctx.moveTo(350, 155); ctx.lineTo(780, 155); ctx.stroke();

			// Label de sécurité du TID
			ctx.font = "12px monospace";
			ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
			ctx.fillText("ENCRYPTED_THREAD_ID:", 350, 185);

			// Valeur du Thread ID (Lueur néon bleu)
			ctx.shadowColor = "#00d4ff";
			ctx.shadowBlur = 12;
			ctx.font = "bold 38px monospace";
			ctx.fillStyle = "#00d4ff"; 
			ctx.fillText(`> ${threadID}`, 350, 230);
			ctx.shadowBlur = 0; // Reset de la lueur

			// Jauge d'analyse réseau en bas
			ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
			ctx.fillRect(350, 265, 450, 6);
			ctx.fillStyle = "#0055ff";
			ctx.fillRect(350, 265, 410, 6); // Barre d'état presque pleine

			// Sauvegarde de l'image de transmission dans le cache
			const pathImg = __dirname + `/cache/tid_${threadID}.png`;
			const buffer = canvas.toBuffer();
			await fs.outputFile(pathImg, buffer);

			return message.reply({
				body: `⚜️ [ ARCHIVES DU ROI ] Données de la cellule extraites.\n🆔 TID : ${threadID}`,
				attachment: fs.createReadStream(pathImg)
			}, () => fs.unlinkSync(pathImg));

		} catch (error) {
			return message.reply(`Échec de la transmission du savoir royal : ${error.message}`);
		}
	}
};
				
