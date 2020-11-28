const { colors } = require("../../../Utils/config.json");
const Emojis = require("../../../Utils/emojis.json");
const Wizard = require("./wizard");
const { calculate_age, clean } = require("../../../Utils/util");

module.exports = async (bot, user, msg) => {

	let obj = {
		name: {},
		createdAt: Date.now(),
		avatarURL: user.avatarURL
	};

	let embed = {
		title: "Your Profile",
		description: "Answer the questions below to create a profile.",
		color: colors.embedColor,
		author: {
			icon_url: msg.author.avatarURL
		},
		fields: []
	};

	let cancelled = {
		title: "Cancelled Profile Creator",
		description: "I've cancelled creating your profile.",
		color: colors.red 
	};

	embed.fields.push({
		name: "When is your birthday?",
		value: "**Type it in chat.** (Use the format: MM-DD-YYYY)"
	});

	let m = await user.createMessage({ embed });
	let channel = bot.privateChannels.get(m.channel.id);

	await Wizard.create(bot, user, m.id, m.channel.id);

	//Birthdate
	let regex = /(0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])[-](19|20)\d\d/;
	let birthdate = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 30000 });
	if (!birthdate.length || birthdate[0].content.toLowerCase() === "cancel") {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	} else if (!regex.test(birthdate[0].content)) {
		await Wizard.remove(bot, user);
		return m.edit({ content: `${Emojis.x} That's not a valid birthdate!`, embed: cancelled });
	}
	let dob = Date.parse(birthdate[0].content);
	let age = calculate_age(dob);
	if (age < 18) {
		await Wizard.remove(bot, user);
		return m.edit({ content: `${Emojis.x} You're too young to create an account!`, embed: cancelled });
	}

	obj.dob = dob;
	embed.fields[0] = {
		name: "Your Birthdate",
		value: `**${birthdate[0].content}** | Age: ${age}`
	};

	//Name
	embed.fields.push({
		name: "What is your first name?",
		value: "**Type it in chat.**"
	});
	await m.edit({ embed });
	
	let firstname = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 30000});
	if (!firstname.length || firstname[0].content.toLowerCase() === "cancel") {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	obj.name.first = firstname[0].content;
	embed.fields[1] = {
		name: "What is your last name?",
		value: `**First Name:** ${firstname[0].content}\n\n**Type it in chat.**`
	};

	await m.edit({ embed });

	let lastname = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 30000});
	if (!lastname.length || lastname[0].content.toLowerCase() === "cancel") {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	obj.name.last = lastname[0].content;
	embed.fields[1] = {
		name: "Your name",
		value: `${obj.name.first} ${obj.name.last}`
	};

	//Description
	embed.fields.push({
		name: "Describe yourself.",
		value: "**Type it in chat.**"
	});
	await m.edit({ embed });

	let description = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 30000});
	if (!description.length || description[0].content.toLowerCase() === "cancel") {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	obj.description = clean(description[0].content);
	embed.fields[2] = {
		name: "Your Description",
		value: obj.description
	};

	//Stage 2: Gender and reactions
	embed.fields.push({
		name: "What is your gender?",
		value: "**React with the reactions**"
	});

	await m.edit({ embed });

	m.addReaction("♂️");
	m.addReaction("♀️");
	m.addReaction("❌");

	return await Wizard.save(bot, user, obj, 2);
};