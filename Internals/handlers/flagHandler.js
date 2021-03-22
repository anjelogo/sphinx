const Wizard = require("../modules/wizards/wizard"),
	Flag = require("../modules/flag"),
	{ findUser, findGuild, findChannel } = require("../../Utils/util"),
	Config = require("../../Utils/config.json"),
	log = require("./log");

module.exports = async (bot, user, emoji, msg) => {

	if (!["✅", "❌"].includes(emoji.name)) return;
	if (!Wizard.is(bot, user)) return;

	const Session = await bot.m.get("wizards").findOne({ messageID: msg.id });
	if (!Session ) return;

	const guild = findGuild(bot, Config.guildID),
		channel = findChannel(guild, Session.channelID),
		m = await channel.getMessage(Session.messageID);

	if (!guild || !channel || !m) throw new Error("Could not find guild/channel/message!");

	let offender = findUser(bot, Session.data.offenderID);

	if (emoji.name === "✅") {

		m.delete();
		await log.add(bot, offender, user, Session.data.punishment, null, Session.data.reason);
		await Flag.delete(bot, offender);
	} else if (emoji.name === "❌") {
		m.delete();
		await Flag.delete(bot, offender);
	}

	return await Wizard.remove(bot, offender);
};