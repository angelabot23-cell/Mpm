module.exports = {
	config: {
		name: "sorthelp",
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Sắp xếp danh sách help",
			en: "Sort help list"
		},
		category: "image",
		guide: {
			en: "{pn} [name | category]"
		}
	},

	langs: {
		vi: {
			savedName: "Đã lưu cài đặt sắp xếp danh sách help theo thứ tự chữ cái",
			savedCategory: "Đã lưu cài đặt sắp xếp danh sách help theo thứ tự thể loại"
		},
		en: {
			savedName: "✔ Liste d’aide triée par nom enregistrée",
			savedCategory: "✔ Liste d’aide triée par catégorie enregistrée"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {

		if (args[0] == "name") {
			await threadsData.set(event.threadID, "name", "settings.sortHelp");
			message.reply(
`࿇ ══━━✥🌸✥━━══ ࿇
✔ TRI ACTIVÉ

📂 Liste d’aide : tri par NOM
🔤 Organisation : A → Z

✨ Système mis à jour avec succès
࿇ ══━━✥🌸✥━━══ ࿇`
			);
		}

		else if (args[0] == "category") {
			await threadsData.set(event.threadID, "category", "settings.sortHelp");
			message.reply(
`࿇ ══━━✥🌸✥━━══ ࿇
✔ TRI ACTIVÉ

📁 Liste d’aide : tri par CATÉGORIE
📊 Organisation optimisée

✨ Système mis à jour avec succès
࿇ ══━━✥🌸✥━━══ ࿇`
			);
		}

		else {
			message.SyntaxError();
		}
	}
};
