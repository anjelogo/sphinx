const { channels, colors, guildID } = require("../../Utils/config.json");

module.exports = {

	add: async (bot, user, moderator, action, time, reason = null) => {
		const db = bot.m.get("modlog"),
			cases = await db.find({}),
			guild = moderator.guild,
			caseNum = cases.length > 0 ? cases[cases.length - 1].caseNum + 1 : 1,
			string = reason ? `${reason}${time ? ` | ${time}` : ""}` : `Moderator please do !reason ${obj.caseNum}${time ? ` | ${time}` : ""}`,
			embed = {
				title: `${action.replace(/^\w/, c => c.toUpperCase())} | Case #${caseNum}`,
				thumbnail: {
					url: user.avatarURL
				},
				fields: [
					{
						name: "User",
						value: `${user.mention} (${user.id})`,
						inline: true
					}, {
						name: "Moderator",
						value: moderator.tag,
						inline: true
					}, {
						name: "Reason",
						value: string
					}
				],
				color: colors[action],
				timestamp: new Date()
			};

		let m = await guild.channels.get(channels.log).createMessage({ embed });

		let obj = {
			caseNum,
			userID: user.id,
			moderator: moderator.id,
			messageID: m.id,
			action,
			timestamp: Date.now(),
			time: time && Number(time.slice(0, -1)) > 0 ? Date.now() + time.slice(0, -1)*(/(m|d)/.test(time) ? (/m/.test(time) ? 60000 : 86400000) : 0) : 0,
			reason: string
		};

		return await db.insert(obj);
	},

	edit: async (bot, caseNum, reason, moderator) => {
		const db = bot.m.get("modlog"),
			Case = await db.findOne({ caseNum }),
			guild = moderator.guild;

		if (!Case) return undefined;

		let m = await guild.channels.get(channels.log).getMessage(Case.messageID);
		if (!m) return;

		let embed = m.embeds[0];

		embed.fields[2].value = reason;
		m.edit({ embed });

		return await db.findOneAndUpdate({ caseNum }, { $set: { reason, moderator: moderator.id } });
	},

	resolve: async (bot, caseNum, reason, moderator) => {
		const db = bot.m.get("modlog"),
			Case = await db.findOne({ caseNum }),
			guild = bot.guilds.get(guildID);

		if (!Case || Case.action === "undefined") return undefined;

		let m = await guild.channels.get(channels.log).getMessage(Case.messageID);
		if (!m) return;

		let embed = m.embeds[0],
			resolved = {
				moderator: moderator.id,
				reason
			};
		
		embed.title = `${Case.action.replace(/^\w/, c => c.toUpperCase())} (Resolved) | Case #${caseNum}`;
		embed.color = colors.resolved;
		embed.fields[1].value = `${moderator.tag}\n~~${embed.fields[1].value}~~`;
		embed.fields[2].value = `${reason}\n~~${Case.reason}~~`;
		m.edit({ embed });

		return await db.findOneAndUpdate({ caseNum }, { $set: { moderator: moderator.id, resolved } });
	},

	get: async (bot, type, parameter) => {
		const db = bot.m.get("modlog");

		if (type === "user") {
			let Cases = await db.find({ userID: parameter.id });
			if (!Cases.length) return null;

			return new Promise(r => r(Cases.filter(c => !c.resolved)));
		} else if (type === "number") {
			let Case = await db.findOne({ caseNum: parameter });
			if (!Case) return null;
			
			return new Promise(r => r(Case));
		}
	}
};