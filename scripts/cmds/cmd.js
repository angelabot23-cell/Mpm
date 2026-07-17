const { createCanvas, loadImage } = require('canvas');
const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const { client } = global;

const { configCommands } = global.GoatBot;
const { log, loading, removeHomeDir } = global.utils;

function getDomain(url) {
	const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
	const match = url.match(regex);
	return match ? match[1] : null;
}

function isURL(str) {
	try {
		new URL(str);
		return true;
	}
	catch (e) {
		return false;
	}
}

// ==========================================
// 🎨 ENGIN CANVAS POUR BADGES TERMINAL/CMD
// ==========================================
async function generateCmdCanvas(userId, userName, actionTitle, statusText, detailsText, themeColor) {
	const canvas = createCanvas(900, 450);
	const ctx = canvas.getContext('2d');

	// Fond style terminal cyberpunk sombre
	let gradient = ctx.createLinearGradient(0, 0, 900, 450);
	gradient.addColorStop(0, '#0a0a12');
	gradient.addColorStop(0.5, '#111122');
	gradient.addColorStop(1, '#0a0a12');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Grille en arrière-plan style matrice technique
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
	ctx.lineWidth = 1;
	for (let i = 0; i < canvas.width; i += 40) {
		ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
	}
	for (let j = 0; j < canvas.height; j += 40) {
		ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
	}

	// Cadres doubles gravés de couleur dynamique
	ctx.strokeStyle = themeColor;
	ctx.lineWidth = 4;
	ctx.strokeRect(25, 25, 850, 400);
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1;
	ctx.strokeRect(32, 32, 836, 386);

	// Décorations graphiques (✦ ▬▭▬)
	ctx.fillStyle = themeColor;
	ctx.font = 'bold 16px "Sans-Serif"';
	ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 65);
	ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 395);

	// Récupération de la photo de profil de l'exécuteur
	const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
	try {
		const userAvatar = await loadImage(avatarUrl);
		ctx.save();
		ctx.beginPath();
		ctx.arc(190, 225, 110, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(userAvatar, 80, 115, 220, 220);
		ctx.restore();

		// Anneau lumineux autour de la photo
		ctx.strokeStyle = themeColor;
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.arc(190, 225, 112, 0, Math.PI * 2);
		ctx.stroke();
	} catch (e) {
		ctx.fillStyle = themeColor;
		ctx.beginPath(); ctx.arc(190, 225, 110, 0, Math.PI * 2); ctx.fill();
	}

	// Textes du statut système
	ctx.fillStyle = themeColor;
	ctx.font = 'bold 36px "Sans-Serif"';
	ctx.fillText(actionTitle, 400, 125);

	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 24px "Sans-Serif"';
	ctx.fillText(`⚙️ 𝑶𝒑𝒆́𝒓𝒂𝒕𝒆𝒖𝒓 : ${userName.substring(0, 20)}`, 400, 185);

	ctx.fillStyle = '#ffffff';
	ctx.font = '22px "Sans-Serif"';
	ctx.fillText(statusText, 400, 245);

	// Sous-détails avec traitement de chaîne pour éviter les débordements
	ctx.fillStyle = '#888888';
	ctx.font = 'italic 16px "Sans-Serif"';
	let cleanDetails = detailsText.length > 45 ? detailsText.substring(0, 45) + "..." : detailsText;
	ctx.fillText(cleanDetails, 400, 305);

	ctx.fillStyle = themeColor;
	ctx.font = 'bold 16px "Sans-Serif"';
	ctx.fillText("»» SYSTEM KERNEL ONLINE ««", 400, 355);

	const tmpDir = path.join(__dirname, "..", "cache");
	await fs.ensureDir(tmpDir);
	const imagePath = path.join(tmpDir, `cmd_${Date.now()}_${userId}.png`);
	fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
	return imagePath;
}

