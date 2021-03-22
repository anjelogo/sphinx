const log = require("../../Internals/handlers/log"),
	{ guildID } = require("../../Utils/config.json");

module.exports = (bot) => {
	bot.on("guildBanRemove", async (guild, user) => {
		if (guild.id !== guildID) return;

		const Cases = await log.get(bot, "user", user),
			audit = await guild.getAuditLogs(1, undefined, 23),
			moderator = audit.entries[0].user,
			reason = audit.entries[0].reason;

		if (moderator.id === bot.user.id) return;
		if (!Cases.filter(c => c.action === "ban").length) return;

		const caseNum = Cases.filter(c => c.action === "ban")[0].caseNum;

		await log.resolve(bot, caseNum, reason, moderator);
	});
};