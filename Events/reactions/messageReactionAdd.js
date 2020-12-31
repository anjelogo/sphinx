const Wizard = require("../../Internals/modules/wizards/wizard"),
	stage2 = require("../../Internals/modules/wizards/stage2"),
	stage3 = require("../../Internals/modules/wizards/stage3"),
	stage4 = require("../../Internals/modules/wizards/stage4"),
	reactionRoles = require("../../Internals/handlers/reactionRoles"),
	flagHandler = require("../../Internals/handlers/flagHandler");

module.exports = (bot) => {
	bot.on("messageReactionAdd", async (msg, emoji, member) => {
		if (member.bot) return;

		const Session = await Wizard.get(bot, member),
			stages = [
				stage2(bot, member, emoji),
				stage3(bot, member, emoji),
				stage4(bot, member, emoji)
			];
		
		const flags = await bot.m.get("wizards").findOne({ messageID: msg.id, type: "flag" });
		if (flags) return await flagHandler(bot, member, emoji, msg);

		else if (Session) {
			if (msg.id !== Session.messageID) return;
			if (![2, 3, 4].includes(Session.stage)) return;

			return await stages[Session.stage - 2];
		} else return await reactionRoles(bot, member, emoji, "add", msg);
	});
};