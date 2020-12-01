const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ findMember } = require("../../Utils/util"),
	{ roles } = require("../../Utils/config.json"),
	{ search } = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: ["mute"],
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
		let user = await search(bot, args[0], msg),
			member,
			reason,
			time,
			m;

		if (!user) return msg.channel.createMessage(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		member = findMember(msg.guild, user.id);
		if (member.roles.includes(roles.muted)) return msg.channel.createMessage(`${Emojis.x} That user is already muted!`);

		m = await msg.channel.createMessage(`${Emojis.warning.yellow} What do you want the reason to be?`);

		reason = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
		if (!reason.length || /cancel/gi.test(reason[0].content)) return m.edit(`${Emojis.warning.red} Cancelled.`);
		m.edit(`${Emojis.warning.yellow} Muting user.`);

		try {
			await msg.guild.addMemberRole(member.id, roles.muted);
			time = args[1] ? time = args[1] : time = null;
			await log.add(bot, member, msg.member, "mute", time, reason[0].content);
		} catch (e) {
			msg.channel.createMessage(`${Emojis.warning.red} An error occured while trying to mute ${member.username}`);
			throw new Error(e);
		}
		m.edit(`${Emojis.tick} Successfully muted ${member.tag}.`);
	}
};