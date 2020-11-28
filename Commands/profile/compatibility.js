const { fetch, search } = require("../../Internals/handlers/profileHandler");
const { colors } = require("../../Utils/config.json");
const Emojis = require("../../Utils/emojis.json");
const { findMember } = require("../../Utils/util");

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
		const regex = /filter/i;

		let m = await msg.channel.createMessage({ embed: { title: "Calculating...", color: colors.embedColor }});

		let undefinedUsers = [];

		const user1 = await search(bot, args[0], msg);
		if (!user1) undefinedUsers.push(args[0]);
		let user2;
		if (!args[1]) user2 = msg.member;
		else user2 = await search(bot, args[1], msg);
		if(!user2) undefinedUsers.push(args[1]);

		if (undefinedUsers.length) return m.edit({ content: `${Emojis.warning.yellow} I could not find the user(s) \`${undefinedUsers.length === 1 ? undefinedUsers[0] : undefinedUsers.join("` and `")}\`.`, embed: null });

		const u1d = await fetch(bot, user1);
		const u2d = await fetch(bot, user2);

		let u1 = findMember(msg.guild, user1.id);
		let u2 = findMember(msg.guild, user2.id);

		//Math
		let i = 0;
		let j = 0;

		let arr = [];
		let roles = msg.guild.roles.filter(r => regex.test(r.name.substring(0, 6))).map(r => r.id);

		u1.roles.filter(r => roles.includes(r)).forEach(r => arr.push(r) && i++);
		u2.roles.filter(r => roles.includes(r)).forEach(r => arr.push(r) && j++);

		let common = {};
		let inCommon = 0;
		arr.forEach(r => common[r] = (common[r] || 0) + 1);
		Object.keys(common).forEach(c => common[c] > 1 ? inCommon++ : null);

		const med = (array) => {
			array.sort((a, b) => {
				return a-b;
			});
			let half = Math.floor(array.length / 2);
				
			if (array.length % 2)
				return array[half];
			else
				return (array[half - 1] + array[half]) / 2.0;
		};

		let median = med([(inCommon/i), (inCommon/j)]);
		let compatibility = Math.max( Math.round(median * 10) / 10).toFixed(2) * 100;

		//Make Embed
		const embed = {
			title: `${u1d.name} and ${u2d.name}'s Compatibility`,
			description: `${u1d.name} and ${u2d.name} are **${compatibility}%** compatible!`,
			color: colors.winered
		};

		m.edit({ embed });
	}
};