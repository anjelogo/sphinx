const Config = require("../../Utils/config.json"),
	deletePrivate = require("../modules/deletePrivate"),
	{ fetch } = require("./profileHandler"),
	Emojis = require("../../Utils/emojis.json");

module.exports = async (bot, member, channel, bool = false) => {
	let filter = [],
		tempChannels = await bot.m.get("channels").find({});

	Object.values(Config.channels).forEach(c => filter.push(c));
	member.guild.channels.filter(c => c.name.toLowerCase() === "in queue").forEach(c => filter.push(c.id));
	tempChannels.forEach(c => Object.values(c).forEach(v => filter.push(v)));

	if (!filter.includes(channel.id)) return;

	if (bool === true) {

		let channels = [];

		tempChannels.forEach(c => Object.values(c).forEach(v => channels.push(v)));

		if (channel.name.toLowerCase() === "in queue") {
			await channel.delete();
			await bot.m.get("queue").findOneAndDelete({ userID: member.id });
			return;
		}

		if (channels.includes(channel.id) && channel.voiceMembers.size <= 1) return deletePrivate(bot, member, channel);

	} else if (!bool || bool === false) {
		let data = await fetch(bot, member);

		if (data.profile.locked === true) {
			await member.edit({ channelID: null });
			return member.createMessage({ embed: { description: `${Emojis.x} Your profile is currently locked! Ask an admin to unlock your profile.`, color: Config.colors.red } });
		}

		const obj = {
			userID: member.id,
			type: "regular",
			profile: data.profile
		};

		if (channel.name.toLowerCase() !== "in queue" && Object.values(Config.channels).includes(channel.id)) {
			let queue = await member.guild.createChannel("In Queue", 2, { parentID: Config.channels.queueCategory});
			member.edit({ channelID: queue.id });
		}

		if (channel.name.toLowerCase() === "in queue") {
			await bot.m.get("queue").insert(obj);
			
			let embed = {
				title: "You've been added to the queue",
				footer: {
					text: `In queue: ${await bot.m.get("queue").count()}`
				},
				color: Config.colors.embedColor
			};

			if (Date.now() - data.profile.createdAt < 3600000) embed.description = `Welcome to the queue!\n\nThings to note: The queue is anonymous and everyone in the queue is hidden. The bot will attempt to match you based on your preferences set in <#781819428736204821> and preferences set in the wizard!\n\n**Make sure you follow matching rules and etiquette!**\n\n- ${Config.name} Team`;

			member.createMessage({ embed });
		}
	}
};