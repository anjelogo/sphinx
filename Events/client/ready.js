const queueHandler = require("../../Internals/handlers/queueHandler");

module.exports = (bot) => {
	bot.on("ready", () => {
		console.log(`Ready! | ${bot.guilds.size} servers | ${bot.users.size} users`);
		bot.editStatus("online", {
			name: "love in the air",
			type: 3
		});

		queueHandler(bot);
	});
};