const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ colors } = require("../../Utils/config.json"),
	{ findMember, findUser } = require("../../Utils/util");

module.exports = {
	commands: ["case"],
	example: "case 15",
	description: "Get information on a case",
	args: [
		{
			name: "case number",
			description: "The number of the case"
		}
	],
	execute: async (bot, msg, args) => {
		let caseNum = Number(args[0]),
			Case = await log.get(bot, "number", caseNum);

		if (!Case) return msg.channel.createMessage(`${Emojis.x} Couldn't find a case with the number \`${caseNum}\`.`);

		const user = findUser(bot, Case.userID),
			moderator = findMember(msg.guild, Case.moderator),
			resolvedModerator = Case.resolved ? findMember(msg.guild, Case.resolved.moderator) : null,
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
						value: Case.resolved ? `${resolvedModerator.tag}\n~~${moderator.tag}~~` : moderator.tag,
						inline: true
					}, {
						name: "Reason",
						value: Case.resolved ? `${Case.resolved.reason}\n~~${Case.reason}~~` : Case.reason
					} 
				],
				color: Case.resolved ? colors.resolved : colors[Case.action],
				timestamp: new Date()
			};

		msg.channel.createMessage({ embed });
	}
};