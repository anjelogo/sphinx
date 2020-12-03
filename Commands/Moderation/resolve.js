const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ sendWarning } = require("../../Utils/util");

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
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing case information...`),
			caseNum = Number(args[0]),
			Case = await log.get(bot, "number", caseNum),
			reason = args.slice(1).join(" "),
			warning;

		if (!Case) return m.edit(`${Emojis.x} Couldn't find a case with the number \`${caseNum}\`.`);

		if (Case.resolve) return m.edit(`${Emojis.x} That case is already resolved!`);
		if (Case.action !== "warn") return m.edit(`${Emojis.x} That case is not a warn!`);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.loading} Resolving case...`);

			await log.resolve(bot, caseNum, reason, msg.member);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} I have successfully resolved \`Case #${caseNum}\`.`);
	}
};