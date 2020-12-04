const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ colors, roles, name } = require("../../Utils/config.json"),
	{ findMember, sendWarning } = require("../../Utils/util"),
	{ search } = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: ["mute"],
	example: "mute abdoul",
	description: "Mute a user",
	args: [
		{
			name: "user",
			description: "The user you're muting"
		}, {
			name: "time",
			description: "The time they're going to be muted for",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await search(bot, args[0], msg.author, m),
			warning,
			member,
			reason,
			time;

		if (!user) return m.edit(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		member = findMember(msg.guild, user.id);
		if (member.roles.includes(roles.muted)) return m.edit(`${Emojis.x} That user is already muted!`);
		if (member.id === msg.author.id) return m.edit(`${Emojis.x} You can't mute yourself, silly!`);
		if (!member.punishable(msg.author) || user.id === bot.user.id) return m.edit(`${Emojis.x} You can't mute that user!`);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.warning.yellow} What do you want the reason to be?`);

			reason = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
			if (!reason.length || /cancel/gi.test(reason[0].content)) return m.edit(`${Emojis.warning.red} Cancelled.`);
			m.edit(`${Emojis.loading} Muting user...`);

			user.createMessage({
				embed: {
					title: "You have been muted",
					description: `You have been muted in ${name}.`,
					fields: [
						{
							name: "Moderator",
							value: msg.author.tag
						}, {
							name: "Reason",
							value: reason[0].content
						}
					],
					color: colors.mute
				}
			});
			await msg.guild.addMemberRole(member.id, roles.muted);
			time = args[1] && !isNaN(args[1].slice(0, -1)) ? time = args[1] : time = null;
			await log.add(bot, member, msg.member, "mute", time, reason[0].content);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Successfully muted \`${member.tag}\` for \`${reason[0].content}.\``);
	}
};