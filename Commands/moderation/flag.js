const flag = require("../../Internals/modules/flag"),
	Emojis = require("../../Utils/emojis.json"),
	{ search } = require("../../Internals/handlers/profileHandler"),
	{ sendWarning, findMember } = require("../../Utils/util");

module.exports = {
	commands: [
		"flag",
		"fl"
	],
	example: "flag abdoul",
	description: "Flag a user",
	args: [
		{
			name: "user",
			description: "The user to flag"
		}, {
			name: "reason",
			description: "The reason for flagging the user",
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await search(bot, args[0], msg.author, m),
			reason = args.slice(1).join(" "),
			member,
			warning;

		if (!user) return m.edit(`${Emojis.x} That user does not have a profile!`);

		member = findMember(msg.guild, user.id);
		if (member.id === msg.author.id) return m.edit(`${Emojis.x} You can't flag yourself, silly!`);
		if (!member.punishable(msg.member) || user.id === bot.user.id) return m.edit(`${Emojis.x} You can't flag that user!`);

		try {
			warning = await sendWarning(m, msg.author);
			if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);
			m.edit(`${Emojis.loading} Flagging user...`);
		} catch (e) {
			m.edit(`${Emojis.x} An error occurred. A case has still been created.`);
			throw new Error(e);
		}

		await flag.create(bot, user, reason);
		m.edit(`${Emojis.tick} Successfully flagged \`${user.tag}\` for \`${reason}\``);
	}
};