const queueHandler = require("../../Internals/handlers/queueHandler"),
	log = require("../../Internals/handlers/log"),
	{ guildID, colors } = require("../../Utils/config.json"),
	{ findMember, findGuild } = require("../../Utils/util"),
	Emojis = require("../../Utils/emojis.json"),
	deletePrivate = require("../../Internals/modules/deletePrivate");

module.exports = (bot) => {
	bot.on("ready", async () => {
		console.log(`Ready! | ${bot.guilds.size} servers | ${bot.users.size} users`);
		bot.editStatus("online", {
			name: "love in the air",
			type: 3
		});

		await queueHandler(bot);
		
		let Wizards = await bot.m.get("wizards"),
			wizards = await Wizards.find({}),
			Queue = await bot.m.get("queue"),
			queue = await Queue.find({}),
			guild = findGuild(bot, guildID);

		for (let Session of wizards) {
			if (Session.type === "flag") continue;
			let member = findMember(guild, Session.userID);
	
			await Wizards.findOneAndDelete({ userID: Session.userID });
			member.createMessage(`${Emojis.warning.red} Cancelled profile creator due to an unexpected outage. Please run \`!start\` again.`);
		}

		for (let instance of queue) {
			let member = findMember(guild, instance.userID);
			member.edit({ channelID: null });

			await Queue.findOneAndDelete({ userID: instance.userID });
			member.createMessage(`${Emojis.warning.red} You were removed from the queue due to an unexpected outage.`);
		}

		setInterval(async () => {
			let unfiltered = await bot.m.get("modlog").find({}),
				cases = unfiltered.filter(c => !c.resolved);
			for (let Case of cases) {
				if (Case.time === 0 || Case.time >= Date.now()) continue;

				const reason = "**[AUTO-MOD]** Time's up!";

				if (Case.action === "mute")
					await log.resolve(bot, Case.caseNum, reason, bot.user);
				else if (Case.action === "ban")
					await log.resolve(bot, Case.caseNum, reason, bot.user);

			}
			let channels = await bot.m.get("channels").find({});
			for (let channelData of channels) {
				if (Date.now() - channelData.createdAt <= 120000) continue;

				const channel = guild.channels.get(channelData.voice);
				if (!channel || channel.voiceMembers.size > 1) continue;

				let member = channel.voiceMembers.map(m => m)[0];

				await deletePrivate(bot, member, channel);
				if (member) {
					member.createMessage({
						embed: {
							title: "Private Session Ended",
							color: colors.red,
							description: "The session has ended because nobody joined. Try again later."
						}
					});
				}
				
			}

		}, 2500);

		setInterval(async () => {
			if (await Queue.count() <= 0 ) return;
			queue = await Queue.find({});
			for (let q of queue) {
				let member = findMember(guild, q.userID);
				member.createMessage({ embed: { title: "Queue Reminder", description: `${Emojis.warning.yellow} There are ${await Queue.count()} user(s) in queue.`, color: colors.embedColor }});
			}
		}, 300000);
	});
};