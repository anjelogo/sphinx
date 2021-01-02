const { channels, colors, guildID, name } = require("../../Utils/config.json"),
	Profile = require("../../Internals/handlers/profileHandler"),
	Utils = require("../../Utils/util"),
	Roles = require("../../Utils/roles.json");

module.exports = {

	async add (bot, user, moderator, action, time, reason = null) {
		let db = bot.m.get("modlog"),
			cases = await db.find({}),
			guild = bot.guilds.get(guildID),
			caseNum = cases.length > 0 ? cases[cases.length - 1].caseNum + 1 : 1,
			string = reason ? `${reason}${time ? ` | ${time}` : ""}` : `Moderator please do !reason ${caseNum}${time ? ` | ${time}` : ""}`,
			embed = {
				title: `${Utils.format(action)} | Case #${caseNum}`,
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
		await this.punish(bot, user, moderator, action, reason, caseNum, time);
		return await this.auto(bot, user);
	},

	async punish (bot, user, moderator, punishment, reason, caseNum, time){
		const guild = bot.guilds.get(guildID),
			action = {
				warn: "warned",
				mute: "muted",
				kick: "kicked",
				ban: "banned"
			},
			string = reason ? `${reason}${time ? ` | ${time}` : ""}` : `No reason provided${time ? ` | ${time}` : ""}`,
			embed = {
				title: `You have been ${action[punishment]}`,
				description: `You have been ${action[punishment]} in ${name}`,
				fields: [
					{
						name: "Moderator",
						value: moderator.tag
					}, {
						name: "Reason",
						value: string
					}
				],
				color: colors[punishment],
				footer: {
					text: `Case #${caseNum}`
				}
			};

		try {
			switch (punishment) {
			case "warn": 
				await user.createMessage({ embed });
				break;
			case "kick":
				await user.createMessage({ embed });
				await Profile.archive(bot, user);
				await guild.kickMember(user.id, reason);
				break;
			case "mute":
				await user.createMessage({ embed });
				await guild.addMemberRole(user.id, Roles.util.muted);
				break;
			case "ban":
				await user.createMessage({ embed });
				await guild.banMember(user.id, 0, string);
				await Profile.archive(bot, user);
				break;
			}

		} catch (e) {
			throw new Error(e);
		}

	},

	async auto (bot, user) {
		let history = await this.get(bot, "user", user),
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
		case "mute": 
			if (history.filter(c => c.action === "mute").length) return;
			break;
		case "ban": 
			if (history.filter(c => c.action === "ban").length) return;
			if (history.filter(c => c.action === "mute").length) await this.resolve(bot, history.filter(c => c.action === "mute")[0].caseNum, "**[AUTOMOD]** Unmuted for ban.", bot.user);
			break;
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
	},

	async automod (bot, msg) {
		let history = await this.get(bot, "user", msg.member),
			data = bot.userMap.get(msg.author.id),
			reason;

		if (history && history.filter(c => c.action === "mute").length) return;

		const warn = (reason, msgReason) => {
			msg.author.createMessage({
				embed: {
					title: "You have been warned",
					description: `You have been warned in ${name}.`,
					fields: [
						{
							name: "Moderator",
							value: bot.user.tag
						}, {
							name: "Reason",
							value: `**[AUTOMOD]** ${msgReason}`
						}
					],
					color: colors.warn
				}
			});

			this.add(bot, msg.author, bot.user, "warn", null, reason);
		};

		if (await Utils.sentInvite(msg)) {
			reason = `**[AUTOMOD]** Invite Link Sent.\n||${msg.content}||`;
			await msg.delete();
			warn(reason, "Don't post invite links.");
		}

		if (data && data.lastMsg.content.toLowerCase() === msg.content.toLowerCase()) {
			let { lastMsg, timer } = data,
				difference = msg.timestamp - lastMsg.timestamp,
				msgCount = data.msgCount;

			if (difference > 2500) {
				clearTimeout(timer);
				data.msgCount = 1;
				data.lastMsg = msg;
				data.time = setTimeout(() => bot.userMap.delete(msg.author.id), 5000);

				bot.userMap.set(msg.author.id, data);
			} else {
				msgCount++;
				if (msgCount === 5) {
					msg.delete();
					warn("**[AUTOMOD]** Spamming", "Stop spamming!");
				}
				else {
					data.msgCount = msgCount;
					bot.userMap.set(msg.author.id, data);
				}
			}
		} else {
			bot.userMap.set(msg.author.id, {
				msgCount: 1,
				lastMsg: msg,
				timer: setTimeout(() => bot.userMap.delete(msg.author.id), 5000)
			});
		}

	},
};