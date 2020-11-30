const { findMember } = require("../../Utils/util"),
	{ colors } = require("../../Utils/config.json");

module.exports = {
	commands: [
		"avatar",
		"ava",
		"av"
	],
	description: "Shows the avatar of the mentioned user, it will show your own avatar if no mention is provided.",
	example: "avatar deorc",
	args: [
		{
			name: "user",
			description: "The user you want the avatar from",
			optional: true
		}
	],
	hidden: false,
	clientPerms: ["embedLinks"],
	execute: (bot, msg, args) => {
		let mentioned = findMember(msg.guild, args[0]);
		if (!mentioned) 
			mentioned = msg.member;
		
		msg.channel.createMessage({
			embed: {
				color: colors.embedColor,
				author: {
					name: `Avatar for ${mentioned.user.username}`,
					url: mentioned.user.avatarURL
				},
				image: {
					url: mentioned.user.avatarURL
				}
			}
		});
	}
};
