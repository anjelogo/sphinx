const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	Roles = require("../../Utils/roles.json"),
	{ findMember, sendWarning } = require("../../Utils/util"),
	{ search } = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: [
		"mute",
		"m"
	],
	example: "mute abdoul",
	description: "Mute a user",
	args: [
		{
			name: "user",
			description: "The user you're muting"
		}, {
			name: "time",
			description: "The time they're going to be muted for",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await search(bot, args[0], msg.author, m),
			time = args[1] ? args[1] : null,
			warning,
			member,
			reason;

		if (!user) return m.edit(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		member = findMember(msg.guild, user.id);
		if (member.roles.includes(Roles.util.muted)) return m.edit(`${Emojis.x} That user is already muted!`);
		if (member.id === msg.author.id) return m.edit(`${Emojis.x} You can't mute yourself, silly!`);
		if (!member.punishable(msg.member) || user.id === bot.user.id) return m.edit(`${Emojis.x} You can't mute that user!`);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.warning.yellow} What do you want the reason to be?`);

			reason = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
			if (!reason.length || /cancel/gi.test(reason[0].content)) return m.edit(`${Emojis.warning.red} Cancelled.`);
			m.edit(`${Emojis.loading} Muting user...`);
			reason = reason[0].content;

			await log.add(bot, member, msg.member, "mute", time, reason);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Successfully muted \`${member.tag}\`${reason ? ` for \`${reason}\`` : ""}.`);
	}
};