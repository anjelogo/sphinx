const { colors } = require("../../../Utils/config.json");
const { fetch, edit } = require("../../handlers/profileHandler");
const Wizard = require("./wizard");
const stage = require("./stage3");

module.exports = async (bot, user, emoji) => {
	let data = await fetch(bot, user);
	if (data) throw new Error("User already has data");

	if (!Wizard.is(bot, user)) return;

	let Session = await Wizard.get(bot, user);
	if (!Session) throw new Error("Wizard not found!");
	if (Session.stage !== 2) return; //Session MUST be stage 2
	
	let cancelled = {
		title: "Cancelled Profile Creator",
		description: "I've cancelled creating your profile.",
		color: colors.red 
	};

	let obj = Session.data;
	let channel = bot.privateChannels.get(Session.channelID);
	let m = channel.messages.get(Session.messageID);
	let embed = m.embeds[0];

	//Gender
	if (emoji.name === "♂️") {
		obj.gender = "male";
		embed.fields[3] = {
			name: "Your gender",
			value: "♂️ Male"
		};
		m.edit({ embed });
	} else if (emoji.name === "♀️") {
		obj.gender = "female";
		embed.fields[3] = {
			name: "Your gender",
			value: "♀️ Female"
		};
		m.edit({ embed });
	} else if (emoji.name === "❌") {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}
	setTimeout(async () => {
		m.delete();
		m = await channel.createMessage({ embed: { title: "Creating your profile! Sit tight!", color: colors.embedColor } });
		try {
			await edit(bot, user, obj);
			Wizard.save(bot, user, obj, 3);
		} catch(e) {
			m.edit({ embed: { title: "There was an error while creating your profile", color: colors.red} });
			throw new Error(e);
		}
		setTimeout(async () => {
			return await stage(bot, user, m);
		}, 3000);
	}, 2500);
};