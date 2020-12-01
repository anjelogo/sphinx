const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ findMember } = require("../../Utils/util"),
	Profile = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: ["ban"],
	example: "ban abdoul",
	description: "Ban a user",
	args: [
		{
			name: "user",
			description: "The user you're muting"
		}, {
			name: "time",
			description: "The time they're going to be banned for",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let user = await Profile.search(bot, args[0], msg),
			member,
			reason,
			time,
			m;

		if (!user) return msg.channel.createMessage(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		member = findMember(msg.guild, user.id);

		m = await msg.channel.createMessage(`${Emojis.warning.yellow} What do you want the reason to be?`);

		reason = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
		if (!reason.length || /cancel/gi.test(reason[0].content)) return m.edit(`${Emojis.warning.red} Cancelled.`);
		m.edit(`${Emojis.warning.yellow} Banning user.`);

		try {
			setTimeout(async () => {
				await msg.guild.banMember(member.id, 0, reason[0].content);
				time = args[1] ? time = args[1] : time = null;
				await log.add(bot, member, msg.member, "ban", time, reason[0].content);
				await Profile.delete(bot, user);
			});
		} catch (e) {
			msg.channel.createMessage(`${Emojis.warning.red} An error occured while trying to ban ${member.username}`);
			throw new Error(e);
		}
		m.edit(`${Emojis.tick} Successfully banned ${member.tag}.`);
	}
};