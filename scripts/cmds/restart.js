const fs = require("fs-extra");

// 🌸 CADRE
function neo(text) {
	return `
🌸 ══━━✥🌺✥━━══ 🌸

✨ ${text}

🌸 ══━━✥🌺✥━━══ 🌸
`;
}

// 👑 PHRASES ROYALES ALÉATOIRES
function getRandomRestartMessage() {
	const messages = [
		"🔄 Le Royaume se réveille...\n👑 Le Roi reprend le contrôle",
		"⚡ Réinitialisation divine en cours...\n🌌 Les systèmes s'alignent",
		"🔥 Redémarrage du trône...\n👑 Puissance restaurée",
		"🌙 Le système s'endort...\n🌅 Renaissance imminente",
		"💫 Synchronisation royale...\n👑 Autorité rétablie",
		"⚙️ Reconfiguration du noyau...\n👑 Le Boss revient bientôt"
	];
	return messages[Math.floor(Math.random() * messages.length)];
}

// 👑 PHRASES APRÈS REBOOT
function getRandomBackMessage(time) {
	const messages = [
		`✅ Le Roi est de retour\n⏱️ ${time}s\n👑 Tout est sous contrôle`,
		`🌟 Renaissance accomplie\n⏱️ ${time}s\n🔥 Système opérationnel`,
		`👑 Le trône est restauré\n⏱️ ${time}s\n⚡ Puissance maximale`,
		`🌌 Réveil terminé\n⏱️ ${time}s\n👑 Autorité absolue`,
		`🔥 Retour du Boss\n⏱️ ${time}s\n💫 Système stable`
	];
	return messages[Math.floor(Math.random() * messages.length)];
}

module.exports = {
	config: {
		name: "restart",
		version: "3.0",
		author: "NTKhang + Celestin 👑",
		countDown: 5,
		role: 2,
		description: {
			en: "Restart system (King Mode)"
		},
		category: "system"
	},

	onLoad: function ({ api }) {
		const pathFile = `${__dirname}/tmp/restart.txt`;

		if (fs.existsSync(pathFile)) {
			const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");

			const delay = ((Date.now() - time) / 1000).toFixed(1);

			api.sendMessage(
				neo(getRandomBackMessage(delay)),
				tid
			);

			fs.unlinkSync(pathFile);
		}
	},

	onStart: async function ({ message, event }) {
		const pathFile = `${__dirname}/tmp/restart.txt`;

		fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);

		await message.reply(
			neo(getRandomRestartMessage())
		);

		process.exit(2);
	}
};
