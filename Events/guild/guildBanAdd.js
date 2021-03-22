const log = require("../../Internals/handlers/log"),
	{ guildID } = require("../../Utils/config.json");

module.exports = (bot) => {
	bot.on("guildBanAdd", async (guild, user) => {
		if (guild.id !== guildID) return;

		const Cases = await log.get(bot, "user", user),
			audit = await guild.getAuditLogs(1, undefined, 22),
			moderator = audit.entries[0].user;

		if (Cases.filter(c => c.action === "ban").length) return;

		if (moderator.id === bot.user.id) return;

		const reason = audit.entries[0].reason;

		await log.add(bot, user, moderator, "ban", null, reason, true);
	});
};