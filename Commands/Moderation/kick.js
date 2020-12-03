const log = require("../../Internals/handlers/log"),
	Emojis = require("../../Utils/emojis.json"),
	{ colors, name } = require("../../Utils/config.json"),
	{ findMember, sendWarning } = require("../../Utils/util"),
	Profile = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: ["kick"],
	example: "kick abdoul Get Rekt",
	description: "kick a user",
	args: [
		{
			name: "user",
			description: "The user you're muting"
		}, {
			name: "reason",
			description: "The reason for kicking",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await Profile.search(bot, args[0], msg.author, m),
			reason = args[1] ? reason = args.slice(1).join(" ") : null,
			warning,
			member;

		if (!user) return m.edit(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		member = findMember(msg.guild, user.id);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.warning.yellow} What do you want the reason to be?`);

			m.edit(`${Emojis.loading} Kicking user...`);
			user.createMessage({
				embed: {
					title: "You have been kicked",
					description: `You have been kicked from ${name}.`,
					fields: [
						{
							name: "Moderator",
							value: msg.author.tag
						}, {
							name: "Reason",
							value: reason ? reason : null
						}
					],
					color: colors.kick
				}
			});
			setTimeout(async () => {
				await msg.guild.kickMember(member.id, reason);
				await log.add(bot, member, msg.member, "kick", null, reason);
				await Profile.archive(bot, user);
			}, 1000);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Successfully kicked \`${member.tag}\` for \`${reason}.\``);
	}
};