const handleCommand = require("../../Internals/handlers/commandHandler");

module.exports = (bot) => {
	bot.on("messageCreate", async (msg) => {
		await handleCommand(bot, msg);
	});
};