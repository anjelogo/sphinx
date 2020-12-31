module.exports = {

	create: async (bot, user, messageID, channelID, type) => {
		const db = bot.m.get("wizards");

		let obj = {
			userID: user.id,
			stage: 1,
			time: Date.now(),
			messageID,
			channelID,
			type
		};

		return await db.insert(obj);
	},

	save: async (bot, user, data, stage, mid = null, type) => {
		const db = bot.m.get("wizards");
		
		if (mid) return await db.findOneAndUpdate({ userID: user.id, type }, { $set: { data, stage, messageID: mid } });
		else return await db.findOneAndUpdate({ userID: user.id, type }, { $set: { data, stage } });
	},

	remove: async (bot, user) => {
		const db = bot.m.get("wizards");

		return await db.findOneAndDelete({ userID: user.id });
	},

	get: async (bot, user) => {
		const db = bot.m.get("wizards");

		let data = await db.findOne({ userID: user.id });
		if (!data) return undefined;

		return new Promise(resolve => resolve(data));
	},

	is: async (bot, user) => {
		const db = bot.m.get("wizards");

		let data = await db.findOne({ userID: user.id });

		if (!data) return false;
		else return true;
	}

};