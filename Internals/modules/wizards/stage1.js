const { colors } = require("../../../Utils/config.json"),
	{ calculate_age, clean, format } = require("../../../Utils/util"),
	Emojis = require("../../../Utils/emojis.json"),
	Wizard = require("./wizard");

module.exports = async (bot, user, msg) => {

	let cancelled = {
			title: "Cancelled Profile Creator",
			description: "I've cancelled creating your profile.",
			color: colors.red 
		},
		embed = {
			title: "Your Profile",
			description: "Answer the questions below to create a profile.\n\nYou can cancel anytime by typing `cancel` in chat.",
			color: colors.embedColor,
			author: {
				icon_url: msg.author.avatarURL
			},
			fields: []
		},
		obj = {
			name: {},
			createdAt: Date.now(),
			avatarURL: user.avatarURL,
			lastBumped: Date.now(),
			verified: false
		};

	embed.fields.push({
		name: "When is your birthday?",
		value: "**Type it in chat.** (Use the format: MM-DD-YYYY)"
	});

	let m = await user.createMessage({ embed }),
		channel = bot.privateChannels.get(m.channel.id);

	await Wizard.create(bot, user, m.id, m.channel.id, "create");

	//Birthdate
	let regex = /(0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])[-](19|20)\d\d/,
		birthdate = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 30000 }),
		dob = Date.parse(birthdate[0].content),
		age = calculate_age(dob);

	if (!birthdate.length || /cancel/gi.test(birthdate[0].content)) {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	} else if (!regex.test(birthdate[0].content)) {
		await Wizard.remove(bot, user);
		return m.edit({ content: `${Emojis.x} That's not a valid birthdate!`, embed: cancelled });
	}

	if (age < 18) obj.flag = true;

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
	if (!firstname.length || /cancel/gi.test(firstname[0].content)) {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	obj.name.first = format(firstname[0].content);
	embed.fields[1] = {
		name: "What is your last name?",
		value: `**First Name:** ${firstname[0].content}\n\n**Type it in chat.**`
	};

	await m.edit({ embed });

	let lastname = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 30000});
	if (!lastname.length || /cancel/gi.test(lastname[0].content)) {
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

	let description = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 60000});
	if (!description.length || /cancel/gi.test(birthdate[0].content)) {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	obj.description = clean(description[0].content);
	embed.fields[2] = {
		name: "Your Description",
		value: obj.description
	};

	//Looking For
	embed.fields.push({
		name: "What are you looking for?",
		value: "**Type it in chat.**"
	});
	await m.edit({ embed });

	let lookingfor = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 60000});
	if (!lookingfor.length || /cancel/gi.test(lookingfor[0].content)) {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	obj.lookingfor = clean(lookingfor[0].content);
	embed.fields[3] = {
		name: "Looking for",
		value: obj.lookingfor
	};

	//Hobbies
	embed.fields.push({
		name: "What are your hobbies?",
		value: "**Type it in chat.**"
	});
	await m.edit({ embed });

	let hobbies = await channel.awaitMessages(m => m.author.id === user.id, { maxMatches: 1, time: 60000});
	if (!hobbies.length || /(cancel|none)/gi.test(hobbies[0].content)) {
		await Wizard.remove(bot, user);
		return m.edit({ embed: cancelled });
	}

	obj.hobbies = clean(hobbies[0].content);
	embed.fields[4] = {
		name: "Your hobbies",
		value: obj.hobbies
	};

	//Stage 2: Gender and reactions
	embed.fields.push({
		name: "What is your gender?",
		value: "**React with the reactions**"
	});

	embed.fields[5].value += "\n\n♂️ - **Male**\n♀️ - **Female**\n❌ - `Cancel`";

	await m.edit({ embed });

	m.addReaction("♂️");
	m.addReaction("♀️");
	m.addReaction("❌");

	return await Wizard.save(bot, user, obj, 2, m.id, "create");
};