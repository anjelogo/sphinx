const Emojis = require("../../Utils/emojis.json"),
	{ guildID, colors } = require("../../Utils/config.json"),
	{ findRole, findGuild } = require("../../Utils/util");

module.exports = async (bot, user, emoji, type, msg) => {
	const Session = await bot.m.get("reactionroles").findOne({ messageID: msg.id}),
		guild = findGuild(bot, guildID);

	if (!Session || user.bot) return;

	let roleID = Session.roles.find(r => r.reaction === emoji.name).role,
		role = findRole(guild, roleID);

	if (type === "add") {

		if (user.roles.includes(roleID)) return;
		
		try {
			await guild.addMemberRole(user.id, roleID);
		} catch (e) {
			user.createMessage({ embed: { description: `${Emojis.warning.red} There was a problem giving you that role. Contact an admin if this problem persists.`, colors: colors.red } });
		}
		user.createMessage({ embed: { description: `${Emojis.tick} You have been given the role \`${role.name}\``, color: colors.green } });
	
	} else if (type === "remove") {

		if (!user.roles.includes(roleID)) return;

		try {
			await guild.removeMemberRole(user.id, roleID);
		} catch (e) {
			user.createMessage({ embed: { description: `${Emojis.x} There was a problem removing that role. Contact an admin if this problem persists.`, color: colors.red } });
		}
		user.createMessage({ embed: { description: `${Emojis.tick} Removed the role \`${role.name}\``, color: colors.green } });

	}

};