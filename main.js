const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Eris = require("eris-additions")(require("eris"));
const m = require("monk")(require("./Utils/auth.json").url);
const bot = new Eris(require("./Utils/auth.json").token, {
	getAllUsers: true,
	defaultImageFormat: "png",
	defaultImageSize: 1024,
	intents: 32767
});

bot.userMap = new Map();
bot.commands = [];
bot.m = m;

const init = async () => {
	const commands = await readdir("./Commands", { withFileTypes: true });
	const events = await readdir("./Events", { withFileTypes: true });

	commands.forEach(async c => {
		if (c.isDirectory()) {
			const cat = c.name;
			const cmdFiles = await readdir(`./Commands/${cat}`);
			cmdFiles.forEach(f => {
				if (!f.endsWith(".js")) return;
				bot.commands[f.replace(/\..*/g, "")] = require(`./Commands/${cat}/${f}`);
				bot.commands[f.replace(/\..*/g, "")].category = cat.replace(/^\w/, c => c.toUpperCase());
			});
		} else {
			if (!c.name.endsWith(".js")) return;
			bot.commands[c.name.replace(/\..*/g, "")] = require(`./Commands/${c.name}`);
			bot.commands[c.name.replace(/\..*/g, "")].category = "Uncategorized";
		}
	});
	events.forEach(async e => {
		if (e.isDirectory()) {
			const cat = e.name;
			const evts = await readdir(`./Events/${cat}`);
			evts.forEach(f => {
				if (!f.endsWith(".js")) return;
				const event = require(`./Events/${cat}/${f}`);
				event(bot);
			});
		} else {
			if (!e.name.endsWith(".js")) return;
			const event = require(`./Events/${e.name}`);
			event(bot);
		}
	});

	await bot.connect();
};

init();