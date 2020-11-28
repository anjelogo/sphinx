module.exports = {

	create: async (bot, user, messageID, channelID) => {
		const db = bot.m.get("wizards");

		let obj = {
			userID: user.id,
			time: Date.now(),
			messageID,
			channelID
		};

		return await db.insert(obj);
	},

	save: async (bot, user, data, stage) => {
		const db = bot.m.get("wizards");
		
		return await db.findOneAndUpdate({ userID: user.id}, { $set: { data, stage } });
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