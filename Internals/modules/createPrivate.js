const Config = require("../../Utils/config.json");
const { findRole } = require("../../Utils/util");
const { fetch } = require("../handlers/profileHandler");

module.exports = async (bot, user1, user2) => {
	const guild = user1.guild;
	let channels = bot.m.get("channels");

	let data1 = await fetch(bot, user1);
	let data2 = await fetch(bot, user2);

	let cat = await guild.createChannel(`${data1.profile.name.first} and ${data2.profile.name.first}'s Private Channel`, 4, {
		permissionOverwrites: [
			{
				id: user1.id,
				type: "member",
				allow: Config.overwrites.default.allow
			}, {
				id: user2.id,
				type: "member",
				allow: Config.overwrites.default.allow
			}, {
				id: findRole(guild, "@everyone").id,
				type: "role",
				deny: Config.overwrites.default.deny
			}
		]
	});
	let voice = await guild.createChannel("Voice", 2, {
		parentID: cat.id,
		userLimit: 2,
	});
	let text = await guild.createChannel("Text", 0, { parentID: cat.id });

	let obj = {
		parent: cat.id,
		voice: voice.id,
		text: text.id,
		modMode: false,
		members: [
			user1.id,
			user2.id
		]
	};

	await channels.insert(obj);
	user1.edit({ channelID: voice.id });
	user2.edit({ channelID: voice.id });
};