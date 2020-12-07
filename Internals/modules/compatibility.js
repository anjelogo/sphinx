const { guildID } = require("../../Utils/config.json"),
	{ fetch } = require("../handlers/profileHandler");

module.exports = async (bot, user1, user2) => {
	let guild = bot.guilds.get(guildID),
		data1 = await fetch(bot, user1),
		data2 = await fetch(bot, user2),
		arr = [],
		common = {},
		compatibility,
		roles,
		inCommon = 0,
		i = 0,
		j = 0;

	roles = guild.roles.filter(r => /filter/i.test(r.name.substring(0, 6))).map(r => r.id);

	user1.roles.filter(r => roles.includes(r)).forEach(r => arr.push(r) && i++);
	user2.roles.filter(r => roles.includes(r)).forEach(r => arr.push(r) && j++);
	if (data1.profile.preference.gender !== "none") i++;
	if (data2.profile.preference.gender !== "none") j++;

	arr.forEach(r => common[r] = (common[r] || 0) + 1);
	Object.keys(common).forEach(c => common[c] > 1 ? inCommon++ : null);
	if (data2.profile.gender === data1.profile.preference.gender && data1.profile.gender === data2.profile.preference.gender) inCommon++;

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

	compatibility = Math.max( Math.round(med([(inCommon/i), (inCommon/j)]) * 10) / 10).toFixed(2) * 100;
	roles = Object.keys(common).filter(c => common[c] > 1);

	return {
		rate: compatibility,
		inCommon: roles
	};
};