const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ findMember, sendWarning } = require("../../Utils/util"),
	Profile = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: [
		"kick",
		"k"
	],
	example: "kick abdoul Get Rekt",
	description: "kick a user",
	args: [
		{
			name: "user",
			description: "The user you're muting"
		}, {
			name: "reason",
			description: "The reason for kicking",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await Profile.search(bot, args[0], msg.author, m),
			reason = args[1] ? args.slice(1).join(" ") : null,
			warning,
			member;

		if (!user) return m.edit(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		member = findMember(msg.guild, user.id);
		if (member.id === msg.author.id) return m.edit(`${Emojis.x} You can't kick yourself, silly!`);
		if (!member.kickable) return m.edit(`${Emojis.x} I can't kick that user!`);
		if (!member.punishable(msg.author) || user.id === bot.user.id) return m.edit(`${Emojis.x} You can't kick that user!`);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.loading} Kicking user...`);

			await log.add(bot, member, msg.member, "kick", null, reason);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Successfully kicked \`${member.tag}\` for \`${reason}.\``);
	}
};