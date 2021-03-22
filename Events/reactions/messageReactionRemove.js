const reactionRoles = require("../../Internals/handlers/reactionRoles"),
	{ guildID } = require("../../Utils/config.json"),
	{ findMember, findGuild } = require("../../Utils/util");

module.exports = (bot) => {

	bot.on("messageReactionRemove", async (msg, emoji, userID) => {
		const guild = findGuild(bot, guildID),
			member = findMember(guild, userID);

		if (member.bot) return;
		return await reactionRoles(bot, member, emoji, "remove", msg);
	});

};