const { colors } = require("../../Utils/config.json"),
	{ findUser, findMember, calculate_age } = require("../../Utils/util");

module.exports = {

	fetch: async (bot, query = null) => {
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

	edit: async (bot, query, value) => {
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

	delete: async (bot, query) => {
		const db = bot.m.get("profiles");

		await db.findOneAndDelete({ userID: query.id });

	},

	embed: async (bot, user) => {
		const db = bot.m.get("profiles"),
			data = await db.findOne({ userID: user.id }),
			pr = data.profile;

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
					value: pr.gender === "male" ? "♂️ **Male**" : "♀️ **Female**",
					inline: true
				}, {
					name: "Preferred Gender",
					value: pr.preference.gender === "none" ? "🚫 **None**" : (pr.preference.gender === "male" ? "♂️ **Male**" : "♀️ **Female**"),
					inline: true
				}, {
					name: "Relationship Status",
					value: pr.preference.status === "looking" ? "👀 **Looking**" : (pr.preference.status === "single" ? "🧍 **Single**" : "🧑‍🤝‍🧑 **Taken**"),
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

	search: async (bot, query, msg) => {
		const db = bot.m.get("profiles");
		const found = { title: "Found!", color: colors.green };
		if (!query) return undefined;

		let m = await msg.channel.createMessage({ embed: { title: "Searching...", color: colors.embedColor } });
		let users = [];

		const first = async () => {
			if (query.id === msg.author.id) return;

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
			const db = bot.m.get("profiles");
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
			let user = findMember(msg.guild, query);
			if (!user) user = findUser(bot, query);

			if (!user) {
				await m.edit({
					embed: {
						title: "Couldn't find anything.",
						color: colors.embedColor
					}
				});

				setTimeout(() => {
					m.delete();
				}, 1500);

				return undefined;
			} else {
				await m.edit({ embed: found });
				setTimeout(() => {
					m.delete();
				}, 1500);
				return user.user;
			}
		};

		const multiple = async () => {
			if (users.length > 10) users.length = 9;
			const defaultUser = await db.findOne({ userID: users[0].id });
			const amountOfUsers = users.length;
			const indexRegex = new RegExp(`[0-${amountOfUsers}]`);

			let embed = {
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
			let res = await msg.channel.awaitMessages((m) => m.author.id === msg.author.id, { maxMatches: 1, time: 20000 });

			if (!res.length) {
				await m.edit({ embed: { title: "Timed out, returning default user.", color: colors.red } });
				setTimeout(() => {
					m.delete();
				}, 1500);
				return users[0];
			} else if (!indexRegex.test(res[0].content)) {
				await m.edit({ embed: { title: "Invalid Selection, returning default user.", color: colors.red } });
				setTimeout(() => {
					m.delete();
				}, 1500);
				return users[0];
			}
			res[0].delete();
			
			let index = Number(res[0].content);
			m.delete();
			return users[index];
		};

		await first();
		if (users.length && users.length > 1) return await multiple();
		else if (users.length) {
			await m.edit({ embed: found });
			setTimeout(() => {
				m.delete();
			}, 1500);
			return users[0];
		} else {
			await second();
			if (users.length && users.length > 1) return await multiple();
			else if (users.length) {
				await m.edit({ embed: found });
				setTimeout(() => {
					m.delete();
				}, 1500);
				return users[0];
			} else return await third();
		}
	}
};