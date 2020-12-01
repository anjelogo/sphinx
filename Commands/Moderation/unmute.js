const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ search } = require("../../Internals/handlers/profileHandler"),
	{ findMember } = require("../../Utils/util"),
	{ roles } = require("../../Utils/config.json");

module.exports = {
	commands: ["unmute"],
	example: "unmute abdoul I want to hear your crying again",
	description: "Unmute a user that's been muted",
	args: [
		{
			name: "user",
			description: "The user you're unmuting"
		}
	],
	execute: async (bot, msg, args) => {
		let user = await search(bot, args[0], msg),
			caseNum,
			reason,	
			member,
			cases,
			m;
		
		if (!user) return msg.channel.createMessage(`${Emojis.x} I couldn't find a user named \`${args[0]}\``);

		member = findMember(msg.guild, user.id);
		cases = await log.get(bot, "user", member);
		caseNum = cases.filter(c => c.action === "mute")[0].caseNum;

		m = await msg.channel.createMessage(`${Emojis.warning.yellow} What do you want the reason to be?`);

		reason = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
		if (!reason.length || /cancel/gi.test(reason[0].content)) return m.edit(`${Emojis.warning.red} Cancelled.`);
		
		m.edit(`${Emojis.warning.yellow} Unmuting user.`);

		try {
			if (member.roles.includes(roles.muted)) msg.guild.removeMemberRole(user.id, roles.muted);
			await log.resolve(bot, caseNum, reason[0].content, msg.member);
		} catch (e) {
			m.edit(`${Emojis.x} An error has occurred.`);
			throw new Error(e);
		}
		m.edit(`${Emojis.tick} Successfully unmuted ${member.tag}.`);
	}
};