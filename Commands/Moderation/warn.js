const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ fetch, search } = require("../../Internals/handlers/profileHandler"),
	{ colors } = require("../../Utils/config.json");

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
			description: "The reason for warning the user"
		}
	],
	execute: async (bot, msg, args) => {
		const user = await search(bot, args[0], msg),
			data = await fetch(bot, user),
			reason = args[1] ? args.slice(1).join(" ") : null;

		if (!data) return msg.channel.createMessage(`${Emojis.x} That user does not have a profile!`);

		try {
			user.createMessage({
				embed: {
					title: "You have been warned",
					description: "You have been warned in sphinx.",
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
			msg.channel.createMessage(`${Emojis.warning.yellow} I could not DM \`${data.name}\`, but I will still create a case.`);
		}
		await log.add(bot, user, msg.member, "warn", null, reason);
		msg.channel.createMessage(`${Emojis.tick} I have successfully warned \`${data.name}\` for \`${reason}\``);
	}
};