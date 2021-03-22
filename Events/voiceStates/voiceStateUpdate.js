const log = require("../../Internals/handlers/log"),
	{ guildID } = require("../../Utils/config.json");

module.exports = (bot) => {
	bot.on("voiceStateUpdate", async (member, oldState) => {
		const Cases = await log.get(bot, "user", member);

		if (member.guild.id !== guildID) return;

		if (member.voiceState.mute === true && oldState.mute === false) {
			const audit = await member.guild.getAuditLogs(1, undefined, 24),
				moderator = audit.entries[0].user;

			if (Cases.filter(c => c.action === "mute").length) return;

			await log.add(bot, member, moderator, "mute", null, null, true);
		} else if (member.voiceState.mute === false && oldState.mute === true) {
			if (!Cases.filter(c => c.action === "mute").length) return;

			const caseNum = Cases.filter(c => c.action === "mute")[0].caseNum,
				audit = await member.guild.getAuditLogs(1, undefined, 24),
				moderator = audit.entries[0].user;

			await log.resolve(bot, caseNum, null, moderator);
		}
	});
};