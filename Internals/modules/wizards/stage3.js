const { guildID, roles, colors, channels } = require("../../../Utils/config.json");
const Profile = require("../../handlers/profileHandler");
const Wizard = require("./wizard");

module.exports = async (bot, user, m) => {
	const Session = await Wizard.get(bot, user);
	if (Session.stage !== 3) return; //Session must be stage 3

	const data = await Profile.fetch(bot, user);
	let name = `${data.profile.name.first} ${data.profile.name.last}`;
	if (name.length > 32) name = data.profile.name.first;
	const guild = bot.guilds.get(guildID);
	const newProfiles = guild.channels.get(channels.newProfiles);
	const embed = await Profile.embed(bot, user);

	try {
		guild.addMemberRole(user.id, roles.clearance);
		guild.members.get(user.id).edit({ nick: name });
		await m.channel.createMessage({ embed });
		await newProfiles.createMessage({ content: user.mention, embed });
		m.edit({ embed: { description: "Your profile was sucessfully created! You can view it in <#781789257094004736>.", color: colors.green } });
		setTimeout(() => m.delete(), 5000);
	} catch(e) {
		m.edit({ embed: { title: "There was a problem while adding your roles, contact an admin for more assistance", color: colors.red }});
		await Wizard.remove(bot, user);
		await Profile.delete(bot, user);
		throw new Error(e);
	}

	Wizard.remove(bot, user);
};