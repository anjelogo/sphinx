const { colors } = require("../../../Utils/config.json");
const { fetch, edit } = require("../../handlers/profileHandler");
const Wizard = require("./wizard");
const stage = require("./stage5");

module.exports = async (bot, user, emoji) => {
	if (!["🧍", "🧑‍🤝‍🧑", "👀", "❌"].includes(emoji.name)) return;

	let data = await fetch(bot, user);
	if (data) throw new Error("User already has data");

	if (!Wizard.is(bot, user)) return;

	const Session = await Wizard.get(bot, user);
	if (!Session) throw new Error("Wizard not found!");
	if (Session.stage !== 4) return; //Session MUST be stage 4

	const cancelled = {
		title: "Cancelled Profile Creator",
		description: "I've cancelled creating your profile.",
		color: colors.red 
	};

	let obj = Session.data;
	let channel = bot.privateChannels.get(Session.channelID);
	let m = channel.messages.get(Session.messageID);
	let embed = m.embeds[0];

	//Relationship status
	if (emoji.name === "🧍") {
		await m.delete();
		obj.preference.status = "single";
		embed.fields[4] = {
			name: "Preferences",
			value: `Preferred Gender: ${obj.preference.gender === "male" ? "♂️ **Male**" : "♀️ **Female**"}\nRelationship Status: 🧍 **Single**`
		};
	} else if (emoji.name === "🧑‍🤝‍🧑") {
		await m.delete();
		obj.preference.status = "taken";
		embed.fields[4] = {
			name: "Preferences",
			value: `Preferred Gender: ${obj.preference.gender === "male" ? "♂️ **Male**" : "♀️ **Female**"}\nRelationship Status: 🧑‍🤝‍🧑 **Taken**`
		};
	} else if (emoji.name === "👀") {
		await m.delete();
		obj.preference.status = "looking";
		embed.fields[4] = {
			name: "Preferences",
			value: `Preferred Gender: ${obj.preference.gender === "male" ? "♂️ **Male**" : "♀️ **Female**"}\nRelationship Status: 👀 **Looking**`
		};
	} else if (emoji.name === "❌") {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	embed.fields[4].value += "\n\n**Head to <#781819428736204821> for more preferences.**";

	m = await channel.createMessage({ embed });

	setTimeout(async () => {
		m.delete();
		m = await channel.createMessage({ embed: { title: "Creating your profile! Sit tight!", color: colors.embedColor } });
		try {
			await edit(bot, user, obj);
			Wizard.save(bot, user, obj, 5, m.id);
		} catch(e) {
			m.edit({ embed: { title: "There was an error while creating your profile", color: colors.red} });
			throw new Error(e);
		}
		setTimeout(async () => {
			return await stage(bot, user, m);
		}, 3000);
	}, 2500);
};