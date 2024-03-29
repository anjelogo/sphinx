const { colors } = require("../../../Utils/config.json"),
	{ fetch } = require("../../handlers/profileHandler"),
	Wizard = require("./wizard");

module.exports = async (bot, user, emoji) => {
	if (!["♂️", "♀️", "❌"].includes(emoji.name)) return;

	const data = await fetch(bot, user);
	if (data) throw new Error("User already has data");

	if (!Wizard.is(bot, user)) return;

	const Session = await Wizard.get(bot, user);
	if (!Session) return;
	if (Session.stage !== 2) return; //Session MUST be stage 2

	let obj = Session.data,
		channel = bot.privateChannels.get(Session.channelID),
		m = channel.messages.get(Session.messageID),
		embed = m.embeds[0],
		cancelled = {
			title: "Cancelled Profile Creator",
			description: "I've cancelled creating your profile.",
			color: colors.red 
		};

	//Gender
	if (emoji.name === "♂️") {
		await m.delete();
		obj.gender = "male";
		embed.fields[5] = {
			name: "Your gender",
			value: "♂️ Male"
		};
	} else if (emoji.name === "♀️") {
		await m.delete();
		obj.gender = "female";
		embed.fields[5] = {
			name: "Your gender",
			value: "♀️ Female"
		};
	} else if (emoji.name === "❌") {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	embed.fields.push({
		name: "Preferences",
		value: "What is your preferred gender?\n\n**React with the reactions below.**"
	});

	embed.fields[6].value += "\n\n♂️ - **Male**\n♀️ - **Female**\n🚫 - **None**\n❌ - `Cancel`";

	m = await channel.createMessage({ embed });

	m.addReaction("♂️");
	m.addReaction("♀️");
	m.addReaction("🚫");
	m.addReaction("❌");

	return await Wizard.save(bot, user, obj, 3, m.id, "create");
};