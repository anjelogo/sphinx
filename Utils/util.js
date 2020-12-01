const Config = require("./config.json");
const path = require("path");
const { inspect } = require("util");
const log = require("../Internals/handlers/log");

module.exports = {
	createHelpEmbed(cmd, content = null) {
		let fields = [];
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

		let usage;
		let argStrings = [];
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

	getAttachments(msg) {
		const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
		const linkFileReg = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;
		let embed = msg.embeds.find(e => e.type === "rich" && e.image && extensions.includes(path.extname(e.image.url)));
		if (embed) return embed.image.url;
		let attachment = msg.attachments.find(file => extensions.includes(path.extname(file.url)));
		if (attachment) return attachment.url;
		let linkMatch = msg.content.match(linkFileReg);
		if (linkMatch && extensions.includes(path.extname(linkMatch[0]))) return linkMatch[0];
		return null;
	},

	async mute(bot, user, moderator, time, reason) {
		const guild = bot.guilds.get(Config.guildID);

		await log.add(bot, user, moderator, "mute", time, reason);
		return guild.addMemberRole(user.id, Config.roles.muted);
	},

	async unmute(bot, user, moderator, reason) {
		const guild = bot.guilds.get(Config.guildID);

		let Cases = await log.get(bot, "user", user);
		if (!Cases) return;
		let muteCases = Cases.filter(c => c.action === "mute"),
			caseNum = muteCases[muteCases.length - 1].caseNum;

		await log.resolve(bot, caseNum, reason, moderator);
		return guild.removeMemberRole(user.id, Config.roles.muted);
	},

	findMember(server, user) {
		if (!server || !user) return undefined;
		if (/^\d+$/.test(user)) return server.members.get(user); // ID 
		else if (/^<@!?\d+>$/.test(user)) return server.members.get(user.match(/\d+/)[0]); // Mention
		else if (/^\w+#\d{4}$/.test(user)) return server.members.find((m) => m.user.username.toLowerCase() === user.toLowerCase().match(/^\w+/)[0] && m.user.discriminator === String(user.match(/\d{4}/)[0])); // username and discrim
		else if (server.members.find((m) => m.user.username.toLowerCase() === user.toLowerCase())) return server.members.find((m) => m.user.username.toLowerCase() === user.toLowerCase()); // username
		return server.members.find((m) => m.nick && m.nick.toLowerCase() === user.toLowerCase()); //nickname
	},

	findUser(bot, user) {
		if (!user) return undefined;
		if (/^\d+$/.test(user)) return bot.users.get(user); // ID 
		else if (/^<@!?\d+>$/.test(user)) return bot.users.get(user.match(/\d+/)[0]); // Mention
		else if (/^\w+#\d{4}$/.test(user)) return bot.users.find((m) => m.username.toLowerCase() === user.toLowerCase().match(/^\w+/)[0] && m.discriminator === String(user.match(/\d{4}/)[0])); // username and discrim
		else if (bot.users.find((m) => m.username.toLowerCase() === user.toLowerCase())) return bot.users.find((m) => m.username.toLowerCase() === user.toLowerCase()); // username
	},

	findRole(server, role) {
		if (!server || !role) return undefined;
		if (/^\d+$/.test(role)) return server.roles.get(role); // ID 
		else if (/^<@&\d+>$/.test(role)) return server.roles.get(role.match(/\d+/)[0]); // Mention
		return server.roles.find((r) => r.name.toLowerCase() === role.toLowerCase()); // name
	},

	findChannel(server, channel) {
		if (!server || !channel) return undefined;
		if (/^\d+$/.test(channel)) return server.channels.get(channel); // ID 
		else if (/^<#\d+>$/.test(channel)) return server.channels.get(channel.match(/\d+/)[0]); // Mention
		return server.channels.find((r) => r.name.toLowerCase() === channel.toLowerCase()); // name
	},

	isDeveloper(user) {
		return (Config.developers && Config.developers.includes(user.id));
	},

	calculate_age(dob) {
		let d = new Date(dob);
		let diff_ms = Date.now() - d.getTime();
		let age_dt = new Date(diff_ms); 
		return Math.abs(age_dt.getUTCFullYear() - 1970);
	},

	clean(text) {
		if (typeof text !== "string") text = inspect(text, { depth: 0 });
		text = text
			.replace(/`/g, "'" + String.fromCharCode(8203))
			.replace(/"/g, "\"" + String.fromCharCode(8203))
			.replace(/@/g, "@" + String.fromCharCode(8203))
			.replace(Config.token, "[REDACTED]");
		return text;
	},
};