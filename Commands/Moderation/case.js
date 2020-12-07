const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ colors } = require("../../Utils/config.json"),
	{ search } = require("../../Internals/handlers/profileHandler");

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

		const user = await search(bot, Case.userID, msg.author, m),
			moderator = await search(bot, Case.moderator, msg.author, m),
			resolvedModerator = Case.resolved ? await search(bot, Case.resolved.moderator, msg.author, m) : null,
			embed = {
				title: `${Case.action.replace(/^\w/, c => c.toUpperCase())} ${Case.resolved ? "(Resolved) " : ""}| Case #${caseNum}`,
				thumbnail: {
					url: user.avatarURL
				},
				fields: [
					{
						name: "User",
						value: `${user.mention} (${Case.userID})`,
						inline: true
					}, {
						name: "Moderator",
						value: Case.resolved ? `${resolvedModerator.mention}\n~~${moderator.mention}~~` : moderator.mention,
						inline: true
					}, {
						name: "Reason",
						value: Case.resolved ? `${Case.resolved.reason}\n~~${Case.reason}~~` : Case.reason
					} 
				],
				color: Case.resolved ? colors.resolved : colors[Case.action],
				timestamp: new Date()
			};

		m.edit({ content: "", embed });
	}
};