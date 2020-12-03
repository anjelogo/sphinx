const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ colors, roles, name } = require("../../Utils/config.json"),
	{ search } = require("../../Internals/handlers/profileHandler"),
	{ findMember, sendWarning } = require("../../Utils/util");

module.exports = {
	commands: ["unmute"],
	example: "unmute abdoul I want to hear your crying again",
	description: "Unmute a user that's been muted",
	args: [
		{
			name: "user",
			description: "The user you're unmuting"
		}, {
			name: "reason",
			description: "The reason for unmuting",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await search(bot, args[0], msg.author, m),
			reason = args[1] ? args.slice(1).join(" ") : null,
			warning,
			caseNum,
			member,
			cases;
		
		if (!user) return m.edit(`${Emojis.x} I couldn't find a user named \`${args[0]}\``);

		member = findMember(msg.guild, user.id);
		cases = await log.get(bot, "user", member);
		if (!cases.filter(c => c.action === "mute").length) return m.edit(`${Emojis.x} That user is not muted!`);
		caseNum = cases.filter(c => c.action === "mute")[0].caseNum;

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.loading} Unmuting user...`);

			user.createMessage({
				embed: {
					title: "You have been unmuted",
					description: `You have been unmuted in ${name}`,
					fields: [
						{
							name: "Moderator",
							value: msg.member.tag
						}, {
							name: "Reason",
							value: reason ? reason : null
						}
					],
					color: colors.resolved
				}
			});
			if (member.roles.includes(roles.muted)) msg.guild.removeMemberRole(user.id, roles.muted);
			await log.resolve(bot, caseNum, reason, msg.member);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Successfully banned \`${member.tag}\` for \`${reason}.\``);
	}
};