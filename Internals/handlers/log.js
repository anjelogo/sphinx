const { channels, colors, guildID, roles } = require("../../Utils/config.json"),
	Profile = require("../../Internals/handlers/profileHandler");

module.exports = {

	async add (bot, user, moderator, action, time, reason = null) {
		let db = bot.m.get("modlog"),
			cases = await db.find({}),
			guild = bot.guilds.get(guildID),
			caseNum = cases.length > 0 ? cases[cases.length - 1].caseNum + 1 : 1,
			string = reason ? `${reason}${time ? ` | ${time}` : ""}` : `Moderator please do !reason ${obj.caseNum}${time ? ` | ${time}` : ""}`,
			embed = {
				title: `${action[0].toUpperCase() + action.substring(1)} | Case #${caseNum}`,
				thumbnail: {
					url: user.avatarURL
				},
				author: {
					name: user.id
				},
				fields: [
					{
						name: "User",
						value: user.mention,
						inline: true
					}, {
						name: "Moderator",
						value: moderator.mention,
						inline: true
					}, {
						name: "Reason",
						value: string
					}
				],
				color: colors[action],
				timestamp: new Date()
			},
			m = await guild.channels.get(channels.log).createMessage({ embed });

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

		await db.insert(obj);
		return await this.auto(bot, user);
	},

	async auto (bot, user) {
		let history = await this.get(bot, "user", user),
			guild = bot.guilds.get(guildID),
			infractions = 0,
			punishment,
			reason,
			hierarchy = {
				warn: 1,
				mute: 2,
				kick: 2,
				ban: 3
			};

		for (let Case of history) infractions += hierarchy[Case.action];
		
		if (infractions < 3) return;
		if (infractions >= 3 && infractions < 9) punishment = "mute";
		else if (infractions >= 9) punishment = "ban";

		reason = `**[AUTOMOD]** ${infractions} Infractions`;

		switch (punishment) {
		case "mute": {
			if (history.filter(c => c.action === "mute").length) return;
			user.createMessage({
				embed: {
					title: "You have been muted",
					description: "You have been muted in sphinx.",
					fields: [
						{
							name: "Moderator",
							value: user.tag
						}, {
							name: "Reason",
							value: `${reason} | 7d`
						}
					],
					color: colors.mute
				}
			});
			await guild.addMemberRole(user.id, roles.muted);
			break;
		}
		case "ban": {
			if (history.filter(c => c.action === "ban").length) return;
			if (history.filter(c => c.action === "mute").length) await this.resolve(bot, history.filter(c => c.action === "mute")[0].caseNum, "**[AUTOMOD]** Unmuted for ban.", bot.user);
			user.createMessage({
				embed: {
					title: "You have been banned",
					description: "You have been banned from sphinx.",
					fields: [
						{
							name: "Moderator",
							value: user.tag
						}, {
							name: "Reason",
							value: `${reason} | 7d`
						}
					],
					color: colors.ban
				}
			});
			await guild.banMember(user.id, 0, `${reason} | 7d`);
			await Profile.archive(bot, user);
			break;
		}
		}

		return await this.add(bot, user, bot.user, punishment, "7d", reason);
	},

	async edit (bot, caseNum, reason, moderator) {
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

	async resolve (bot, caseNum, reason, moderator) {
		const db = bot.m.get("modlog"),
			Case = await db.findOne({ caseNum }),
			guild = bot.guilds.get(guildID);

		if (!Case || Case.action === "resolved") return;

		let m = await guild.channels.get(channels.log).getMessage(Case.messageID);
		if (!m) return;

		reason = reason ? reason : "No reason provided.";

		let embed = m.embeds[0],
			resolved = {
				moderator: moderator.id,
				reason
			};
		
		embed.title = `${Case.action.replace(/^\w/, c => c.toUpperCase())} (Resolved) | Case #${caseNum}`;
		embed.color = colors.resolved;
		embed.fields[1].value = `${moderator.mention}\n~~${embed.fields[1].value}~~`;
		embed.fields[2].value = `${reason}\n~~${Case.reason}~~`;
		m.edit({ embed });

		return await db.findOneAndUpdate({ caseNum }, { $set: { moderator: moderator.id, resolved } });
	},

	async get (bot, type, parameter) {
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