const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json");

module.exports = {
	commands: [
		"reason",
		"editcase"
	],
	example: "reason 15 Get rekt lol",
	description: "Edit a case reason",
	args: [
		{
			name: "case number",
			description: "The number of the case"
		}, {
			name: "reason",
			description: "The new reason for the case"
		}
	],
	execute: async (bot, msg, args) => {
		if (isNaN(Number(args[0]))) return msg.channel.createMessage(`${Emojis.x} That's not a number!`);
		const Case = await log.get(bot, "number", Number(args[0])),
			reason = args.slice(1).join(" ");

		if (!Case) return msg.channel.createMessage(`${Emojis.x} Could not find a case with the number ${Number(args[0])}`);
		if (Case.resolve) return msg.channel.createMessage(`${Emojis.x} That case is already resolved. You cannot change the reason.`);

		await log.edit(bot, Number(args[0]), reason, msg.member);
		msg.channel.createMessage(`${Emojis.tick} Successfully edited case \`${args[0]}\`.`);
	}
};