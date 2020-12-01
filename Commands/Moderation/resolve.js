const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json");

module.exports = {
	commands: ["resolve"],
	example: "resolve 15 My mistake",
	description: "Resolve cases (Warn only)",
	args: [
		{
			name: "case number",
			description: "The number of the case"
		}, {
			name: "reason",
			description: "The reason for resolving the case"
		}
	],
	execute: async (bot, msg, args) => {
		let caseNum = Number(args[0]),
			Case = await log.get(bot, "number", caseNum),
			reason = args.slice(1).join(" ");

		if (!Case) return msg.channel.createMessage(`${Emojis.x} Couldn't find a case with the number \`${caseNum}\`.`);

		if (Case.resolve) return msg.channel.createMessage(`${Emojis.x} That case is already resolved!`);
		if (Case.action !== "warn") return msg.channel.createMessage(`${Emojis.x} That case is not a warn!`);

		await log.resolve(bot, caseNum, reason, msg.member);
		msg.channel.createMessage(`${Emojis.tick} I have successfully resolved \`Case #${caseNum}\`.`);
	}
};