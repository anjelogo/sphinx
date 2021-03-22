const Config = require("../../Utils/config.json"),
	{ warning } = require("../../Utils/emojis.json"),
	{ findMember, findChannel } = require("../../Utils/util");

module.exports = async (bot, member, channel, modmode = false) => {
	const guild = member ? member.guild : null;

	if (!guild) return;

	const cat = findChannel(guild, channel.parentID),
		db = bot.m.get("channels"),
		chl = await db.findOne({ parent: cat.id });

	if (!chl) return;

	const text = guild.channels.get(chl.text),
		users = chl.members;

	if (chl.modMode === true && !modmode) return text.createMessage(`${warning.red} This channel is currently in **MOD MODE**. This channel will not be deleted until a moderator ends mod mode.`); 

	await db.findOneAndDelete({ parent: cat.id });

	for (let user of users) {
		let member = findMember(guild, user);

		if (!member || !member.voiceState.channelID || member.voiceState.channelID !== chl.voice) continue;

		await member.edit({ channelID: Config.channels.matchDefault });
	}

	await cat.channels.forEach(c => c.delete());
	await cat.delete();
};