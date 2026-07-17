const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
  config: {
    name: "viponly",
    aliases: ["vipon", "onlyvip"],
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 3,
    description: {
      fr: "Activer/désactiver le mode où seuls les utilisateurs VIP peuvent utiliser le bot",
      en: "Turn on/off only VIP users can use bot"
    },
    category: "owner",
    guide: {
      fr: "   {pn} [on | off] : Activer/désactiver le mode VIP seulement"
        + "\n   {pn} noti [on | off] : Activer/désactiver la notification lorsqu’un utilisateur non VIP utilise le bot",
      en: "   {pn} [on | off]: Turn on/off the mode only VIP can use bot"
        + "\n   {pn} noti [on | off]: Turn on/off the notification when user is not VIP use bot"
    }
  },

  langs: {
    fr: {
      turnedOn: "✅ | Mode VIP seulement activé",
      turnedOff: "✅ | Mode VIP seulement désactivé",
      turnedOnNoti: "✅ | Notification activée pour les utilisateurs non VIP",
      turnedOffNoti: "✅ | Notification désactivée pour les utilisateurs non VIP"
    },
    en: {
      turnedOn: "Turned on the mode only VIP can use bot",
      turnedOff: "Turned off the mode only VIP can use bot",
      turnedOnNoti: "Turned on the notification when user is not VIP use bot",
      turnedOffNoti: "Turned off the notification when user is not VIP use bot"
    }
  },

  onStart: function ({ args, message, getLang }) {
    let isSetNoti = false;
    let value;
    let indexGetVal = 0;

    if (args[0] == "noti") {
      isSetNoti = true;
      indexGetVal = 1;
    }

    if (args[indexGetVal] == "on")
      value = true;
    else if (args[indexGetVal] == "off")
      value = false;
    else
      return message.SyntaxError();

    if (isSetNoti) {
      config.hideNotiMessage.vipOnly = !value;
      message.reply(getLang(value ? "turnedOnNoti" : "turnedOffNoti"));
    } else {
      config.vipOnly.enable = value;
      message.reply(getLang(value ? "turnedOn" : "turnedOff"));
    }

    fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
  }
};
