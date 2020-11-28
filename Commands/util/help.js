const { isDeveloper, createHelpEmbed } = require("../../Utils/util");
const { colors, defaultPrefix, name } = require("../../Utils/config.json");
const emojis = require("../../Utils/emojis.json");

module.exports = {
	commands: ["help"],
	description: "Get command help.",
	example: "command avatar",
	args: [
		{
			name: "command|category",
			description: "The command or category. Use `all` for a list of all commands",
			optional: true
		}
	],
	hidden: false,
	clientPerms: ["embedLinks"],
	execute: (bot, msg, args) => {
		let helpFor = args.join(" ");
		let isDev = isDeveloper(msg.author);
		let commands = Object.keys(bot.commands);
		if (!isDev) {
			let arr = [];
			commands.forEach(c => {
				let command = bot.commands[c];
				if (!command.devOnly || !command.hidden) arr.push(c);
			});
			commands = arr;
		}
		if (!helpFor) {
			let fields = [];
			commands.forEach(c => {
				let field = fields.find(f => f.name === bot.commands[c].category);
				if (field)
					fields[fields.indexOf(field)].value += `,\`${bot.commands[c].commands[0]}\``;
				else {
					fields[fields.length] = {
						name: bot.commands[c].category,
						value: `\`${bot.commands[c].commands[0]}\``
					};
				}
			});

			fields.sort((a, b) => {
				if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
				else if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
				return 0;
			});

			msg.channel.createMessage({
				embed: {
					color: colors.winered,
					description: `You can view more help/info on a command using \`${defaultPrefix}help [command]\`.`,
					author: {
						name: `${name}'s Commands`,
						icon_url: bot.user.avatarURL
					},
					fields,
					footer: {
						text: `Requested by ${msg.author.username}`,
					},
					timestamp: new Date()
				}
			});
		} else {
			let command = commands.find(c => bot.commands[c].commands[0].toLowerCase() === helpFor.toLowerCase());
			if (!command)
				return msg.channel.createMessage(`${emojis.x} The ${helpFor} command or category does not exist.`);

			msg.channel.createMessage(createHelpEmbed(bot.commands[command]));
		}
	}
};