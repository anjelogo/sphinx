const Wizard = require("../../Internals/modules/wizards/wizard");
const stage2 = require("../../Internals/modules/wizards/stage2");
const stage3 = require("../../Internals/modules/wizards/stage3");
const stage4 = require("../../Internals/modules/wizards/stage4");

module.exports = (bot) => {
	bot.on("messageReactionAdd", async (msg, emoji, member) => {
		let Session = await Wizard.get(bot, member);
		if (!Session) return;
		if (msg.id !== Session.messageID) return;
		if (![2, 3, 4].includes(Session.stage)) return; //Session MUST be in stage 2, 3, or 4
		
		if (Session.stage === 2) return await stage2(bot, member, emoji);
		if (Session.stage === 3) return await stage3(bot, member, emoji);
		if (Session.stage === 4) return await stage4(bot, member, emoji);
	});
};