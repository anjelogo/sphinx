const Config = require("../../Utils/config.json"),
	Emojis = require("../../Utils/emojis.json"),
	{ findRole, findUser, findMember, findGuild } = require("../../Utils/util"),
	{ fetch } = require("../handlers/profileHandler");

module.exports = async (bot, user, users, options) => {
	const guild = findGuild(bot, Config.guildID),
		channels = bot.m.get("channels");

	let permissionOverwrites = [
			{
				id: user.id,
				type: "member",
				allow: Config.overwrites.default.allow
			}, {
				id: findRole(guild, "@everyone").id,
				type: "role",
				deny: Config.overwrites.default.deny
			}
		],
		userLimit = [...new Set([user.id, ...users])];

	for (let u of users) {
		let user = findUser(bot, u);
		if (!user) continue;

		permissionOverwrites.push({
			id: user.id,
			type: "member",
			allow: Config.overwrites.default.allow
		});
	}

	let data = await fetch(bot, user),
		cat = await guild.createChannel("Private Session", 4, { permissionOverwrites }),
		voice = await guild.createChannel("Voice", 2, { parentID: cat.id, userLimit: userLimit.length }),
		text = await guild.createChannel("Text", 0, { parentID: cat.id }),
		obj = {
			parent: cat.id,
			voice: voice.id,
			text: text.id,
			modMode: false,
			createdAt: Date.now(),
			members: [user.id]
		};

	users.forEach(u => { obj.members.push(u); });
	await channels.insert(obj);

	user.edit({ channelID: voice.id });

	for (let u of users) {

		let member = findMember(guild, u);
		if (!member) continue;

		const channel = await channels.findOne({ voice: member.voiceState.channelID });

		if (options.force && (member.voiceState.channelID)) member.edit({ channelID: voice.id });
		else if (options.party && channel) member.edit({ channelID: voice.id });
		else {
			let invite = await voice.createInvite({ maxUses: 1, maxAge: 120 }),
				embed = {
					title: "Private Session Invite",
					description: `${Emojis.friend.pending} \`${data.name}\` invited you to a private channel${users.length > 1 ? ` with \`${users.length - 1}\` other user(s)` : ""}!\n\n**Invite:** (Expires in 2 minutes) ||https://discord.gg/${invite.code}||`,
					color: Config.colors.green
				};

			let m = await member.user.createMessage({ embed });
			setTimeout(() => {
				m.edit({
					embed: {
						title: "Private Session Invite",
						description: `${Emojis.friend.pending} \`${data.name}\` invited you to a private channel${users.length > 1 ? ` with \`${users.length - 1}\` other user(s)` : ""}!\n\n**Invite:** (Expires in 2 minutes) ||Invite Expired||`,
						color: Config.colors.red
					}
				});
			}, 120000);
		}
	}
};