const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ colors } = require("../../Utils/config.json"),
	{ fetch, search } = require("../../Internals/handlers/profileHandler"),
	{ findMember } = require("../../Utils/util");

module.exports = {
	commands: [
		"history",
		"record"
	],
	example: "history abdoul",
	description: "Get the history of a user",
	args: [
		{
			name: "user",
			description: "The user to lookup"
		}
	],
	execute: async (bot, msg, args) => {
		let user = await search(bot, args[0], msg),
			Cases = await log.get(bot, "user", user),
			arr = [];

		if (!Cases || !Cases.length) return msg.channel.createMessage(`${Emojis.x} Couldn't find any punishment history for ${user.username}`);

		Cases.forEach(c => {
			let number = `\`Case #${c.caseNum} [${c.action.substring(0, 1).toUpperCase()}]\``;
			arr.push(number);
		});

		const member = findMember(msg.guild, Cases[0].userID),
			data = await fetch(bot, member),
			embed = {
				title: `History for ${data.name}`,
				thumbnail: {
					url: member.avatarURL
				},
				fields: [
					{
						name: `Cases: [${arr.length}]`,
						value: arr.join(", "),
					}
				],
				color: colors.embedColor,
				timestamp: new Date()
			};

		embed.fields[0].value += "\n\nView more info on a case using `!case <case number>`";

		msg.channel.createMessage({ embed });
	}
};