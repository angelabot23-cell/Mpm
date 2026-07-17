/**
 * 🇫🇷━━━━━━━━━━━━━━━━━━━━
 * 👑 GUIDE ROYAL DU DÉVELOPPEUR
 * ━━━━━━━━━━━━━━━━━━━━
 *
 * 📌 Avant de commencer :
 * Tu dois maîtriser JavaScript :
 * variables, fonctions, boucles, tableaux, objets, async/await...
 * 👉 https://developer.mozilla.org/fr/docs/Web/JavaScript
 * 👉 https://www.w3schools.com/js/
 *
 * ⚙️ Ensuite Node.js :
 * require, module.exports, etc...
 * 👉 https://nodejs.org/fr/docs/
 *
 * 🌐 API Facebook non officielle :
 * api.sendMessage, api.changeNickname...
 * 👉 https://github.com/ntkhang03/fb-chat-api/blob/master/DOCS.md
 *
 * ⚠️ Important :
 * Si le fichier finit par `.eg.js` → il ne sera PAS chargé.
 * Change en `.js` pour l’activer.
 *
 * ━━━━━━━━━━━━━━━━━━━━
 * 👑 SYSTÈME ROYAL ACTIF
 * ━━━━━━━━━━━━━━━━━━━━
 */

module.exports = {
	config: {
		name: "commandName", // 👑 Nom unique de la commande
		version: "1.1", // ⚡ Version du système
		author: "NTKhang 👑", // 👤 Créateur
		countDown: 5, // ⏳ Temps d’attente (secondes)
		role: 0, // 👥 0 user | 1 admin | 2 owner
		shortDescription: {
			vi: "mô tả ngắn",
			en: "short description"
		},
		description: {
			vi: "mô tả dài",
			en: "long description"
		},
		category: "royal-system 👑",
		guide: {
			vi: "hướng dẫn sử dụng",
			en: "how to use"
		}
	},

	langs: {
		vi: {
			hello: "xin chào 👋",
			helloWithName: "xin chào 👑, id facebook của bạn là %1"
		},
		en: {
			hello:
`🇫🇷━━━━━━━━━━━━━━━━━━━━
👑 𝙎𝙔𝙎𝙏𝙀𝙈𝙀 𝙍𝙊𝙔𝘼𝙇 𝘼𝘾𝙏𝙄𝙁
━━━━━━━━━━━━━━━━━━━━

👋 Bonjour, voyageur du royaume !
✨ Bienvenue dans le système royal

━━━━━━━━━━━━━━━━━━━━`,
			
			helloWithName:
`🇫🇷━━━━━━━━━━━━━━━━━━━━
👑 𝙄𝘿𝙀𝙉𝙏𝙄𝙏𝙀 𝙍𝙊𝙔𝘼𝙇𝙀
━━━━━━━━━━━━━━━━━━━━

👤 Votre ID Facebook est : %1
⚜️ Statut : Citoyen du royaume

━━━━━━━━━━━━━━━━━━━━`
		}
	},

	onStart: async function ({
		api,
		args,
		message,
		event,
		threadsData,
		usersData,
		role,
		commandName,
		getLang
	}) {

		// 👑 MESSAGE ROYAL SIMPLE
		return message.reply(getLang("hello"));

		// 👑 AVEC PARAMÈTRE (option)
		// return message.reply(getLang("helloWithName", event.senderID));
	}
};
