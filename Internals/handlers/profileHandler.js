const { colors, guildID, developers } = require("../../Utils/config.json"),
	{ findUser, findMember, calculate_age, findBanned } = require("../../Utils/util"),
	Emojis = require("../../Utils/emojis.json");

module.exports = {

	async fetch (bot, query = null) {
		const db = bot.m.get("profiles");

		if (query) {
			let data = await db.findOne({ userID: query.id });
			if (!data) return undefined;

			let obj = {
				id: data.userID,
				profile: data.profile,
				name: `${data.profile.name.first} ${data.profile.name.last}`,
				data: data.storedData,
				_pref: data.profile.preferences,
				_isVerifed: data.profile.isVerified,
				_pr: data,
			};

			return new Promise(resolve => resolve(obj));
		}

		else {
			let arr = db.find({});
			return new Promise(resolve => resolve(arr));
		}

	},

	async edit (bot, query, value) {
		const db = bot.m.get("profiles");
		
		let data = await db.findOne({ userID: query.id });

		if (!data) {
			let obj = {
				userID: query.id,
				profile: value
			};

			await db.insert(obj);
		}

		else
			db.findOneAndUpdate({ userID: query.id }, { $set: { profile: value } });
	
	},

	async delete (bot, query) {
		const db = bot.m.get("profiles");

		return await db.findOneAndDelete({ userID: query.id });
	},

	async archive (bot, query) {
		const data = await bot.m.get("profiles").findOne({ userID: query.id });

		if (!data) return;

		await bot.m.get("archived").insert(data);
		return await bot.m.get("profiles").findOneAndDelete({ userID: query.id });
	},

	async embed (bot, user) {
		const db = bot.m.get("profiles"),
			data = await db.findOne({ userID: user.id }),
			pr = data.profile,
			prg = {
				"male": "♂️ **Male**",
				"female": "♀️ **Female**",
				"none": "🚫 **None**"
			},
			prs = {
				"single": "🧍 **Single**",
				"taken": "🧑‍🤝‍🧑 **Taken**",
				"looking": "👀 **Looking**"
			};

		let obj = {
			author: {
				icon_url: pr.avatarURL,
				name: `${pr.name.first} ${pr.name.last}`
			},
			thumbnail: {
				url: pr.avatarURL
			},
			fields: [
				{
					name: "Gender",
					value: prg[pr.gender],
					inline: true
				}, {
					name: "Preferred Gender",
					value: prg[pr.preference.gender],
					inline: true
				}, {
					name: "Relationship Status",
					value: prs[pr.preference.status],
					inline: true
				}, {
					name: "Age",
					value: calculate_age(pr.dob),
					inline: true
				}, {
					name: "About me",
					value: pr.description
				}, {
					name: "Looking for",
					value: pr.lookingfor
				}, {
					name: "Hobbies",
					value: pr.hobbies
				}
			],
			color: colors.winered
		};

		return obj;
	},

	async search (bot, query, author, m) {
		const db = bot.m.get("profiles");
		if (!query) return undefined;

		m.edit(`${Emojis.loading} Searching...`);
		let users = [];

		const first = async () => {
			if (query.id === author.id) return;

			let data = await db.findOne({ userID: query.id });
			if (!data) return;

			if (data.profile.friends) {
				for (let f of data.profile.friends) {
					let fr = findUser(bot, f);
					if (!fr) continue;
					let fData =  await this.get(fr);
					if (!fData) continue;
					
					if (fData.profile.name.first.toLowerCase() === query.toLowerCase()) users.push(fr);
					else continue;
				}
			}

			if (data.profile.requests) {
				for (let r of data.profile.requests) {
					let rq = findUser(bot, r);
					if (!rq) continue;
					let fData =  await this.get(rq);
					if (!fData) continue;
					
					if (fData.profile.name.first.toLowerCase() === query.toLowerCase()) users.push(rq);
					else continue;
				}
			}
		};

		const second = async () => {
			let pr = await db.aggregate([
				{
					$match: {
						"profile.name.first": {
							$regex: `(?i)${query}`
						}
					}
				}, {
					$sort: {
						"profile.name.first": 1
					}
				}
			]);

			if (!pr.length) return;
			pr.forEach(p => {
				let user = findUser(bot, p.userID);
				users.push(user);
			});
		};

		const third = async () => {
			let user = findMember(m.guild, query),
				guild = bot.guilds.get(guildID),
				bans = await guild.getBans();

			if (!user) user = findUser(bot, query);
			if (!user && developers.includes(author.id)) user = findBanned(bans, query);

			if (!user) return undefined;
			else users.push(user);
		};

		const multiple = async () => {
			let defaultUser = await db.findOne({ userID: users[0].id }),
				amountOfUsers = users.length > 10 ? users.length = 9 : users.length,
				indexRegex = new RegExp(`[0-${amountOfUsers}]`),
				embed = {
					title: "Oops!",
					description: `There are multiple users with the name \`${query}\`. Which one did you mean to specify?\nIf you don't answer in 20 seconds, the bot will automatically select \`${defaultUser.profile.name.first} ${defaultUser.profile.name.last}\`\n\n`,
					color: colors.green
				};

			for (let user of users) {
				let data = await db.findOne({ userID: user.id });
				let str = `🔸 **${users.indexOf(user)}** - \`${data.profile.name.first} ${data.profile.name.last}\` ${data.badges ? data.badges : ""} ${user === users[0] ? "(Default User)" : ""}\n`;
				embed.description += str;
			}

			await m.edit({ embed });
			let res = await m.channel.awaitMessages((m) => m.author.id === author.id, { maxMatches: 1, time: 20000 });

			if (!res.length) {
				await m.edit({ content: `${Emojis.x} Timed out, returning default user.`, embed: null });
				return users[0];
			} else if (!indexRegex.test(res[0].content)) {
				await m.edit({ content: `${Emojis.x} Invalid selection, returning default user.`, embed: null });
				return users[0];
			}
			res[0].delete();

			await m.edit({ content: `${Emojis.loading} Loading user...`, embed: null });
			return users[Number(res[0].content)];
		};

		let arr = [
			first(),
			second(),
			third()
		];

		for (let i = 0; i < arr.length; i++) {
			await arr[i];
			if (users.length) break;
		}

		if (!users.length) return undefined;
		if (users.length > 1) return await multiple();
		else {
			await m.edit(`${Emojis.loading} Loading user...`);
			return users[0];
		}
	}
};