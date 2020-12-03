const Profile = require("../../Internals/handlers/profileHandler"),
	Emojis = require("../../Utils/emojis.json");

module.exports = {
	commands: [
		"profile",
		"prof",
		"pr"
	],
	description: "Get a profile from someone in the server.",
	example: "profile Deorc",
	args: [
		{
			name: "user",
			description: "The user you are looking up",
			optional: true
		}
	],
	dmEnabled: true,
	clientPerms: ["embedLinks", "addReactions", "externalEmojis", "manageMessages"],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await Profile.search(bot, args[0], msg.author, m);
		if (!user) user = msg.author;

		let data = await Profile.fetch(bot, user);
		if (!data) return m.edit(`${Emojis.x} That user does not have a profile!`);

		m.edit(`${Emojis.loading} Loading profile...`);
		
		let embed = await Profile.embed(bot, user);
		m.edit({ content: "", embed });
	}
};