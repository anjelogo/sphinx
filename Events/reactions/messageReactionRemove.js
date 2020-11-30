const Reaction = require("../../Utils/reactionroles.json"),
	reactionRoles = require("../../Internals/handlers/reactionRoles"),
	{ guildID } = require("../../Utils/config.json"),
	{ findMember } = require("../../Utils/util");

module.exports = (bot) => {

	bot.on("messageReactionRemove", async (msg, emoji, userID) => {
		const guild = bot.guilds.get(guildID),
			member = findMember(guild, userID);

		if (member.bot) return;
		if (Reaction.messageIDs.includes(msg.id)) return await reactionRoles(bot, member, emoji, "remove");
	});

};