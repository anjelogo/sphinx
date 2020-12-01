const queueHandler = require("../../Internals/handlers/queueHandler"),
	log = require("../../Internals/handlers/log"),
	{ guildID, colors, roles } = require("../../Utils/config.json"),
	{ findMember } = require("../../Utils/util"),
	Emojis = require("../../Utils/emojis.json");

module.exports = (bot) => {
	bot.on("ready", async () => {
		console.log(`Ready! | ${bot.guilds.size} servers | ${bot.users.size} users`);
		bot.editStatus("online", {
			name: "love in the air",
			type: 3
		});

		queueHandler(bot);
		
		const Wizards = await bot.m.get("wizards"),
			wizards = await Wizards.find({}),
			Queue = await bot.m.get("queue"),
			queue = await Queue.find({}),
			guild = bot.guilds.get(guildID);

		for (let Session of wizards) {
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

				const guild = bot.guilds.get(guildID),
					member = Case.action === "mute" ? findMember(guild, Case.userID) : null,
					reason = "**[AUTO-MOD]** Time's up!";

				if (Case.action === "mute") {
					if (member.roles.includes(roles.muted)) guild.removeMemberRole(Case.userID, roles.muted, reason);
					await log.resolve(bot, Case.caseNum, reason, bot.user);
				} else if (Case.action === "ban") {
					await guild.unbanMember(Case.userID, reason);
					await log.resolve(bot, Case.caseNum, reason, bot.user);
				}

			}
		}, 2500);

		setInterval(async () => {
			if (await Queue.count() <= 0 ) return;
			for (let q of queue) {
				let member = findMember(guild, q.userID);
				member.createMessage({ embed: { title: "Queue Reminder", description: `${Emojis.warning.yellow} There are ${await Queue.count()} user(s) in queue.`, color: colors.embedColor }});
			}
		}, 300000);
	});
};