const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ channels } = require("../../Utils/config.json");
const { findChannel } = require("../../Utils/util");

module.exports = {
	commands: [
		"case",
		"c"
	],
	example: "case 15",
	description: "Get information on a case",
	args: [
		{
			name: "case number",
			description: "The number of the case"
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing case information...`),
			caseNum = Number(args[0]),
			Case = await log.get(bot, "number", caseNum);

		if (!Case) return m.edit(`${Emojis.x} Couldn't find a case with the number \`${caseNum}\`.`);

		const channel = findChannel(msg.guild, channels.log),
			ms = await channel.getMessage(Case.messageID);
		
		if (!ms) return m.edit(`${Emojis.x} I couldn't load embed data!`);
		let embed = ms.embeds[0];

		m.edit({ content: "", embed });
	}
};