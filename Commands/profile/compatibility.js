const { fetch, search } = require("../../Internals/handlers/profileHandler"),
	{ colors } = require("../../Utils/config.json"),
	Emojis = require("../../Utils/emojis.json"),
	compatibility = require("../../Internals/modules/compatibility"),
	{ findMember } = require("../../Utils/util");

module.exports = {
	commands: [
		"compatibility",
		"comp"
	],
	example: "compatibility Anjelo Aryy",
	description: "Check the compatibility between users or yourself",
	args: [
		{
			name: "user1",
			description: "The first user"
		}, {
			name: "user2",
			description: "The second user",
			optional: true
		}
	],
	execute: async (bot, msg, args) => {
		let undefinedUsers = [],
			user2,
			m,
			user1;
			
		if (!args[1]) user2 = msg.member;
		else user2 = await search(bot, args[1], msg);

		m = await msg.channel.createMessage({ embed: { title: "Calculating...", color: colors.embedColor }});

		user1 = await search(bot, args[0], msg);
		if(!user1) undefinedUsers.push(args[0]);
		if(!user2) undefinedUsers.push(args[1]);

		if (undefinedUsers.length) return m.edit({ content: `${Emojis.warning.yellow} I could not find the user(s) \`${undefinedUsers.length === 1 ? undefinedUsers[0] : undefinedUsers.join("` and `")}\`.`, embed: null });

		const u1d = await fetch(bot, user1),
			u2d = await fetch(bot, user2),
			u1 = findMember(msg.guild, user1.id),
			u2 = findMember(msg.guild, user2.id);
			
		let rate = await compatibility(bot, u1, u2);

		//Make Embed
		const embed = {
			title: `${u1d.name} and ${u2d.name}'s Compatibility`,
			description: `${u1d.name} and ${u2d.name} are **${rate}%** compatible!`,
			color: colors.winered
		};

		m.edit({ embed });
	}
};