const log = require("../../Internals/handlers/log"),
	{ guildID } = require("../../Utils/config.json"),
	Roles = require("../../Utils/roles.json");

module.exports = (bot) => {
	bot.on("guildMemberAdd", async (guild, member) => {
		if (guild.id !== guildID) return;

		let archive = bot.m.get("archived"),
			profiles = bot.m.get("profiles"),
			data = await archive.findOne({ userID: member.id }),
			history = await log.get(bot, "user", member),
			rolesToBeAdded = [];

		if (!data) return;

		rolesToBeAdded.push(Roles.preferences.gender[data.profile.preference.gender]);
		rolesToBeAdded.push(Roles.preferences.status[data.profile.preference.status]);
		rolesToBeAdded.push(Roles.gender[data.profile.gender]);
		rolesToBeAdded.push(Roles.util.clearance);

		if (history && history.filter(c => c.action === "mute").length) rolesToBeAdded.push(Roles.util.muted);
	
		rolesToBeAdded.forEach(role => guild.addMemberRole(member.id, role));

		let name = `${data.profile.name.first} ${data.profile.name.last}`;
		if (name.length > 32) name = data.profile.name.first;

		member.edit({ nick: name });

		await profiles.insert(data);
		await archive.findOneAndDelete({ userID: member.id });
	});
};