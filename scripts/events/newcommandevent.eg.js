module.exports = {
	config: {
		name: "commandName", 
		version: "1.0", 
		author: "NTKhang", 
		category: "events"
	},

	langs: {
		vi: {
			hello: "xin chào thành viên mới",
			helloWithName: "xin chào thành viên mới, id facebook của bạn là %1"
		},
		en: {
			hello: "bonjour nouveau membre",
			helloWithName: "bonjour nouveau membre, ton ID Facebook est %1"
		},
		fr: {
			hello: "bonjour nouveau membre 🌸",
			helloWithName: "bonjour nouveau membre 🌸, ton ID Facebook est %1"
		}
	},

	onStart: async function ({ api, message, event, getLang }) {

		// 👤 Quand quelqu’un rejoint le groupe
		if (event.logMessageType == "log:subscribe") {

			// Message simple
			message.send(getLang("hello"));

			// Message avec ID (optionnel)
			// message.send(getLang("helloWithName", event.logMessageData.addedParticipants[0].userFbId));
		}
	}
};
