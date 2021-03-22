const stage = require("../../Internals/modules/wizards/stage1");
const { fetch } = require("../../Internals/handlers/profileHandler");
const Emojis = require("../../Utils/emojis.json");
const Wizard = require("../../Internals/modules/wizards/wizard");

module.exports = {
	commands: ["start"],
	description: "Create a profile",
	example: "start",
	dmEnabled: true,
	execute: async (bot, msg) => {
		if (await Wizard.is(bot, msg.member)) return msg.channel.createMessage(`${Emojis.x} There's already a wizard running! Check your DMs.`);

		let data = await fetch(bot, msg.author);
		if (data) return msg.channel.createMessage(`${Emojis.x} You already have a profile.`);

		stage(bot, msg.author, msg);
		msg.delete();
	}
};