const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ search } = require("../../Internals/handlers/profileHandler"),
	{ colors, name } = require("../../Utils/config.json"),
	{ sendWarning } = require("../../Utils/util");

module.exports = {
	commands: ["warn"],
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
			warning;

		if (!user) return m.edit(`${Emojis.x} That user does not have a profile!`);

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
							value: reason ? reason : null
						}
					],
					color: colors.warn
				}
			});
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred. A case has still been created.`);
			throw new Error(e);
		}

		await log.add(bot, user, msg.member, "warn", null, reason);
		m.edit(`${Emojis.tick} I have successfully warned \`${user.tag}\` for \`${reason}\``);
	}
};