const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ sendWarning } = require("../../Utils/util");

module.exports = {
	commands: [
		"reason",
		"editcase",
		"ec"
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
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing case information...`),
			caseNum = Number(args[0]),
			Case = await log.get(bot, "number", caseNum),
			reason = args.slice(1).join(" "),
			warning;

		if (!Case) return m.edit(`${Emojis.x} Could not find a case with the number ${caseNum}`);
		if (Case.resolve) return m.edit(`${Emojis.x} That case is already resolved. You cannot change the reason.`);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.loading} Editing case...`);

			await log.edit(bot, caseNum, reason, msg.member);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Successfully edited \`Case #${caseNum}\`.`);
	}
};