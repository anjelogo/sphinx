const Emojis = require("../../Utils/emojis.json"),
	deletePrivate = require("../../Internals/modules/deletePrivate"),
	{ isDeveloper } = require("../../Utils/util");

module.exports = {
	commands: [
		"end",
		"endsession",
		"sessionend"
	],
	example: "end",
	description: "Ends a private channel session.",
	execute: async (bot, msg) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Getting channel information...`),
			channels = bot.m.get("channels"),
			channel = await channels.findOne({ text: msg.channel.id });

		if (!channel) return m.edit(`${Emojis.x} You can only end private sessions!`);
		if (channel.modMode && !isDeveloper(msg.author)) return m.edit(`${Emojis.warning.red} This channel is currently in **MOD MODE**. This channel will not be deleted until a moderator lifts mod mode.`);

		try {
			m.edit(`${Emojis.loading} Ending channel...`);

			if (channel.modMode && isDeveloper(msg.author)) {
				m.edit(`${Emojis.warning.yellow} A moderator has ended the session while in **MOD MODE**. This channel will be deleted in *10 seconds*.`);
				setTimeout(async () => {
					return await deletePrivate(bot, msg.member, msg.channel, true);
				}, 10000);
			} else
				return await deletePrivate(bot, msg.member, msg.channel);

		} catch (e) {
			m.edit(`${Emojis.x} An error occurred.`);
			throw new Error(e);
		}
	}
};