const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
	config: {
		name: "leave",
		version: "3.0",
		author: "NTKhang x Célestin 🔥 (Canvas Edition)",
		category: "events"
	},

	langs: {
		fr: {
			session1: "matin",
			session2: "midi",
			session3: "après-midi",
			session4: "soir",
			leaveType1: "a quitté",
			leaveType2: "a été expulsé",
			defaultLeaveMessage: "{userName} a quitté le groupe"
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType !== "log:unsubscribe") return;

		return async function () {
			const { threadID } = event;
			const threadData = await threadsData.get(threadID);
			if (!threadData.settings.sendLeaveMessage) return;

			const { leftParticipantFbId } = event.logMessageData;
			if (leftParticipantFbId == api.getCurrentUserID()) return;

			const userName = await usersData.getName(leftParticipantFbId);
			const threadInfo = await api.getThreadInfo(threadID);
			const groupName = threadInfo.threadName || "Ce groupe";
			const memberCount = threadInfo.participantIDs.length;

			const isKicked = event.author && event.author != leftParticipantFbId;

			// Définition des sessions horaires
			const hour = new Date().getHours();
			let timeText = "🌙 𝑵𝒖𝒊𝒕 𝒔𝒐𝒎𝒃𝒓𝒆...";
			if (hour >= 5 && hour < 12) timeText = "🌅 𝑴𝒂𝒕𝒊𝒏 𝒄𝒂𝒍𝒎𝒆...";
			else if (hour >= 12 && hour < 17) timeText = "☀️ 𝑷𝒍𝒆𝒊𝒏 𝒋𝒐𝒖𝒓...";
			else if (hour >= 17 && hour < 22) timeText = "🌆 𝑺𝒐𝒊𝒓𝒆́𝒆 𝒂𝒄𝒕𝒊𝒗𝒆...";

			// Liste des textes écrits en texte de secours (body)
			const leaveMsgs = [
				`✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n💨 𝑳𝒆 𝒎𝒆𝒎𝒃𝒓𝒆 ${userName} 𝒂 𝒒𝒖𝒊𝒕𝒕𝒆́...\n💅 𝑳𝒆 𝒔𝒕𝒚𝒍𝒆 𝒓𝒆𝒔𝒕𝒆.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
				`✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n👀 ${userName} 𝒆𝒔𝒕 𝒑𝒂𝒓𝒕𝒊.\n🔥 𝑹𝒊𝒆𝒏 𝒏𝒆 𝒄𝒉𝒂𝒏𝒈𝒆.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
				`✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n🫠 ${userName} 𝒂 𝒅𝒊𝒔𝒑𝒂𝒓𝒖...\n👑 𝑳’𝒆́𝒍𝒊𝒕𝒆 𝒄𝒐𝒏𝒕𝒊𝒏𝒖𝒆.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`
			];

			const kickMsgs = [
				`✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n💀 ${userName} 𝒂 𝒆́𝒕𝒆́ 𝒆𝒙𝒑𝒖𝒍𝒔𝒆́.\n⚠️ 𝑵𝒊𝒗𝒆𝒂𝒖 𝒊𝒏𝒔𝒖𝒇𝒇𝒊𝒔𝒂𝒏𝒕.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
				`✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n🚫 ${userName} 𝒂 𝒆́𝒕𝒆́ 𝒔𝒖𝒑𝒑𝒓𝒊𝒎𝒆́.\n👑 𝑺𝒆́𝒍𝒆𝒄𝒕𝒊𝒐𝒏 𝒏𝒂𝒕𝒖𝒓𝒆𝒍𝒍𝒆.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
				`✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n⚡ ${userName} 𝒂 𝒆́𝒕𝒆́ 𝒆́𝒋𝒆𝒄𝒕𝒆́.\n🔥 𝑳𝒆 𝒈𝒓𝒐𝒖𝒑𝒆 𝒓𝒆𝒔𝒑𝒊𝒓𝒆 𝒎𝒊𝒆𝒖𝒙.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`
			];

			const messages = isKicked ? kickMsgs : leaveMsgs;
			const bodyText = messages[Math.floor(Math.random() * messages.length)];

			// ==========================================
			// 🎨 GÉNÉRATION DU CANVAS LEAVE PRO
			// ==========================================
			const canvas = createCanvas(900, 450);
			const ctx = canvas.getContext('2d');

			// Fond dégradé sombre néon rouge/violet (Ambiance Départ)
			let gradient = ctx.createLinearGradient(0, 0, 900, 450);
			gradient.addColorStop(0, '#120714');
			gradient.addColorStop(0.5, '#1a0b1e');
			gradient.addColorStop(1, '#120714');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Halos de lumière animée en arrière-plan
			ctx.fillStyle = 'rgba(233, 69, 96, 0.04)';
			ctx.beginPath(); ctx.arc(150, 225, 180, 0, Math.PI * 2); ctx.fill();
			ctx.beginPath(); ctx.arc(700, 200, 220, 0, Math.PI * 2); ctx.fill();

			// Cadres de contours gravés (Double liseré stylisé)
			ctx.strokeStyle = '#e94560';
			ctx.lineWidth = 4;
			ctx.strokeRect(25, 25, 850, 400);
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 1;
			ctx.strokeRect(32, 32, 836, 386);

			// Décorations textuelles gravées (✦ ▬▭▬)
			ctx.fillStyle = '#e94560';
			ctx.font = 'bold 16px "Sans-Serif"';
			ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 65);
			ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 395);

			// Récupération et incrustation circulaire de la photo de profil
			const avatarUrl = `https://graph.facebook.com/${leftParticipantFbId}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
			try {
				const userAvatar = await loadImage(avatarUrl);
				ctx.save();
				ctx.beginPath();
				ctx.arc(190, 225, 110, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(userAvatar, 80, 115, 220, 220);
				ctx.restore();

				// Contour Néon Rouge/Rose autour de l'avatar
				ctx.strokeStyle = '#e94560';
				ctx.lineWidth = 6;
				ctx.beginPath();
				ctx.arc(190, 225, 112, 0, Math.PI * 2);
				ctx.stroke();
			} catch (e) {
				ctx.fillStyle = '#e94560';
				ctx.beginPath(); ctx.arc(190, 225, 110, 0, Math.PI * 2); ctx.fill();
			}

			// Écriture des corrections et des informations de départ sur la photo
			ctx.fillStyle = '#e94560';
			ctx.font = 'bold 38px "Sans-Serif"';
			ctx.fillText(isKicked ? "🚫 𝑬𝑿𝑷𝑼𝑳𝑺𝑰𝑶𝑵 !" : "🚪 𝑫𝑬́𝑷𝑨𝑹𝑻...", 400, 130);

			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 26px "Sans-Serif"';
			let cleanName = userName.length > 22 ? userName.substring(0, 22) + "..." : userName;
			ctx.fillText(`👤 𝑴𝒆𝒎𝒃𝒓𝒆 : ${cleanName}`, 400, 195);

			ctx.fillStyle = '#aaaaaa';
			ctx.font = '20px "Sans-Serif"';
			ctx.fillText(isKicked ? "⚠️ Raison : Sélection naturelle / Kick admin" : "💨 Raison : A quitté de son plein gré", 400, 250);

			ctx.fillStyle = '#e94560';
			ctx.font = 'bold 22px "Sans-Serif"';
			ctx.fillText(`👥 𝑴𝒆𝒎𝒃𝒓𝒆𝒔 𝒓𝒆𝒔𝒕𝒂𝒏𝒕𝒔 : ${memberCount}`, 400, 310);

			ctx.fillStyle = '#ffffff';
			ctx.font = 'italic 16px "Sans-Serif"';
			ctx.fillText(timeText, 400, 355);

			// Sauvegarde du fichier temporaire
			const tmpDir = path.join(__dirname, "..", "cache");
			await fs.ensureDir(tmpDir);
			const imagePath = path.join(tmpDir, `leave_${leftParticipantFbId}.png`);
			fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));

			// Préparation de la forme finale d'envoi
			const form = {
				body: bodyText,
				attachment: fs.createReadStream(imagePath)
			};

			// Envoi du message complet et suppression du cache
			message.send(form, (err) => {
				if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
			});
		};
	}
};
