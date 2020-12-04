const Config = require("./config.json"),
	Emojis = require("../Utils/emojis.json"),
	path = require("path"),
	{ inspect } = require("util");

module.exports = {
	
	async sendWarning (m, author) {
		m.edit(`${Emojis.warning.yellow} Are you sure you want to do this?\n\nRespond with: \`yes\`, \`y\`, \`no\`, \`n\`.`);

		let response = await m.channel.awaitMessages(m => m.author.id === author.id, { maxMatches: 1, time: 25000});
		if (!response.length || !/^(?:yes\b|no|y|n\b)/i.test(response[0].content)) return m.edit(`${Emojis.x} Cancelled operation.`);
		if (/^(?:n\b|no\b)/i.test(response[0].content)) return false;
		response[0].delete();
		return true;
	},

	createHelpEmbed (cmd, content = null) {
		let usage,
			argStrings = [],
			fields = [];

		if (cmd.commands.length > 1) {
			fields.push({
				name: "Aliases",
				value: `${cmd.commands.slice(1).join(", ")}`
			});
		}

		if (cmd.args) {
			let strings = [];
			cmd.args.forEach(arg => strings.push(`**${arg.name}** - ${arg.description} - (${arg.optional ? "Optional" : "Required"})`));
			fields.push({
				name: "Arguments",
				value: `${strings.join("\n")}`
			});
		}

		if (cmd.args) {
			cmd.args.forEach(arg => {
				if (arg.optional) argStrings.push(`[${arg.name}]`);
				else argStrings.push(`<${arg.name}>`);
			});
		}

		argStrings.length > 0 ? usage = `${cmd.commands[0]} ${argStrings.join(" ")}` : usage = `${cmd.commands[0]}`;

		fields.push({
			name: "Usage",
			value: `\`${usage}\``
		});

		if (cmd.example) {
			fields.push({
				name: "Example",
				value: `\`${cmd.example}\``
			});
		}

		if (cmd.subcommands) {
			let args = {};
			cmd.subcommands.forEach(subcmd => {
				if (subcmd.args) {
					subcmd.args.forEach(arg => {
						if (arg.optional) {
							if (args[subcmd.name]) args[subcmd.name].push(`[${arg.name}]`);
							else args[subcmd.name] = [`[${arg.name}]`];
						} else {
							if (args[subcmd.name]) args[subcmd.name].push(`<${arg.name}>`);
							else args[subcmd.name] = [`<${arg.name}>`];
						}
					});
				}
			});
			let mapped = cmd.subcommands.map(subcmd => `${cmd.commands[0]} ${subcmd.name} ${args && args[subcmd.name] ? `${args[subcmd.name].join(" ")} -` : "-"} ${subcmd.description}`);
			fields.push({
				name: "Subcommands",
				value: `\`${mapped.join("\n")}\``
			});
		}

		let obj = {
			embed: {
				author: {
					name: `Help for the ${cmd.commands[0]} command`
				},
				description: `**${cmd.description}**`,
				color: Config.colors.embedColor,
				fields
			}
		};

		if (content) obj.content = content;
		return obj;
	},

	getAttachments (msg) {
		const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"],
			linkFileReg = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/,
			embed = msg.embeds.find(e => e.type === "rich" && e.image && extensions.includes(path.extname(e.image.url))),
			attachment = msg.attachments.find(file => extensions.includes(path.extname(file.url))),
			linkMatch = msg.content.match(linkFileReg);

		if (embed) return embed.image.url;
		if (attachment) return attachment.url;
		if (linkMatch && extensions.includes(path.extname(linkMatch[0]))) return linkMatch[0];
		return null;
	},

	findMember (server, user) {
		if (!server || !user) return undefined;
		if (/^\d+$/.test(user)) return server.members.get(user); // ID 
		else if (/^<@!?\d+>$/.test(user)) return server.members.get(user.match(/\d+/)[0]); // Mention
		else if (/^\w+#\d{4}$/.test(user)) return server.members.find((m) => m.user.username.toLowerCase() === user.toLowerCase().match(/^\w+/)[0] && m.user.discriminator === String(user.match(/\d{4}/)[0])); // username and discrim
		else if (server.members.find((m) => m.user.username.toLowerCase() === user.toLowerCase())) return server.members.find((m) => m.user.username.toLowerCase() === user.toLowerCase()); // username
		return server.members.find((m) => m.nick && m.nick.toLowerCase() === user.toLowerCase()); //nickname
	},

	findUser (bot, user) {
		if (!user) return undefined;
		if (/^\d+$/.test(user)) return bot.users.get(user); // ID 
		else if (/^<@!?\d+>$/.test(user)) return bot.users.get(user.match(/\d+/)[0]); // Mention
		else if (/^\w+#\d{4}$/.test(user)) return bot.users.find((m) => m.username.toLowerCase() === user.toLowerCase().match(/^\w+/)[0] && m.discriminator === String(user.match(/\d{4}/)[0])); // username and discrim
		else if (bot.users.find((m) => m.username.toLowerCase() === user.toLowerCase())) return bot.users.find((m) => m.username.toLowerCase() === user.toLowerCase()); // username
	},

	findBanned (bans, user) {
		if (!user) return undefined;
		if (/^\d+$/.test(user)) return bans.find(b => b && b.user.id === user).user; // ID
		else if (/^\w+#\d{4}$/.test(user)) return bans.find(b => b.user.username.toLowerCase() === user.toLowerCase().match(/^\w+/)[0] && b.user.discriminator === String(user.match(/\d{4}/)[0])).user; // username and discrim
		else if (bans.find(b => b.user.username.toLowerCase() === user.toLowerCase())) return bans.find(b => b.user.username.toLowerCase() === user.toLowerCase()).user; // username
	},

	findRole (server, role) {
		if (!server || !role) return undefined;
		if (/^\d+$/.test(role)) return server.roles.get(role); // ID 
		else if (/^<@&\d+>$/.test(role)) return server.roles.get(role.match(/\d+/)[0]); // Mention
		return server.roles.find((r) => r.name.toLowerCase() === role.toLowerCase()); // name
	},

	findChannel (server, channel) {
		if (!server || !channel) return undefined;
		if (/^\d+$/.test(channel)) return server.channels.get(channel); // ID 
		else if (/^<#\d+>$/.test(channel)) return server.channels.get(channel.match(/\d+/)[0]); // Mention
		return server.channels.find((r) => r.name.toLowerCase() === channel.toLowerCase()); // name
	},

	isDeveloper (user) {
		return (Config.developers.includes(user.id));
	},

	calculate_age (dob) {
		let d = new Date(dob);
		let diff_ms = Date.now() - d.getTime();
		let age_dt = new Date(diff_ms); 
		return Math.abs(age_dt.getUTCFullYear() - 1970);
	},

	clean (text) {
		if (typeof text !== "string") text = inspect(text, { depth: 0 });
		text = text
			.replace(/`/g, "'" + String.fromCharCode(8203))
			.replace(/"/g, "\"" + String.fromCharCode(8203))
			.replace(/@/g, "@" + String.fromCharCode(8203))
			.replace(Config.token, "[REDACTED]");
		return text;
	},
};