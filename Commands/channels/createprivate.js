const { fetch, search } = require("../../Internals/handlers/profileHandler"),
	{ findMember } = require("../../Utils/util"),
	Follow = require("../../Internals/handlers/followHandler"),
	Emojis = require("../../Utils/emojis.json"),
	createPrivate = require("../../Internals/modules/createPrivate");

module.exports = {
	commands: [
		"createprivate",
		"create",
		"cp"
	],
	example: "createprivate abdoul",
	description: "Create a private channel with another person",
	args: [
		{
			name: "user",
			description: "The user you want to create a channel with"
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
			user = await search(bot, args[0], msg.author, m);

		if (!user) return m.edit(`${Emojis.x} I could not find a user called \`${args[0]}\``);

		let data = await fetch(bot, user),
			member = findMember(msg.guild, user.id);

		if (!data) return m.edit(`${Emojis.x} That user does not have a profile!`);
		if (!await Follow.is(bot, member, msg.member)) return m.edit(`${Emojis.x} That user is not following you!`);
		if (!msg.member.voiceState.channelID) return m.edit(`${Emojis.x} You need to be in a VC to start a private session!`);

		m.edit(`${Emojis.loading} Inviting user...`);

		try {
			await createPrivate(bot, msg.member, member);
		} catch (e) {
			m.edit(`${Emojis.warning.red} There was a problem inviting that user.`);
			throw new Error(e);
		}

		m.edit(`${Emojis.tick} Invited \`${data.name}\` to a private session. They have 2 minutes to accept.`);
	}
};