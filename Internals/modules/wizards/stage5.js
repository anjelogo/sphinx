const { guildID, roles, colors, channels } = require("../../../Utils/config.json");
const Profile = require("../../handlers/profileHandler");
const Wizard = require("./wizard");

module.exports = async (bot, user, m) => {

	let data = await Profile.fetch(bot, user),
		Session = await Wizard.get(bot, user),
		name = `${data.profile.name.first} ${data.profile.name.last}`,
		guild = bot.guilds.get(guildID),
		newProfiles = guild.channels.get(channels.newProfiles),
		embed = await Profile.embed(bot, user),
		obj = Session.data,
		rolesToBeAdded = [],
		prg = {
			"male": "781824302252032011",
			"female": "781824472361336882",
			"none": "782465555209912351"
		},
		prr = {
			"single": "782170638264696852",
			"taken": "782170707227967518",
			"looking": "782170741012430861"
		},
		gender = {
			"male": "782197925114806282",
			"female": "782197952616988703"
		};

	if (!data) throw new Error("Error in stage 4");
	if (!Session) return;
	if (Session.stage !== 5) return; //Session MUST be stage 4
	if (!Wizard.is(bot, user)) return;
	if (name.length > 32) name = data.profile.name.first;

	rolesToBeAdded.push(prg[obj.preference.gender]);
	rolesToBeAdded.push(prr[obj.preference.status]);
	rolesToBeAdded.push(gender[obj.gender]);
	rolesToBeAdded.push(roles.clearance);

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