const { maxChannelSize, guildID } = require("../../Utils/config.json"),
	{ findMember } = require("../../Utils/util"),
	{ fetch } = require("./profileHandler"),
	createPrivate = require("../modules/createPrivate");

module.exports = async (bot) => {
	const regex = /filter/i;
	const guild = bot.guilds.get(guildID);

	let ready = false;

	setInterval(async () => {
		let numOfChannels = await bot.m.get("channels").count({});
		let queued = await bot.m.get("queue").count({});

		if (numOfChannels <= maxChannelSize && ready === false && queued > 1) start(queued);
	}, 1500);

	const start = async (queued) => {
		ready = true;
		const Queue = bot.m.get("queue");
		const queue = await Queue.find({});
		let check = false;
		let tries = 0;
	
		while (check === false && tries <= queued) {
			const user = findMember(guild, queue[0].userID);
			const data = await fetch(bot, user);
	
			let query = { 
				$and: [
					{
						userID: { $ne: user.id }
					}
				],
				//"profile.locked": false
			};

			if (data.profile.preference.gender !== "none") query["profile.gender"] = data.profile.preference.gender;
			if (queue[0].type === "verified") query["profile.verified"] = true;
		
			let list = await Queue.aggregate([ { $match: query } ]);
			if (!list.length) return;
	
			let index = 0;
			let found = false;
			let match;
	
			while (found === false && index < queued-1) {
				match = findMember(guild, list[index].userID);
				let matchData = await fetch(bot, match);

				let u1 = 0;
				let u2 = 0;

				let arr = [];
				let roles = guild.roles.filter(r => regex.test(r.name.substring(0, 6))).map(r => r.id);

				user.roles.filter(r => roles.includes(r)).forEach(r => arr.push(r) && u1++);
				match.roles.filter(r => roles.includes(r)).forEach(r => arr.push(r) && u2++);
				if (data.profile.preference.gender !== "none") u1++;
				if (matchData.profile.preference.gender !== "none") u2++;
		
				let common = {};
				let inCommon = 0;
				arr.forEach(r => common[r] = (common[r] || 0) + 1);
				Object.keys(common).forEach(c => common[c] > 1 ? inCommon++ : null);
				if (matchData.profile.gender === data.profile.preference.gender && data.profile.gender === matchData.profile.preference.gender) inCommon++;
		
				console.log(`Try: ${tries+1} | Step: ${index+1} | U1C: ${inCommon}/${u1} T: ${(u2/2)/u1} - U2C: ${inCommon}/${u2} T: ${(u1/2)/u2}`);
				if (u1 !== 0 && u2 !== 0 ? inCommon/u1 > (u2/2)/u1 && inCommon/u2 > (u1/2)/u2 : u1 === u2 
					&& (matchData.profile.preference !== "none" ? matchData.preference.gender === data.profile.gender : null)
				) {
					found = true;
					check = true;
					break;
				}
				index++;
			}
	
			if (found === true) {
				ready = false;
				return createPrivate(bot, user, match);
			}
			queue.push(queue.shift());
			tries++;
		}

		ready = false;
	};
};