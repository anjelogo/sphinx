const Config = require("../../Utils/config.json"),
	deletePrivate = require("../modules/deletePrivate"),
	{ fetch } = require("./profileHandler"),
	Emojis = require("../../Utils/emojis.json");

module.exports = async (bot, member, channel, bool = false) => {
	let filteredChannels = [],
		tempChannels = await bot.m.get("channels").find({});

	Object.values(Config.channels).forEach(c => filteredChannels.push(c));
	member.guild.channels.filter(c => c.name.toLowerCase() === "in queue").forEach(c => filteredChannels.push(c.id));
	tempChannels.forEach(c => Object.values(c).forEach(v => filteredChannels.push(v)));

	if (!filteredChannels.includes(channel.id)) return;

	if (bool === true) {
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
		let data = await fetch(bot, member);

		if (data.profile.locked === true) {
			await member.edit({ channelID: null });
			return member.createMessage({ embed: { description: `${Emojis.x} Your profile is currently locked! Ask an admin to unlock your profile.`, color: Config.colors.red } });
		}

		const obj = {
			userID: member.id,
			joined: Date.now(),
			type: "regular",
			profile: data.profile
		};

		if (channel.name.toLowerCase() !== "in queue" && Object.values(Config.channels).includes(channel.id)) {
			let queue = await member.guild.createChannel("In Queue", 2, { parentID: Config.channels.queueCategory});
			member.edit({ channelID: queue.id });
		}
		if (channel.name.toLowerCase() === "in queue") await bot.m.get("queue").insert(obj);
	}
};