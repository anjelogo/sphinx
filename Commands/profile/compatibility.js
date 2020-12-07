const { fetch, search } = require("../../Internals/handlers/profileHandler"),
	{ colors } = require("../../Utils/config.json"),
	Emojis = require("../../Utils/emojis.json"),
	compatibility = require("../../Internals/modules/compatibility"),
	{ findMember, findRole } = require("../../Utils/util");

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
		let m = await msg.channel.createMessage(`${Emojis.loading} Getting user information...`),
			undefinedUsers = [],
			inCommon = [],
			user1,
			user2,
			comp;
			
		if (!args[1]) user2 = msg.member;
		else user2 = await search(bot, args[1], msg.author, m);

		user1 = await search(bot, args[0], msg.author, m);
		if(!user1) undefinedUsers.push(args[0]);
		if(!user2) undefinedUsers.push(args[1]);

		if (undefinedUsers.length) return m.edit({ content: `${Emojis.warning.yellow} I could not find the user(s) \`${undefinedUsers.length === 1 ? undefinedUsers[0] : undefinedUsers.join("` and `")}\`.`, embed: null });

		m.edit(`${Emojis.loading} Calculating`);

		const u1d = await fetch(bot, user1),
			u2d = await fetch(bot, user2),
			u1 = findMember(msg.guild, user1.id),
			u2 = findMember(msg.guild, user2.id);
			
		comp = await compatibility(bot, u1, u2);
		
		for (let i = 0; i < comp.inCommon.length; i++) {
			let rl = findRole(msg.guild, comp.inCommon[i]);
			if (!rl) continue;
			inCommon.push(rl.mention);
		}

		const embed = {
			title: `${u1d.name} and ${u2d.name}'s Compatibility`,
			description: `${u1d.name} and ${u2d.name} are **${comp.rate}%** compatible!`,
			fields: [{
				name: "Things In-common",
				value: inCommon.length ? inCommon.join("\n") : "Nothing in common!"
			}],
			color: colors.winered
		};

		m.edit({ content: "", embed });
	}
};