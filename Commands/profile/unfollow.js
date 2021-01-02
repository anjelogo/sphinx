const { fetch, search } = require("../../Internals/handlers/profileHandler"),
	Emojis = require("../../Utils/emojis.json"),
	handle = require("../../Internals/handlers/followHandler");

module.exports = {
	commands: [
		"unfollow",
		"ufllw",
		"uf"
	],
	example: "unfollow abdoul",
	description: "Unfollow a user",
	args: [
		{
			name: "user",
			description: "The user you want to unfollow"
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Getting user information...`),
			user = await search(bot, args[0], msg.author, m);

		if (!user)	return m.edit(`${Emojis.x} I could not find a user called \`${args[0]}\``);
		if (user.id === msg.author.id) return m.edit(`${Emojis.x} You can't unfollow yourself!`);

		const u2d = await fetch(bot, user);

		if (!u2d) return m.edit(`${Emojis.x} That user does not have a profile`);
		if (!await handle.is(bot, msg.author, user)) return m.edit(`${Emojis.x} You're not following that user!`);
		
		await m.edit(`${Emojis.loading} Unfollowing user...`);

		try {
			await handle.unfollow(bot, msg.author, user);
		} catch (e) {
			m.edit(`${Emojis.warning.red} There was a problem unfollowing that user.`);
			throw new Error(e);
		}

		await m.edit(`${Emojis.tick} You are now unfollowing \`${u2d.name}\`.`);
	}
};