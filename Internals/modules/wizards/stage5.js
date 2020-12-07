const { guildID, colors, channels } = require("../../../Utils/config.json"),
	Profile = require("../../handlers/profileHandler"),
	Wizard = require("./wizard"),
	Roles = require("../../../Utils/roles.json");

module.exports = async (bot, user, m) => {

	let data = await Profile.fetch(bot, user),
		Session = await Wizard.get(bot, user),
		name = `${data.profile.name.first} ${data.profile.name.last}`,
		guild = bot.guilds.get(guildID),
		newProfiles = guild.channels.get(channels.newProfiles),
		embed = await Profile.embed(bot, user),
		obj = Session.data,
		rolesToBeAdded = [];

	if (!data) throw new Error("Error in stage 4");
	if (!Session) return;
	if (Session.stage !== 5) return; //Session MUST be stage 4
	if (!Wizard.is(bot, user)) return;
	if (name.length > 32) name = data.profile.name.first;

	rolesToBeAdded.push(Roles.preferences.gender[obj.preference.gender]);
	rolesToBeAdded.push(Roles.preferences.status[obj.preference.status]);
	rolesToBeAdded.push(Roles.gender[obj.gender]);
	rolesToBeAdded.push(Roles.util.clearance);

	try {
		rolesToBeAdded.forEach(r => {
			guild.addMemberRole(user.id, r);
		});
		if (user.id !== guild.ownerID) guild.members.get(user.id).edit({ nick: name });
		await m.channel.createMessage({ embed });
		await newProfiles.createMessage({ content: `<@${user.id}>`, embed });
		m.edit({ embed: { description: "Your profile was sucessfully created! You can view it in <#781789257094004736>.", color: colors.green } });
		setTimeout(() => m.delete(), 5000);
	} catch(e) {
		m.edit({ embed: { title: "There was a problem while adding your roles, contact an admin for more assistance", color: colors.red }});
		await Wizard.remove(bot, user);
		await Profile.delete(bot, user);
		throw new Error(e);
	}

	return await Wizard.remove(bot, user);
};