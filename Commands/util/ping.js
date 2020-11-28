const { colors } = require("../../Utils/config.json");

module.exports = {
	commands: ["ping"],
	description: "Ping pong!",
	example: "ping",
	clientPerms: ["embedLinks"],
	execute: async (bot, msg) => {
		let m = await msg.channel.createMessage("Pinging...");
		m.edit({
			content: "Pong! 🏓",
			embed: {
				color: colors.embedColor,
				description: `**Response Time:** \`${Math.floor(new Date(m.timestamp) - new Date(msg.timestamp))}ms\``
			}
		});
	}
};