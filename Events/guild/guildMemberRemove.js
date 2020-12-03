const Profile = require("../../Internals/handlers/profileHandler"),
	{ guildID } = require("../../Utils/config.json");

module.exports = (bot) => {
	bot.on("guildMemberRemove", async (guild, obj) => {
		if (guild.id !== guildID) return;

		const db = bot.m.get("profiles"),
			data = await Profile.fetch(bot, obj);

		if (data) return await Profile.archive(bot, obj);

		await db.aggregate([{ $match: { userID: obj.id } }, { $out: "archived" }]);
		await db.findOneAndDelete({ userID: obj.id });
	});
};