const { maxChannelSize, guildID } = require("../../Utils/config.json"),
	{ findMember } = require("../../Utils/util"),
	compatibility = require("../modules/compatibility"),
	createPrivate = require("../modules/createPrivate"),
	{ fetch } = require("./profileHandler");

module.exports = async (bot) => {
	let guild = bot.guilds.get(guildID),
		busy = false;

	setInterval(async () => {

		let numOfChannels = await bot.m.get("channels").count({}),
			queued = await bot.m.get("queue").count({});
		if (numOfChannels <= maxChannelSize && busy === false && queued > 1) start();

	}, 1500);

	const start = async () => {
		busy = true;

		let Queue = bot.m.get("queue"),
			queue = await Queue.find({}),
			user,
			found,
			match;
		
		queueLoop: for (let u of queue) {
			user = findMember(guild, u.userID);
			
			let query,
				data = await fetch(bot, user),
				list;

			query = { 
				$and: [
					{
						userID: { $ne: user.id }
					}
				],
			};
	
			if (data.profile.preference.gender !== "none") query["profile.gender"] = data.profile.preference.gender;
			if (queue[0].type === "verified") query["profile.verified"] = true;
			
			list = await Queue.aggregate([ { $match: query } ]);

			if (!list.length) continue;

			for (let m of list) {
				const user2 = findMember(guild, m.userID),
					data2 = await fetch(bot, user2),
					rate = await compatibility(bot, user, user2);

				console.log(`${user.username} - ${user2.username} | Rate: ${rate}`);
				if (rate > 50 && data2.profile.gender === data.profile.preference.gender && data.profile.gender === data2.profile.preference.gender) {
					match = user2;
					found = true;
					break queueLoop;
				}
			}
		}

		if (found === true) await createPrivate(bot, user, match);
		busy = false;
	};
};