const { defaultPrefix, colors } = require("../../Utils/config.json"),
	Utils = require("../../Utils/util"),
	Log = require("./log"),
	Emojis = require("../../Utils/emojis.json");

module.exports = async (bot, msg) => {
	if (msg.author.bot) return;

	await Log.automod(bot, msg);

	let mentionPrefix = msg.content.match(new RegExp(`<@!?${bot.user.id}> `, "g")),
		prefix = defaultPrefix,
		neededClientPerms = [];

	if (!msg.content.startsWith(prefix) && mentionPrefix && msg.content.startsWith(mentionPrefix[0])) {
		prefix = `${mentionPrefix[0]}`;
		if (msg.mentions.length > 1) msg.mentions = msg.mentions.slice(1);
		if (msg.mentions.length === 1 && msg.mentions[0] === bot && mentionPrefix.length === 1) msg.mentions = msg.mentions.slice(1);
	}

	if (!msg.content.startsWith(prefix)) return;

	let command = bot.commands[Object.keys(bot.commands).filter((c) => bot.commands[c].commands.indexOf(msg.content.toLowerCase().replace(prefix.toLowerCase(), "").split(" ")[0]) > -1)[0]],
		args = ((msg.content.replace(prefix, "").trim().split(/ +/g).length > 1) ? msg.content.replace(prefix, "").trim().split(/ +/g).slice(1) : []);
	
	if (!command || (command.devOnly || command.category === "Moderation") && !Utils.isDeveloper(msg.author)) return;	
	if (msg.channel.type !== 0 && !command.dmEnabled) return msg.channel.createMessage(`${Emojis.x} You can only run this command in servers!`);

	if (msg.channel.type === 0) {
		command.clientPerms ? command.clientPerms.forEach(cp => !msg.channel.permissionsOf(bot.user.id).has(cp) ? neededClientPerms.push(cp) : null ) : null;

		if (command.subcommands && args[0]) {
			let subcommand = command.subcommands.find(subcmd => subcmd.name.toLowerCase() === args[0].toLowerCase());
			if (subcommand && subcommand.clientPerms) {
				subcommand.clientPerms.forEach(cp => {
					if (!msg.channel.permissionsOf(bot.user.id).has(cp)) neededClientPerms.push(cp);
				});
			}
		}
	}

	if (neededClientPerms.length > 0) return msg.channel.createMessage(`${Emojis.x} I need more permissions to run this command. Permissions needed: \`${neededClientPerms.join(", ")}\`\n\nYou can either enable it globally in server settings, or enable it channel-only by giving it the \`${neededClientPerms.join(" ")}\` permissions in channel settings.`);
	if (command.args && args.length < command.args.filter(a => !a.optional).length) return msg.channel.createMessage(Utils.createHelpEmbed(command, "It looks like you do not have enough arguments!"));
	if (command.subcommands && args[0]) {
		for (let i = 0; i < command.subcommands.length; i++) {
			let subcommand = command.subcommands[i];
			if (args[0].toLowerCase() === subcommand.name.toLowerCase()) {
				if (subcommand.args && args.length - 1 < subcommand.args.filter(a => !a.optional).length) {
					msg.channel.createMessage(Utils.createHelpEmbed(command, `${Emojis.warning.yellow} It looks like you do not have enough arguments!`));
					return;
				}
			}
		}
	}

	try {
		console.log(`Command: ${command.commands[0]} ${msg.channel.type === 0 ? `| ${msg.guild.name} (${msg.channel.id})` : ""} | ${msg.author.id}`);
		await command.execute(bot, msg, args);
	} catch (e) {
		msg.channel.createMessage({
			embed: {
				author: {
					name: "Command Error"
				},
				color: colors.red,
				fields: [{
					name: "Error",
					value: `\`\`\`x1\n${e}\n\`\`\``
				},
				{
					name: "What do I do?",
					value: "Report the error to an admin if you cannot solve this"
				}
				]
			}
		});
		console.error(e);
	}
};