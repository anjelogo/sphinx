const Wizard = require("../../Internals/modules/wizards/wizard"),
	stage2 = require("../../Internals/modules/wizards/stage2"),
	stage3 = require("../../Internals/modules/wizards/stage3"),
	stage4 = require("../../Internals/modules/wizards/stage4"),
	Reaction = require("../../Utils/reactionroles.json"),
	reactionRoles = require("../../Internals/handlers/reactionRoles");

module.exports = (bot) => {
	bot.on("messageReactionAdd", async (msg, emoji, member) => {
		if (member.bot) return;

		const Session = await Wizard.get(bot, member),
			stages = [
				stage2(bot, member, emoji),
				stage3(bot, member, emoji),
				stage4(bot, member, emoji)
			];

		if (Session) {
			if (msg.id !== Session.messageID) return;
			if (![2, 3, 4].includes(Session.stage)) return;

			return await stages[Session.stage - 2];
		} else if (Reaction.messageIDs.includes(msg.id)) return await reactionRoles(bot, member, emoji, "add");
	});
};