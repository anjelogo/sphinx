const Profile = require("../../Internals/handlers/profileHandler");
const { colors } = require("../../Utils/config.json");
const Emojis = require("../../Utils/emojis.json");

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
		let member = await Profile.search(bot, args[0], msg);
		if (!member) member = msg.author;

		let m = await msg.channel.createMessage({ embed: { description: `${Emojis.warning.yellow} Fetching profile.`, color: colors.embedColor } });

		let data = await Profile.fetch(bot, member);
		if (!data) return m.edit({ embed: { color: colors.red, description: `${Emojis.x} That user does not have a profile!` } });
		
		let embed = await Profile.embed(bot, member);
		m.edit({ embed });
	}
};