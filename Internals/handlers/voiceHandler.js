const Config = require("../../Utils/config.json");
const deletePrivate = require("../modules/deletePrivate");

module.exports = async (bot, member, channel, bool = false) => {
	let filteredChannels = [];
	let configChannels = Object.values(Config.channels);
	configChannels.forEach(c => filteredChannels.push(c));
	let tempChannels = await bot.m.get("channels").find({});
	let b = member.guild.channels.filter(c => c.name.toLowerCase() === "in queue");
	b.forEach(c => filteredChannels.push(c.id));
	for (let channel of tempChannels) {
		let values = Object.values(channel);
		values.forEach(v => filteredChannels.push(v));
	}

	if (!filteredChannels.includes(channel.id)) return;

	if (bool === true) {
		//list temp channels and check if it's one of them
		let chs = [];
		for (let channel of tempChannels) {
			let values = Object.values(channel);
			values.forEach(v => chs.push(v));
		}
		if (channel.name.toLowerCase() === "in queue") {
			await channel.delete();
			await bot.m.get("queue").findOneAndDelete({ userID: member.id });
			return;
		}
		if (chs.includes(channel.id) && channel.voiceMembers.size <= 1) return deletePrivate(bot, member, channel);
	} else if (!bool || bool === false) {
		const obj = {
			userID: member.id,
			joined: Date.now()
		};

		if (channel.name.toLowerCase() !== "in queue" && configChannels.includes(channel.id)) {
			let queue = await member.guild.createChannel("In Queue", 2, { parentID: Config.channels.queueCategory});
			member.edit({ channelID: queue.id });
		}
		if (channel.name.toLowerCase() === "in queue") await bot.m.get("queue").insert(obj);
	}
};