const Profile = require("../../Internals/handlers/profileHandler"),
	{ guildID } = require("../../Utils/config.json");

module.exports = (bot) => {
	bot.on("guildMemberRemove", async (guild, obj) => {
		if (guild.id !== guildID) return;

		const data = await Profile.fetch(bot, obj);

		if (data) return await Profile.archive(bot, obj);
	});
};