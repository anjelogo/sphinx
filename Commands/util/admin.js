const createPrivate = require("../../Internals/modules/createPrivate");
const Config = require("../../Utils/config.json");
const Emojis = require("../../Utils/emojis.json");
const { findMember } = require("../../Utils/util");
const Profile = require("../../Internals/handlers/profileHandler");

module.exports = {
	commands: [
		"admin",
		"debug"
	],
	example: "admin queue start",
	description: "Admin commands",
	args: [
		{
			name: "subcommand",
			description: "The subcommand",
		}
	],
	subcommands: [
		{
			name: "queue",
			description: "Queue Command",
			args: [
				{
					name: "user1",
					description: "First User"
				},
				{
					name: "user2",
					description: "Second User",
					optional: true
				}
			]
		}
	],
	devOnly: true,
	hidden: true,
	clientPerms: ["externalEmojis"],
	execute: async (bot, msg, args) => {
		let action = args[0];
		if (!action) action = "";

		switch (action.toLowerCase()) {
		case "queue": {
			let user1 = findMember(msg.guild, args[1]);
			let user2 = findMember(msg.guild, args[2]);
			if (!user2 || !args[2]) user2 = msg.member;

			//if (user1.voiceState.channelID !== Config.channels.queue || user2.voiceState.channelID !== Config.channels.queue) return msg.channel.createMessage(`${Emojis.x} Not in queue!`);

			let m = await msg.channel.createMessage(`${Emojis.warning.yellow} Creating private channel...`);
			await createPrivate(bot, user1, user2);
			m.edit(`${Emojis.tick} I have created a private channel between {placeholder} and {placeholder}`);
			break;
		}
		case "delete": {
			const guild = bot.guilds.get(Config.guildID);

			let m = await msg.channel.createMessage(`${Emojis.warning.yellow} Deleting user profile.`);

			let user = await Profile.search(bot, args[1], msg);
			if (!user) return m.edit(`${Emojis.x} I couldn't find a user with the query \`${args[1]}\`.`);
			let data = await Profile.fetch(bot, user);
			if (!data) return m.edit(`${Emojis.x} I couldn't find a profile for \`${user.username}\`.`);

			const member = findMember(guild, user.id);
			const name = data.name;

			try {
				await member.roles.forEach(r => member.removeRole(r));
				if (user.id !== msg.guild.ownerID) await member.edit({ nick: null });
				await Profile.delete(bot, user);
			} catch(e) {
				await m.edit(`${Emojis.warning.red} There was an error while trying to delete \`${name}\`'s profile.`);
				throw new Error(e);
			}

			m.edit(`${Emojis.tick} I've successfully deleted \`${name}\`'s profile.`);
			user.createMessage({ embed: { description: `${Emojis.warning.red} Your profile was deleted by ${msg.author.username}`, color: Config.colors.red } });
			break;
		}
		case "modmode": {
			const db = bot.m.get("channels");
			let channel = await db.findOne({ text: msg.channel.id });
			if (!channel) return msg.channel.createMessage(`${Emojis.x} This is not a private session!`);
			if (channel.modMode === true) msg.channel.createMessage(`${Emojis.x} The session is already in **MOD MODE**.`);

			await db.findOneAndUpdate({ text: msg.channel.id }, { $set: { modMode: true } });
			msg.channel.createMessage(`${Emojis.tick} This channel is now in modmode.`);
			break;
		}
		default: return msg.channel.createMessage(`${Emojis.x} Invalid Subcommand, check help for this command.`);
		}

	}
};