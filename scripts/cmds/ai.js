module.exports = {
  config: {
    name: "ai",
    version: "1.0",
    author: "Christus",
    role: 0,
    category: "system",
    shortDescription: "Bloque ai sans prefix",
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const msg = event.body;
    if (!msg) return;

    const text = msg.toLowerCase().trim();

    // détecte "ai" au début même sans prefix
    if (text.startsWith("ai ")) {
      return message.reply(
`＊┈┈┈┈＊┈┈┈┈＊┈┈┈┈
❌ "ai" est désactivé
👉 utilise : neo [message]
＊┈┈┈┈＊┈┈┈┈＊┈┈┈┈`
      );
    }
  }
};
