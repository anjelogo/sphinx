const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json");

module.exports = {
	commands: ["unban"],
	example: "unban abdoul I want to hear your crying again",
	description: "Unban a user that's been banned (ID ONLY)",
	args: [
		{
			name: "user",
			description: "The user you're unmuting"
		}
	],
	execute: async (bot, msg, args) => {
		let bans = await msg.guild.getBans(),
			user = bans.filter(b => b.user.id === args[0])[0],
			caseNum,
			reason,	
			member,
			cases,
			m;

		if (!user) return msg.channel.createMessage(`${Emojis.x} I couldn't find a user with the id \`${args[0]}\``);
		
		cases = await log.get(bot, "user", member);
		caseNum = cases.filter(c => c.action === "ban")[0].caseNum;

		m = await msg.channel.createMessage(`${Emojis.warning.yellow} What do you want the reason to be?`);

		reason = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
		if (!reason.length || /cancel/gi.test(reason[0].content)) return m.edit(`${Emojis.warning.red} Cancelled.`);
		
		m.edit(`${Emojis.warning.yellow} Unmuting user.`);

		try {
			await msg.guild.unbanMember(user.id, reason);
			await log.resolve(bot, caseNum, reason, bot.user);
		} catch (e) {
			m.edit(`${Emojis.x} An error has occurred.`);
			throw new Error(e);
		}
		m.edit(`${Emojis.tick} Successfully unbanned ${member.tag}.`);
	}
};