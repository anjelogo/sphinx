const log = require("../../Internals/handlers/log"),
	{ guildID, roles } = require("../../Utils/config.json");

module.exports = (bot) => {
	bot.on("guildMemberAdd", async (guild, member) => {
		if (guild.id !== guildID) return;

		const archive = bot.m.get("archived"),
			data = await archive.findOne({ userID: member.id }),
			history = await log.get(bot, "user", member),
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

		if (!data) return;

		let rolesToBeAdded = [];
		rolesToBeAdded.push(prg[data.profile.preference.gender]);
		rolesToBeAdded.push(prr[data.profile.preference.status]);
		rolesToBeAdded.push(gender[data.profile.gender]);
		rolesToBeAdded.push(roles.clearance);

		if (history && history.filter(c => c.action === "mute").length) rolesToBeAdded.push(roles.muted);
	
		rolesToBeAdded.forEach(role => guild.addMemberRole(member.id, role));

		let name = `${data.profile.name.first} ${data.profile.name.last}`;
		if (name.length > 32) name = data.profile.name.first;

		member.edit({ nick: name });

		await archive.aggregate([{ $match: { userID: member.id } }, { $out: "profiles" }]);
		await archive.findOneAndDelete({ userID: member.id });
	});
};