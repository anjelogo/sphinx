const Config = require("../../Utils/config.json");
const { warning } = require("../../Utils/emojis.json");
const { isDeveloper } = require("../../Utils/util");

module.exports = async (bot, member, channel) => {
	const cat = member.guild.channels.get(channel.parentID);
	const db = bot.m.get("channels");

	const chl = await db.findOne({ parent: cat.id });
	if (!chl) return;

	const voice = member.guild.channels.get(chl.voice);
	const text = member.guild.channels.get(chl.text);

	if (chl.modMode === true && !isDeveloper(member)) return text.createMessage(`${warning.red} This channel is currently in **MOD MODE**. This channel will not be deleted until a moderator lifts mod mode.`); 

	await db.findOneAndDelete({ parent: cat.id });
	if (voice.voiceMembers.size > 1) {
		let user1 = member.guild.members.get(chl.members[0]);
		let user2 = member.guild.members.get(chl.members[1]);
		await user1.edit({ channelID: Config.channels.matchDefault });
		await user2.edit({ channelID: Config.channels.matchDefault });
	} else {
		let user = member.guild.members.get(chl.members[member.id === chl.members[0] ? 1 : 0]);
		await user.edit({ channelID: Config.channels.matchDefault });
	}

	await cat.channels.forEach(c => {
		c.delete();
	});
	await cat.delete();
};