const Emojis = require("../../Utils/emojis.json"),
	{ colors } = require("../../Utils/config.json"),
	{ search } = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: [
		"history",
		"record",
		"hs"
	],
	example: "history abdoul",
	description: "Get the history of a user",
	args: [
		{
			name: "user",
			description: "The user to lookup"
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await search(bot, args[0], msg.author, m),
			arr = [],
			Cases;

		if (!user) return m.edit(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		m.edit(`${Emojis.loading} Grabbing punishment history...`);
		Cases = await bot.m.get("modlog").find({ userID: user.id });

		if (Cases && Cases.length) {
			Cases.forEach(c => {
				let string = `\`Case #${c.caseNum} [${c.action.substring(0, 1).toUpperCase()}]\``;
				c.resolved ? string = `~~${string}~~` : string;
				arr.push(string);
			});
		}

		let embed = {
			title: `History for ${user.username}`,
			thumbnail: {
				url: user.avatarURL
			},
			description: "`[W]` - Warn\n`[K]` - Kick\n`[M]` - Mute\n`[B]` - Ban",
			fields: [
				{
					name: `Cases: [${arr.length}]`,
					value: arr.length ? arr.join(", ") : "No punishments.",
				}
			],
			color: colors.embedColor,
			timestamp: new Date()
		};

		embed.fields[0].value += "\n\nView more info on a case using `!case <case number>`";

		m.edit({ content: "", embed });
	}
};