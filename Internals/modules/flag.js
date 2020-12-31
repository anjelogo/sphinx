const Profile = require("../handlers/profileHandler"),
	Wizard = require("./wizards/wizard"),
	log =  require("../handlers/log"),
	{ guildID, channels, colors } = require("../../Utils/config.json");

module.exports = {
	
	create: async (bot, user, reason, punishment = null) => {
		const data = await Profile.fetch(bot, user),
			channel = bot.guilds.get(guildID).channels.get(channels.log),
			Cases = await log.get(bot, "user", user),
			hierarchy = {
				warn: 1,
				mute: 2,
				kick: 2,
				ban: 3
			},
			infractions = Cases && Cases.length ? Cases.length + (punishment ? hierarchy[punishment] : 1) : 1;

		if (data.profile.isFlagged) return;
		data.profile.isFlagged = true;

		let infpunish;

		if (infractions < 3) infpunish = "warn";
		else if (infractions >= 3 && infractions < 9) infpunish = "mute";
		else if (infractions >= 9) infpunish = "ban";

		let string = !punishment ? infpunish[0].toLowerCase() + infpunish.substring(1) : punishment[0].toLowerCase() + punishment.substring(1),
			embed = {
				title: "Flagged User",
				fields: [
					{
						name: "User",
						value: user.mention,
						inline: true
					}, {
						name: "Infractions",
						value: `**${infractions} -> ${string}**`,
						inline: true
					}, {
						name: "Reason",
						value: reason
					}
				],
				thumbnail: {
					url: user.avatarURL
				},
				author: {
					name: user.id
				},
				color: colors.winered
			},
			obj = {
				punishment: punishment ? punishment : "warn",
				reason,
				offenderID: user.id
			};

		let m = await channel.createMessage({ embed });
		m.addReaction("✅");
		m.addReaction("❌");

		await Profile.edit(bot, user, data.profile);
		await Wizard.create(bot, user, m.id, channel.id, "flag");
		return await Wizard.save(bot, user, obj, 2, m.id, "flag");
	},

	delete: async (bot, user) => {
		const data = await Profile.fetch(bot, user);

		if (!data.profile.isFlagged) throw new Error("User is not flagged!");
	
		delete data.profile.isFlagged;

		await Profile.edit(bot, user, data.profile);
		await Wizard.remove(bot, user);
	}

};