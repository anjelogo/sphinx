const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ sendWarning } = require("../../Utils/util"),
	{ search } = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: ["unban"],
	example: "unban abdoul I want to hear your crying again",
	description: "Unban a user that's been banned",
	args: [
		{
			name: "user",
			description: "The user you're unbanning"
		}, {
			name: "reason",
			description: "The reason for unbanning",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			reason = args[1] ? args.slice(1).join(" ") : null,
			user = await search(bot, args[0], msg.autjor, m),
			warning,
			caseNum,
			cases;

		if (!user) return m.edit(`${Emojis.x} I couldn't find a *banned* user called \`${args[0]}\``);
		
		cases = await log.get(bot, "user", user);
		if (!cases.filter(c => c.action === "ban").length) return m.edit(`${Emojis.x} That user is not banned!`);
		caseNum = cases.filter(c => c.action === "ban")[0].caseNum;

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.loading} Unbanning user...`);

			await msg.guild.unbanMember(user.id, reason);
			await log.resolve(bot, caseNum, reason, msg.author);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Successfully unbanned \`${user.tag}\` for \`${reason}.\``);
	}
};