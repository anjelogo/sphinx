const { colors } = require("../../../Utils/config.json");
const { fetch } = require("../../handlers/profileHandler");
const Wizard = require("./wizard");

module.exports = async (bot, user, emoji) => {
	if (!["♂️", "♀️", "❌"].includes(emoji.name)) return;

	const data = await fetch(bot, user);
	if (data) throw new Error("User already has data");

	if (!Wizard.is(bot, user)) return;

	const Session = await Wizard.get(bot, user);
	if (!Session) throw new Error("Wizard not found!");
	if (Session.stage !== 3) return; //Session MUST be stage 3

	const cancelled = {
		title: "Cancelled Profile Creator",
		description: "I've cancelled creating your profile.",
		color: colors.red 
	};

	let obj = Session.data;
	let channel = bot.privateChannels.get(Session.channelID);
	let m = channel.messages.get(Session.messageID);
	let embed = m.embeds[0];

	//Gender Preference
	obj.preference = {};
	if (emoji.name === "♂️") {
		await m.delete();
		obj.preference.gender = "male";
		embed.fields[4] = {
			name: "Preferences",
			value: "Preferred Gender: ♂️ **Male**\n\nWhat is your relationship status?\n\n**React with the reactions below**"
		};
	} else if (emoji.name === "♀️") {
		await m.delete();
		obj.preference.gender = "female";
		embed.fields[4] = {
			name: "Preferences",
			value: "Preferred Gender: ♀️ **Female**\n\nWhat is your relationship status?\n\n**React with the reactions below**"
		};
	} else if (emoji.name === "❌") {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	m = await channel.createMessage({ embed });

	m.addReaction("🧍");
	m.addReaction("🧑‍🤝‍🧑");
	m.addReaction("👀");
	m.addReaction("❌");
	
	return await Wizard.save(bot, user, obj, 4, m.id);
};