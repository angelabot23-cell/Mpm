const EMOJIS = ['🍎','🍌','🍇','🍓','🍒','🥑','🍕','🍔','🍟','🍩','⚽','🎮','💎','🔥'];

module.exports = {
  config: {
    name: "memory",
    version: "7.0.0",
    author: "Célestin",
    role: 0,
    description: "Memory flash stylé",
    category: "jeux",
    guide: { fr: "{p}memory" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, senderID } = event;

    const shuffled = [...EMOJIS].sort(() => Math.random() - 0.5);
    const emojis = shuffled.slice(0, 4);

    const show = emojis.join(" ");
    const answer = emojis.join("");

    const name = await usersData.getName(senderID);
    const frame = "≪ °❈° ≫≪ °❈° ≫≪ °❈° ≫≪ °❈° ≫";

    // 🧠 Affichage
    api.sendMessage({
      body:
`${frame}

🧠 MEMORY FLASH

@${name}, regarde bien !

➡️ [ ${show} ]

⏳ Disparaît dans 4 secondes...

${frame}`,
      mentions: [{ tag: `@${name}`, id: senderID }]
    }, threadID, (err, info) => {
      if (err) return;

      // ⏳ Disparition
      setTimeout(() => {
        try {
          api.unsendMessage(info.messageID);
        } catch (e) {}
      }, 4000);

      // 👑 Question stylée
      setTimeout(() => {
        api.sendMessage({
          body:
`${frame}

👑 Vous avez mémorisé quoi mon roi ?

✍️ Envoie les 4 emojis sans espace

${frame}`
        }, threadID, (err2, info2) => {
          if (err2) return;

          if (global.GoatBot?.onReply) {
            global.GoatBot.onReply.set(info2.messageID, {
              commandName: "memory",
              authorID: senderID,
              answer: answer
            });
          }
        });
      }, 4500);
    });
  },

  onReply: async function ({ event, Reply, message, usersData }) {
    const { senderID, body } = event;

    if (senderID !== Reply.authorID) {
      return message.reply("❌ Ce n'est pas pour toi.");
    }

    const rep = body.trim().replace(/\s+/g, "");
    const name = await usersData.getName(senderID);
    const frame = "≪ °❈° ≫≪ °❈° ≫≪ °❈° ≫≪ °❈° ≫";

    if (rep === Reply.answer) {
      message.reply({
        body:
`${frame}

🎉 Bravo @${name} !

🧠 Mémoire parfaite 🔥
✅ ${Reply.answer}

${frame}`,
        mentions: [{ tag: `@${name}`, id: senderID }]
      });
    } else {
      message.reply({
        body:
`${frame}

💀 Raté @${name}

❌ Ta réponse : ${rep || "vide"}
👁️ Bonne réponse : ${Reply.answer}

${frame}`,
        mentions: [{ tag: `@${name}`, id: senderID }]
      });
    }

    // 🧹 clean
    if (global.GoatBot?.onReply)
      global.GoatBot.onReply.delete(Reply.messageID);
  }
};
