const Profile = require("../../Internals/handlers/profileHandler"),
	moment = require("moment"),
	Emojis = require("../../Utils/emojis.json"),
	{ guildID, channels } = require("../../Utils/config.json"),
	{ findGuild, findChannel } = require("../../Utils/util");

module.exports = {
	commands: ["bump"],
	example: "bump",
	description: "Bump your profile in #new-profiles",
	execute: async (bot, msg) => {

		const data = await Profile.fetch(bot, msg.author);
		if (!data) return;

		if (Date.now() - data.profile.lastBumped < 28800000) return msg.channel.createMessage(`${Emojis.x} You can only bump every 8 hours! Try again \`${moment(data.profile.lastBumped + 28800000).fromNow()}\`.`);

		const embed = await Profile.embed(bot, msg.member),
			guild = findGuild(bot, guildID),
			channel = findChannel(guild, channels.newProfiles);
		
		try {
			channel.createMessage({ content: msg.member.mention, embed });
			data.profile.lastBumped = Date.now();

			await Profile.edit(bot, msg.member, data.profile);
		} catch (e) {
			msg.channel.createMessage(`${Emojis.warning.red} There was an error while trying to bump your profile.`);
			throw new Error(e);
		}

		msg.channel.createMessage(`${Emojis.tick} I've successfully bumped your profile.`);

	}
};