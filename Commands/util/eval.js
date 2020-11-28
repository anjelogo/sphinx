const { inspect } = require("util");

module.exports = {
	commands: [
		"eval",
		"evaluate"
	],
	description: "Evaluate JavaScript code",
	example: "eval 2 + 2",
	args: [
		{
			name: "code",
			description: "The code to be evaluated",
		}
	],
	dmEnabled: true,
	devOnly: true,
	hidden: true,
	clientPerms: ["embedLinks"],
	execute: async (bot, msg, args) => {
		let code = args.join(" ");
		try {
			const evaled = await eval(code);
			const cleaned = clean(evaled);
			msg.channel.createMessage({
				embed: {
					color: 1416145,
					description: `**Returns** ${typeof (evaled)}`,
					fields: [
						{
							name: "📥 Input",
							value: `\`\`\`xl\n${code}\n\`\`\``
						},
						{
							name: "📤 Output",
							value: `\`\`\`xl\n${cleaned}\n\`\`\``
						}
					]
				}
			});
		} catch (e) {
			msg.channel.createMessage({
				embed: {
					color: 14161450,
					description: "**Returns** Error",
					fields: [
						{
							name: "📥 Input",
							value: `\`\`\`xl\n${code}\n\`\`\``
						},
						{
							name: "Error",
							value: `\`\`\`xl\n${clean(e)}\n\`\`\``
						}
					]
				}
			});
		}

		function clean(text) {
			if (typeof text !== "string") text = inspect(text, { depth: 0 });
			text = text
				.replace(/`/g, "`" + String.fromCharCode(8203))
				.replace(/@/g, "@" + String.fromCharCode(8203))
				.replace(bot.token, "[REDACTED]");
			return text;
		}
	}
};