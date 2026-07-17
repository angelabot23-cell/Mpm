const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "vip",
    version: "1.1",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: {
      fr: "Ajouter, supprimer ou modifier le rôle VIP",
      en: "Add, remove, edit VIP role"
    },
    category: "chat",
    guide: {
      fr: '   {pn} [add | -a] <uid | @tag> : Ajouter le rôle VIP à un utilisateur'
        + '\n   {pn} [remove | -r] <uid | @tag> : Supprimer le rôle VIP d’un utilisateur'
        + '\n   {pn} [list | -l] : Lister tous les utilisateurs VIP',
      en: '   {pn} [add | -a] <uid | @tag>: Add VIP role for user'
        + '\n   {pn} [remove | -r] <uid | @tag>: Remove VIP role of user'
        + '\n   {pn} [list | -l]: List all VIP users'
    }
  },

  langs: {
    fr: {
      added:
`•.:°❀×═════════×❀°:.•
💎 VIP AJOUTÉ (${ "%1" }) :
%2
•.:°❀×═════════×❀°:.•`,

      alreadyVip:
`•.:°❀×═════════×❀°:.•
⚠️ DÉJÀ VIP (${ "%1" }) :
%2
•.:°❀×═════════×❀°:.•`,

      missingIdAdd:
`•.:°❀×═════════×❀°:.•
⚠️ Mentionne ou entre un ID
•.:°❀×═════════×❀°:.•`,

      removed:
`•.:°❀×═════════×❀°:.•
❌ VIP RETIRÉ (${ "%1" }) :
%2
•.:°❀×═════════×❀°:.•`,

      notVip:
`•.:°❀×═════════×❀°:.•
⚠️ PAS VIP (${ "%1" }) :
%2
•.:°❀×═════════×❀°:.•`,

      missingIdRemove:
`•.:°❀×═════════×❀°:.•
⚠️ Entre un ID à retirer
•.:°❀×═════════×❀°:.•`,

      listVip:
`•.:°❀×═════════×❀°:.•
👑 LISTE VIP :
%1
•.:°❀×═════════×❀°:.•`
    },

    en: {
      added:
`•.:°❀×═════════×❀°:.•
💎 ADDED VIP (${ "%1" }) :
%2
•.:°❀×═════════×❀°:.•`,

      alreadyVip:
`•.:°❀×═════════×❀°:.•
⚠️ ALREADY VIP (${ "%1" }) :
%2
•.:°❀×═════════×❀°:.•`,

      missingIdAdd:
`•.:°❀×═════════×❀°:.•
⚠️ Enter ID or tag user
•.:°❀×═════════×❀°:.•`,

      removed:
`•.:°❀×═════════×❀°:.•
❌ REMOVED VIP (${ "%1" }) :
%2
•.:°❀×═════════×❀°:.•`,

      notVip:
`•.:°❀×═════════×❀°:.•
⚠️ NOT VIP (${ "%1" }) :
%2
•.:°❀×═════════×❀°:.•`,

      missingIdRemove:
`•.:°❀×═════════×❀°:.•
⚠️ Enter ID to remove
•.:°❀×═════════×❀°:.•`,

      listVip:
`•.:°❀×═════════×❀°:.•
👑 VIP LIST :
%1
•.:°❀×═════════×❀°:.•`
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang, role }) {

    if (!config.vipuser) config.vipuser = [];

    switch (args[0]) {
      case "add":
      case "-a": {

        if (role < 3) return message.reply("⚠️ | Vous n'avez pas la permission d'ajouter des VIP.");

        if (args[1]) {
          let uids = [];
          if (Object.keys(event.mentions).length > 0)
            uids = Object.keys(event.mentions);
          else if (event.messageReply)
            uids.push(event.messageReply.senderID);
          else
            uids = args.filter(arg => !isNaN(arg));

          const notVipIds = [];
          const vipIds = [];
          for (const uid of uids) {
            if (config.vipuser.includes(uid))
              vipIds.push(uid);
            else
              notVipIds.push(uid);
          }

          config.vipuser.push(...notVipIds);
          const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

          return message.reply(
            (notVipIds.length > 0 ? getLang("added", notVipIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
            + (vipIds.length > 0 ? getLang("alreadyVip", vipIds.length, vipIds.map(uid => `• ${uid}`).join("\n")) : "")
          );
        } else
          return message.reply(getLang("missingIdAdd"));
      }

      case "remove":
      case "-r": {

        if (role < 3) return message.reply("⚠️ | Vous n'avez pas la permission de supprimer des VIP.");

        if (args[1]) {
          let uids = [];
          if (Object.keys(event.mentions).length > 0)
            uids = Object.keys(event.mentions);
          else
            uids = args.filter(arg => !isNaN(arg));

          const notVipIds = [];
          const vipIds = [];
          for (const uid of uids) {
            if (config.vipuser.includes(uid))
              vipIds.push(uid);
            else
              notVipIds.push(uid);
          }

          for (const uid of vipIds)
            config.vipuser.splice(config.vipuser.indexOf(uid), 1);

          const getNames = await Promise.all(vipIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

          return message.reply(
            (vipIds.length > 0 ? getLang("removed", vipIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
            + (notVipIds.length > 0 ? getLang("notVip", notVipIds.length, notVipIds.map(uid => `• ${uid}`).join("\n")) : "")
          );
        } else
          return message.reply(getLang("missingIdRemove"));
      }

      case "list":
      case "-l": {

        if (config.vipuser.length === 0)
          return message.reply("⚠️ | Aucun utilisateur VIP trouvé");

        const getNames = await Promise.all(config.vipuser.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));

        return message.reply(getLang("listVip", getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")));
      }

      default:
        return message.SyntaxError();
    }
  }
};
