const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ search } = require("../../Internals/handlers/profileHandler"),
	{ colors, name } = require("../../Utils/config.json"),
	{ sendWarning, findMember } = require("../../Utils/util");

module.exports = {
	commands: [
		"warn",
		"wn"
	],
	example: "warn abdoul Get rekt lol",
	description: "Warn a user",
	args: [
		{
			name: "user",
			description: "The user to warn"
		}, {
			name: "reason",
			description: "The reason for warning the user",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await search(bot, args[0], msg.author, m),
			reason = args[1] ? args.slice(1).join(" ") : null,
			member,
			warning;

		if (!user) return m.edit(`${Emojis.x} That user does not have a profile!`);

		member = findMember(msg.guild, user.id);
		if (member.id === msg.author.id) return m.edit(`${Emojis.x} You can't kick yourself, silly!`);
		if (!member.punishable(msg.author) || user.id === bot.user.id) return m.edit(`${Emojis.x} You can't kick that user!`);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.loading} Warning user...`);

			user.createMessage({
				embed: {
					title: "You have been warned",
					description: `You have been warned in ${name}.`,
					fields: [
						{
							name: "Moderator",
							value: msg.member.tag
						}, {
							name: "Reason",
							value: reason ? reason : "No reason provided."
						}
					],
					color: colors.warn
				}
			});
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred. A case has still been created.`);
			throw new Error(e);
		}

		await log.add(bot, member, msg.member, "warn", null, reason);
		m.edit(`${Emojis.tick} Successfully warned \`${user.tag}\` for \`${reason}\``);
	}
};