module.exports = {
	config: {
		name: "cmd",
		version: "2.1",
		author: "NTKhang x Célestin 🔥 (Canvas Edition)",
		countDown: 5,
		role: 2,
		description: {
			vi: "Quản lý các tệp lệnh của bạn",
			en: "Manage your command files"
		},
		category: "owner",
		guide: {
			en: "   {pn} load <command file name>" + "\n   {pn} loadAll" + "\n   {pn} unload <command file name>" + "\n   {pn} install <url> <command file name>"
		}
	},

	langs: {
		fr: {
			missingFileName: "⚠️ | Veuillez entrer le nom du fichier de commande à recharger",
			loaded: "✅ | Commande \"%1\" chargée avec succès !",
			loadedError: "❌ | Échec du chargement de \"%1\"\n%2: %3",
			loadedSuccess: "✅ | Chargement réussi de (%1) commandes !",
			loadedFail: "❌ | Échec pour (%1) commandes\n%2",
			openConsoleToSeeError: "👀 | Ouvrez la console pour plus de détails",
			missingCommandNameUnload: "⚠️ | Veuillez entrer le nom de la commande à décharger",
			unloaded: "✅ | Commande \"%1\" déchargée avec succès !",
			unloadedError: "❌ | Échec du déchargement de \"%1\" avec l'erreur\n%2: %3",
			missingUrlCodeOrFileName: "⚠️ | Veuillez entrer l'URL/code et le nom du fichier à installer",
			missingUrlOrCode: "⚠️ | Veuillez entrer l'URL ou le code du fichier",
			missingFileNameInstall: "⚠️ | Veuillez entrer le nom du fichier final (ex: aide.js)",
			invalidUrl: "⚠️ | Veuillez entrer une URL valide",
			invalidUrlOrCode: "⚠️ | Impossible de récupérer le code source",
			alreadExist: "⚠️ | Le fichier existe déjà. Voulez-vous l'écraser ? Réagissez avec un emoji pour confirmer.",
			installed: "✅ | Commande \"%1\" installée ! Enregistrée dans %2",
			installedError: "❌ | Échec de l'installation de \"%1\"\n%2: %3",
			missingFile: "⚠️ | Fichier de commande \"%1\" introuvable",
			invalidFileName: "⚠️ | Nom de fichier invalide",
			unloadedFile: "✅ | Commande \"%1\" déchargée"
		},
		en: {
			missingFileName: "⚠️ | Please enter the command name you want to reload",
			loaded: "✅ | Loaded command \"%1\" successfully",
			loadedError: "❌ | Failed to load command \"%1\" with error\n%2: %3",
			loadedSuccess: "✅ | Loaded successfully (%1) command",
			loadedFail: "❌ | Failed to load (%1) command\n%2",
			openConsoleToSeeError: "👀 | Open console to see error details",
			missingCommandNameUnload: "⚠️ | Please enter the command name you want to unload",
			unloaded: "✅ | Unloaded command \"%1\" successfully",
			unloadedError: "❌ | Failed to unload command \"%1\" with error\n%2: %3",
			missingUrlCodeOrFileName: "⚠️ | Please enter the url or code and command file name you want to install",
			missingUrlOrCode: "⚠️ | Please enter the url or code of the command file you want to install",
			missingFileNameInstall: "⚠️ | Please enter the file name to save the command (with .js extension)",
			invalidUrl: "⚠️ | Please enter a valid url",
			invalidUrlOrCode: "⚠️ | Unable to get command code",
			alreadExist: "⚠️ | The command file already exists, are you sure you want to overwrite the old command file?\nReact to this message to continue",
			installed: "✅ | Installed command \"%1\" successfully, the command file is saved at %2",
			installedError: "❌ | Failed to install command \"%1\" with error\n%2: %3",
			missingFile: "⚠️ | Command file \"%1\" not found",
			invalidFileName: "⚠️ | Invalid command file name",
			unloadedFile: "✅ | Unloaded command \"%1\""
		}
	},

	onStart: async ({ args, message, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, event, commandName, getLang }) => {
		const senderID = event.senderID;
		const senderName = await usersData.getName(senderID);

		// ==========================================
		// CASE 1 : LOAD SINGLE SCRIPT
		// ==========================================
		if (args[0] == "load" && args.length == 2) {
			if (!args[1]) return message.reply(getLang("missingFileName"));
			const infoLoad = loadScripts("cmds", args[1], log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
			
			if (infoLoad.status == "success") {
				const imagePath = await generateCmdCanvas(senderID, senderName, "⚡ SYSTEM RELOAD", `✓ Cmd [${infoLoad.name}] active`, `Path: /scripts/cmds/${infoLoad.name}.js`, "#00f5d4");
				message.reply({ body: getLang("loaded", infoLoad.name), attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
			} else {
				const imagePath = await generateCmdCanvas(senderID, senderName, "❌ RELOAD FAILED", `× Error in [${infoLoad.name}]`, infoLoad.error.message, "#f72585");
				message.reply({ body: getLang("loadedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message) + "\n" + infoLoad.error.stack, attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
			}
		}
		
		// ==========================================
		// CASE 2 : LOAD ALL SCRIPTS
		// ==========================================
		else if ((args[0] || "").toLowerCase() == "loadall" || (args[0] == "load" && args.length > 2)) {
			const fileNeedToLoad = args[0].toLowerCase() == "loadall" ?
				fs.readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.match(/(eg)\.js$/g) && (process.env.NODE_ENV == "development" ? true : !file.match(/(dev)\.js$/g)) && !configCommands.commandUnload?.includes(file)).map(item => item = item.split(".")[0]) :
				args.slice(1);
			
			const arraySucces = [];
			const arrayFail = [];

			for (const fileName of fileNeedToLoad) {
				const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
				if (infoLoad.status == "success") arraySucces.push(fileName);
				else arrayFail.push(` ❗ ${fileName} => ${infoLoad.error.name}: ${infoLoad.error.message}`);
			}

			let msg = "";
			let themeColor = "#00f5d4";
			if (arraySucces.length > 0) msg += getLang("loadedSuccess", arraySucces.length);
			if (arrayFail.length > 0) {
				msg += (msg ? "\n" : "") + getLang("loadedFail", arrayFail.length, arrayFail.join("\n")) + "\n" + getLang("openConsoleToSeeError");
				themeColor = "#f72585";
			}

			const imagePath = await generateCmdCanvas(senderID, senderName, "🔮 GLOBAL CORE LOAD", `Success: ${arraySucces.length} | Fails: ${arrayFail.length}`, "Full stack operations re-loaded", themeColor);
			message.reply({ body: msg, attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
		}
		
		// ==========================================
		// CASE 3 : UNLOAD SCRIPT
		// ==========================================
		else if (args[0] == "unload") {
			if (!args[1]) return message.reply(getLang("missingCommandNameUnload"));
			const infoUnload = unloadScripts("cmds", args[1], configCommands, getLang);
			
			if (infoUnload.status == "success") {
				const imagePath = await generateCmdCanvas(senderID, senderName, "📦 KERNEL UNLOAD", `✕ [${infoUnload.name}] disabled`, "Module cut off from memory stream", "#ffb703");
				message.reply({ body: getLang("unloaded", infoUnload.name), attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
			} else {
				const imagePath = await generateCmdCanvas(senderID, senderName, "❌ UNLOAD ERROR", "Execution block failed", infoUnload.error.message, "#f72585");
				message.reply({ body: getLang("unloadedError", infoUnload.name, infoUnload.error.name, infoUnload.error.message), attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
			}
		}
		
		// ==========================================
		// CASE 4 : INSTALL SCRIPT (URL / RAW CODE)
		// ==========================================
		else if (args[0] == "install") {
			let url = args[1];
			let fileName = args[2];
			let rawCode;

			if (!url || !fileName) return message.reply(getLang("missingUrlCodeOrFileName"));
			if (url.endsWith(".js") && !isURL(url)) {
				const tmp = fileName; fileName = url; url = tmp;
			}

			if (url.match(/(https?:\/\/(?:www\.|(?!www)))/)) {
				if (!fileName || !fileName.endsWith(".js")) return message.reply(getLang("missingFileNameInstall"));
				const domain = getDomain(url);
				if (!domain) return message.reply(getLang("invalidUrl"));

				if (domain == "pastebin.com") {
					const regex = /https:\/\/pastebin\.com\/(?!raw\/)(.*)/;
					if (url.match(regex)) url = url.replace(regex, "https://pastebin.com/raw/$1");
					if (url.endsWith("/")) url = url.slice(0, -1);
				}
				else if (domain == "github.com") {
					const regex = /https:\/\/github\.com\/(.*)\/blob\/(.*)/;
					if (url.match(regex)) url = url.replace(regex, "https://raw.githubusercontent.com/$1/$2");
				}

				rawCode = (await axios.get(url)).data;
				if (domain == "savetext.net") {
					const $ = cheerio.load(rawCode);
					rawCode = $("#content").text();
				}
			}
			else {
				if (args[args.length - 1].endsWith(".js")) {
					fileName = args[args.length - 1];
					rawCode = event.body.slice(event.body.indexOf('install') + 7, event.body.indexOf(fileName) - 1);
				}
				else if (args[1].endsWith(".js")) {
					fileName = args[1];
					rawCode = event.body.slice(event.body.indexOf(fileName) + fileName.length + 1);
				}
				else return message.reply(getLang("missingFileNameInstall"));
			}

			if (!rawCode) return message.reply(getLang("invalidUrlOrCode"));

			if (fs.existsSync(path.join(__dirname, fileName))) {
				return message.reply(getLang("alreadExist"), (err, info) => {
					global.GoatBot.onReaction.set(info.messageID, {
						commandName, messageID: info.messageID, type: "install", author: event.senderID, data: { fileName, rawCode }
					});
				});
			} else {
				const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
				if (infoLoad.status == "success") {
					const imagePath = await generateCmdCanvas(senderID, senderName, "📥 NET INSTALLATION", `✓ Setup [${infoLoad.name}] Done`, `Saved locally into system cluster`, "#72efdd");
					message.reply({ body: getLang("installed", infoLoad.name, path.join(__dirname, fileName).replace(process.cwd(), "")), attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
				} else {
					const imagePath = await generateCmdCanvas(senderID, senderName, "❌ INSTALL ERROR", "Compilation process crashed", infoLoad.error.message, "#f72585");
					message.reply({ body: getLang("installedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message), attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
				}
			}
		}
		else message.SyntaxError();
	},

	onReaction: async function ({ Reaction, message, event, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang }) {
		const { author, data: { fileName, rawCode } } = Reaction;
		if (event.userID != author) return;
		
		const senderName = await usersData.getName(author);
		const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
		
		if (infoLoad.status == "success") {
			const imagePath = await generateCmdCanvas(author, senderName, "📝 OVERWRITE SUCCESS", `✓ Overwrote [${infoLoad.name}]`, "Old memory fragments deleted", "#72efdd");
			message.reply({ body: getLang("installed", infoLoad.name, path.join(__dirname, fileName).replace(process.cwd(), "")), attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
		} else {
			const imagePath = await generateCmdCanvas(author, senderName, "❌ OVERWRITE ERROR", "Failed to force rewrite injection", infoLoad.error.message, "#f72585");
			message.reply({ body: getLang("installedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message), attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
		}
	}
};

// ==========================================================
// ⚙️ FONCTIONS INTERNES RE-INDEXÉES (OBFUSCATION / COMPILATION)
// ==========================================================
const packageAlready = [];
const spinner = "\\|/-";
let count = 0;

function loadScripts(folder, fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode) {
	const storageCommandFilesPath = global.GoatBot[folder == "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"];

	try {
		if (rawCode) {
			fileName = fileName.slice(0, -3);
			fs.writeFileSync(path.normalize(`${process.cwd()}/scripts/${folder}/${fileName}.js`), rawCode);
		}
		const regExpCheckPackage = /require(\s+|)\((\s+|)[`'"]([^`'"]+)[`'"]/g;
		const { GoatBot } = global;
		const { onFirstChat: allOnFirstChat, onChat: allOnChat, onEvent: allOnEvent, onAnyEvent: allOnAnyEvent } = GoatBot;
		let setMap, typeEnvCommand, commandType;
		if (folder == "cmds") {
			typeEnvCommand = "envCommands";
			setMap = "commands";
			commandType = "command";
		}
		else if (folder == "events") {
			typeEnvCommand = "envEvents";
			setMap = "eventCommands";
			commandType = "event command";
		}
		
		let pathCommand;
		if (process.env.NODE_ENV == "development") {
			const devPath = path.normalize(process.cwd() + `/scripts/${folder}/${fileName}.dev.js`);
			if (fs.existsSync(devPath)) pathCommand = devPath;
			else pathCommand = path.normalize(process.cwd() + `/scripts/${folder}/${fileName}.js`);
		}
		else pathCommand = path.normalize(process.cwd() + `/scripts/${folder}/${fileName}.js`);

		const contentFile = fs.readFileSync(pathCommand, "utf8");
		let allPackage = contentFile.match(regExpCheckPackage);
		if (allPackage) {
			allPackage = allPackage
				.map(p => p.match(/[`'"]([^`'"]+)[`'"]/)[1])
				.filter(p => p.indexOf("/") !== 0 && p.indexOf("./") !== 0 && p.indexOf("../") !== 0 && p.indexOf(__dirname) !== 0);
			for (let packageName of allPackage) {
				if (packageName.startsWith('@')) packageName = packageName.split('/').slice(0, 2).join('/');
				else packageName = packageName.split('/')[0];

				if (!packageAlready.includes(packageName)) {
					packageAlready.push(packageName);
					if (!fs.existsSync(`${process.cwd()}/node_modules/${packageName}`)) {
						let wating;
						try {
							wating = setInterval(() => {
								count++;
								loading.info("PACKAGE", `Installing ${packageName} ${spinner[count % spinner.length]}`);
							}, 80);
							execSync(`npm install ${packageName} --save`, { stdio: "pipe" });
							clearInterval(wating);
						}
						catch (error) {
							clearInterval(wating);
							throw new Error(`Can't install package ${packageName}`);
						}
					}
				}
			}
		}

		const oldCommand = require(pathCommand);
		const oldCommandName = oldCommand?.config?.name;
		if (!oldCommandName) {
			if (GoatBot[setMap].get(oldCommandName)?.location != pathCommand)
				throw new Error(`${commandType} name "${oldCommandName}" is already exist in command "${removeHomeDir(GoatBot[setMap].get(oldCommandName)?.location || "")}"`);
		}
		if (oldCommand.config.aliases) {
			let oldAliases = oldCommand.config.aliases;
			if (typeof oldAliases == "string") oldAliases = [oldAliases];
			for (const alias of oldAliases) GoatBot.aliases.delete(alias);
		}
		delete require.cache[require.resolve(pathCommand)];

		const command = require(pathCommand);
		command.location = pathCommand;
		const configCommand = command.config;
		if (!configCommand || typeof configCommand != "object") throw new Error("config of command must be an object");
		const scriptName = configCommand.name;

		const indexOnChat = allOnChat.findIndex(item => item == oldCommandName);
		if (indexOnChat != -1) allOnChat.splice(indexOnChat, 1);

		const indexOnFirstChat = allOnChat.findIndex(item => item == oldCommandName);
		let oldOnFirstChat;
		if (indexOnFirstChat != -1) {
			oldOnFirstChat = allOnFirstChat[indexOnFirstChat];
			allOnFirstChat.splice(indexOnFirstChat, 1);
		}

		const indexOnEvent = allOnEvent.findIndex(item => item == oldCommandName);
		if (indexOnEvent != -1) allOnEvent.splice(indexOnEvent, 1);

		const indexOnAnyEvent = allOnAnyEvent.findIndex(item => item == oldCommandName);
		if (indexOnAnyEvent != -1) allOnAnyEvent.splice(indexOnAnyEvent, 1);

		if (command.onLoad) command.onLoad({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData });

		const { envGlobal, envConfig } = configCommand;
		if (!command.onStart) throw new Error('Function onStart is missing!');
		if (typeof command.onStart != "function") throw new Error('Function onStart must be a function!');
		if (!scriptName) throw new Error('Name of command is missing!');

		if (configCommand.aliases) {
			let { aliases } = configCommand;
			if (typeof aliases == "string") aliases = [aliases];
			for (const alias of aliases) {
				if (aliases.filter(item => item == alias).length > 1) throw new Error(`alias "${alias}" duplicate in ${commandType} "${scriptName}"`);
				if (GoatBot.aliases.has(alias)) throw new Error(`alias "${alias}" is already exist`);
				GoatBot.aliases.set(alias, scriptName);
			}
		}

		if (envGlobal) {
			if (typeof envGlobal != "object" || Array.isArray(envGlobal)) throw new Error("envGlobal must be an object");
			for (const key in envGlobal) configCommands.envGlobal[key] = envGlobal[key];
		}
		if (envConfig && typeof envConfig == "object" && !Array.isArray(envConfig)) {
			if (!configCommands[typeEnvCommand][scriptName]) configCommands[typeEnvCommand][scriptName] = {};
			configCommands[typeEnvCommand][scriptName] = envConfig;
		}

		GoatBot[setMap].delete(oldCommandName);
		GoatBot[setMap].set(scriptName, command);
		fs.writeFileSync(client.dirConfigCommands, JSON.stringify(configCommands, null, 2));

		const keyUnloadCommand = folder == "cmds" ? "commandUnload" : "commandEventUnload";
		const findIndex = (configCommands[keyUnloadCommand] || []).indexOf(`${fileName}.js`);
		if (findIndex != -1) configCommands[keyUnloadCommand].splice(findIndex, 1);
		fs.writeFileSync(client.dirConfigCommands, JSON.stringify(configCommands, null, 2));

		if (command.onChat) allOnChat.push(scriptName);
		if (command.onFirstChat) allOnFirstChat.push({ commandName: scriptName, threadIDsChattedFirstTime: oldOnFirstChat?.threadIDsChattedFirstTime || [] });
		if (command.onEvent) allOnEvent.push(scriptName);
		if (command.onAnyEvent) allOnAnyEvent.push(scriptName);

		const indexStorageCommandFilesPath = storageCommandFilesPath.findIndex(item => item.filePath == pathCommand);
		if (indexStorageCommandFilesPath != -1) storageCommandFilesPath.splice(indexStorageCommandFilesPath, 1);
		storageCommandFilesPath.push({
			filePath: pathCommand,
			commandName: [scriptName, ...configCommand.aliases || []]
		});

		return { status: "success", name: fileName, command };
	}
	catch (err) {
		const defaultError = new Error();
		defaultError.name = err.name;
		defaultError.message = err.message;
		defaultError.stack = err.stack;
		return { status: "failed", name: fileName, error: err, errorWithThoutRemoveHomeDir: defaultError };
	}
}

function unloadScripts(folder, fileName, configCommands, getLang) {
	const pathCommand = `${process.cwd()}/scripts/${folder}/${fileName}.js`;
	if (!fs.existsSync(pathCommand)) {
		const err = new Error(getLang("missingFile", `${fileName}.js`));
		err.name = "FileNotFound";
		throw err;
	}
	const command = require(pathCommand);
	const commandName = command.config?.name;
	if (!commandName) throw new Error(getLang("invalidFileName", `${fileName}.js`));
	
	const { GoatBot } = global;
	const { onChat: allOnChat, onEvent: allOnEvent, onAnyEvent: allOnAnyEvent } = GoatBot;
	
	const indexOnChat = allOnChat.findIndex(item => item == commandName);
	if (indexOnChat != -1) allOnChat.splice(indexOnChat, 1);
	const indexOnEvent = allOnEvent.findIndex(item => item == commandName);
	if (indexOnEvent != -1) allOnEvent.splice(indexOnEvent, 1);
	const indexOnAnyEvent = allOnAnyEvent.findIndex(item => item == commandName);
	if (indexOnAnyEvent != -1) allOnAnyEvent.splice(indexOnAnyEvent, 1);

	if (command.config.aliases) {
		let aliases = command.config?.aliases || [];
		if (typeof aliases == "string") aliases = [aliases];
		for (const alias of aliases) GoatBot.aliases.delete(alias);
	}
	const setMap = folder == "cmds" ? "commands" : "eventCommands";
	delete require.cache[require.resolve(pathCommand)];
	GoatBot[setMap].delete(commandName);

	const commandUnload = configCommands[folder == "cmds" ? "commandUnload" : "commandEventUnload"] || [];
	if (!commandUnload.includes(`${fileName}.js`)) commandUnload.push(`${fileName}.js`);
	configCommands[folder == "cmds" ? "commandUnload" : "commandEventUnload"] = commandUnload;
	fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
	return { status: "success", name: fileName };
}

global.utils.loadScripts = loadScripts;
global.utils.unloadScripts = unloadScripts;
