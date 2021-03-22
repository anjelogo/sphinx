const { fetch } = require("../../Internals/handlers/profileHandler"),
	Emojis = require("../../Utils/emojis.json"),
	{ colors } = require("../../Utils/config.json"),
	{ findUser } = require("../../Utils/util");

module.exports = {
	commands: [
		"leaderboard",
		"ldb",
		"lb"
	],
	example: "lb followers",
	description: "Look at the leaderboards",
	args: [
		{
			name: "leaderboard",
			description: "The leaderboard"
		}
	],
	subcommands: [
		{
			name: "followers",
			description: "The followers leaderboard"
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Getting leaderboard details...`),
			leaderboard = args[0].toLowerCase();
		
		switch (leaderboard) {
		case "followers": {
			let data = await bot.m.get("profiles")
					.aggregate([
						{
							$project: {
								"userID": 1,
								"followers": {
									$cond: {
										if: {
											$isArray: "$profile.followers"
										},
										then: {
											$size: "$profile.followers"
										},
										else: 0
									}
								}
							}
						}
					]),
				sorted = data.sort((a, b) => {
					return b.followers - a.followers;
				}),
				fields = [],
				i = 0,
				index = [":first_place:", ":second_place:", ":third_place:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"];

			sorted.length = 10;

			for (let u of sorted) {
				let user = findUser(bot, u.userID),
					uData = await fetch(bot, user);

				fields.push({
					name: `${index[i]} - ${uData.name}`,
					value: `**${u.followers}** followers`
				});

				i++;
			}

			m.edit({ embed: {
				title: "Most Followed Users",
				color: colors.winered,
				fields
			}, content: "" });

			break;
		}
		default: {
			m.edit(`${Emojis.x} I could not find a leaderboard called \`${leaderboard}\``);
			break;
		}
		}
	}
};