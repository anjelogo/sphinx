const handleVoice = require("../../Internals/handlers/voiceHandler");

module.exports = (bot) => {
	bot.on("voiceChannelJoin", (member, channel) => {
		handleVoice(bot, member, channel);
	});
	bot.on("voiceChannelLeave", (member, channel) => {	
		handleVoice(bot, member, channel, true);
	});
	bot.on("voiceChannelSwitch", (member, newChannel, oldChannel) => {
		handleVoice(bot, member, oldChannel, true);
		handleVoice(bot, member, newChannel);
	});
};