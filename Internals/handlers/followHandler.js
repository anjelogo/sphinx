const Profile = require("./profileHandler"),
	{ colors } = require("../../Utils/config.json"),
	Emojis = require("../../Utils/emojis.json");

module.exports = {

	async is (bot, user1, user2) {
		const data = await Profile.fetch(bot, user2),
			friends = data.profile.followers;

		if (!friends) return false;

		return friends.includes(user1.id);
	},

	async follow (bot, user1, user2) {
		const u1d = await Profile.fetch(bot, user1),
			u2d = await Profile.fetch(bot, user2);

		if (!u1d || !u2d) return;

		u2d.profile.followers ? u2d.profile.followers : u2d.profile.followers = [];

		if (await this.is(bot, user1, user2)) return;

		else {
			try {
				u2d.profile.followers.push(user1.id);

				await Profile.edit(bot, user2, u2d.profile);
			} catch (e) {
				throw new Error(e);
			}
		}

		return await this.notify(bot, user1, user2, "follow");
	},

	async unfollow (bot, user1, user2) {
		const u1d = await Profile.fetch(bot, user1),
			u2d = await Profile.fetch(bot, user2);

		if (!u1d || !u2d) return;

		if (!await this.is(bot, user1, user2)) return;

		try {
			let index = u2d.profile.followers.indexOf(user1.id);
			if (index > -1) u2d.profile.followers.splice(index, 1);

			if (!u2d.profile.followers.length) delete u2d.profile.followers;

			await Profile.edit(bot, user2, u2d.profile);
		} catch (e) {
			throw new Error(e);
		}

		return await this.notify(bot, user1, user2, "unfollow");
	},


	async notify (bot, user1, user2, type) {
		const userData = await Profile.fetch(bot, user1),
			action = {
				follow: "followed",
				unfollow: "unfollowed"
			},
			embed = {
				description: `${Emojis.friend.accepted} \`${userData.name}\` ${action[type]} you.`,
				color: type === "follow" ? colors.green : colors.red
			};

		return user2.createMessage({ embed });
	}
};