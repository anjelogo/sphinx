const Wizard = require("../../Internals/modules/wizards/wizard");
const stage = require("../../Internals/modules/wizards/stage2");

module.exports = (bot) => {
	bot.on("messageReactionAdd", async (msg, emoji, member) => {
		let Session = await Wizard.get(bot, member);
		if (!Session) return;
		if (msg.id !== Session.messageID) return;
		if (Session.stage !== 2) return; //Session MUST be in stage 2
		
		return await stage(bot, member, emoji);
	});
};