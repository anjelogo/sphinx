const Follow = require("../../Internals/handlers/followHandler"),
	{ search, fetch } = require("../../Internals/handlers/profileHandler"),
	Emojis = require("../../Utils/emojis.json"),
	createPrivate = require("../../Internals/modules/createPrivate"),
	{ isDeveloper } = require("../../Utils/util");

module.exports = {
	commands: ["invite"],
	example: "party arthur",
	description: "Invite a user to a session",
	args: [
		{
			name: "users",
			description: "The users you want to create a party with"
		}
	],
	execute: async (bot, msg, args) => {
		let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing data of \`${args.length}\` users...`),
			db = bot.m.get("channels"),
			failed = [];

		if (!msg.member.voiceState.channelID) return m.edit(`${Emojis.x} You need to be in a VC to start a private session!`);

		let channel = await db.findOne({ voice: msg.member.voiceState.channelID });
		if (!channel) return m.edit(`${Emojis.x} You need to be in a party to run this command!`);

		let users = [],
			names = [];

		for (let arg of new Set([...args, ...channel.members])) {
			let user = await search(bot, arg, msg.author, m);
			if (!user || user === msg.author) {
				failed.push(`- \`${arg}\` - User not found!`);
				continue;
			}

			let data = await fetch(bot, user);
			if (!data) {
				failed.push(`- \`${user.tag}\` - User does not have a profile!`);
				continue;
			}

			if (!isDeveloper(msg.author) && !await Follow.is(bot, user, msg.author)) {
				failed.push(`- \`${data.name}\` - User does not follow you!`);	
				continue;
			}

			names.push(data.name);
			users.push(user.id);
		}

		if (users.length > 10 && !isDeveloper(msg.author)) return m.edit(`${Emojis.x} You can only make a party up to \`10\` people!`);
		m.edit(`${Emojis.loading} Inviting users...`);

		try {
			await createPrivate(bot, msg.member, users, { force: false, party: true });
		} catch (e) {
			m.edit(`${Emojis.warning.red} There was a problem while inviting the user(s).`);
			throw new Error(e);
		}

		let strings = {
				none: `${Emojis.x} You need to atleast create a party with \`1\` **valid** user.\n\n- That user __must__ be following you\n- That user needs a profile`,
				single: `${Emojis.tick} I have invited \`${names[0]}\` to a private session. They have 2 minutes to accept.`,
				multiple: `${Emojis.tick} I have invited the users \`${names.join(", ")}\` to a private session. They have 2 minutes to accept.`,
				many: `${Emojis.tick} I have invited \`${users.length}\` users to a private session. They have 2 minutes to accept.`
			},
			type = users.length < 2 
				? !users.length
					? "none"
					: "single"
				: users.length < 4
					? "multiple"
					: "many",
			string = strings[type];

		if (failed.length) string += `\n\n${Emojis.warning.yellow} I could not invite the following user(s) for the following reason(s):\n${failed.join("\n")}`;

		m.edit(string);
	}
};