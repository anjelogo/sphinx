const { findMember, sendWarning, findRole } = require("../../Utils/util"),
	createPrivate = require("../../Internals/modules/createPrivate"),
	Profile = require("../../Internals/handlers/profileHandler"),
	Config = require("../../Utils/config.json"),
	Emojis = require("../../Utils/emojis.json"),
	Roles = require("../../Utils/roles.json"),
	log = require("../../Internals/handlers/log");

module.exports = {
	commands: [
		"admin",
		"debug"
	],
	example: "admin queue start",
	description: "Admin commands",
	args: [
		{
			name: "subcommand",
			description: "The subcommand",
		}
	],
	subcommands: [
		{
			name: "queue",
			description: "Queue Command",
			args: [
				{
					name: "user1",
					description: "First User"
				},
				{
					name: "user2",
					description: "Second User",
					optional: true
				}
			]
		}, {
			name: "delete",
			description: "Delete a profile",
			args: [
				{
					name: "user",
					description: "User to delete"
				}
			]
		}, {
			name: "resolve",
			description: "Forcibly resolve a broken ticket",
			args: [
				{
					name: "case number",
					description: "The case number to resolve"
				}
			]
		}, {
			name: "clearcases",
			description: "Clear all cases of a user",
			args: [
				{
					name: "user",
					description: "The user"
				}, 
			]
		}, {
			name: "modmode",
			description: "Enable modmode in a channel",
		}
	],
	devOnly: true,
	hidden: true,
	clientPerms: ["externalEmojis"],
	execute: async (bot, msg, args) => {
		let action = args[0];
		if (!action) action = null;

		switch (action.toLowerCase()) {
		case "queue": {
			let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
				user1 = await Profile.search(bot, args[1], msg.author, m),
				user2 = await Profile.search(bot, args[2], msg.author, m),
				warning;

			if (!user2 || !args[2]) user2 = msg.member;

			const u1d = await Profile.fetch(bot, user1),
				u2d = await Profile.fetch(bot, user2),
				u1 = findMember(msg.guild, user1.id),
				u2 = findMember(msg.guild, user2.id);
		
			try {
				warning = await sendWarning(m, msg.author);
				if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);	
				m.edit(`${Emojis.loading} Creating private channel...`);
				
				await createPrivate(bot, u1, u2);	
			} catch (e) {
				m.edit(`${Emojis.x} An error occurred.`);
				throw new Error(e);
			}

			m.edit(`${Emojis.tick} I have created a private channel between \`${u1d.name}\` and \`${u2d.name}\``);
			break;
		}
		case "delete": {
			let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
				user = await Profile.search(bot, args[1], msg.author, m),
				guild = bot.guilds.get(Config.guildID),
				warning;

			if (!user) return m.edit(`${Emojis.x} I couldn't find a user with the query \`${args[1]}\`.`);

			let data = await Profile.fetch(bot, user);
			if (!data) return m.edit(`${Emojis.x} I couldn't find a profile for \`${user.username}\`.`);

			const member = findMember(guild, user.id),
				name = data.name;

			try {
				warning = await sendWarning(m, msg.author);
				if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);	
				m.edit(`${Emojis.loading} Deleting profile...`);

				await member.roles.forEach(r => member.removeRole(r));
				if (user.id !== msg.guild.ownerID) await member.edit({ nick: null });

				user.createMessage({ 
					embed: { 
						description: `${Emojis.warning.red} Your profile was deleted by ${msg.author.username}`,
						color: Config.colors.red } 
				});
				await Profile.delete(bot, user);
			} catch(e) {
				await m.edit(`${Emojis.warning.red} There was an error while trying to delete \`${name}\`'s profile.`);
				throw new Error(e);
			}

			m.edit(`${Emojis.tick} I've successfully deleted \`${name}\`'s profile.`);
			break;
		}
		case "resolve": {
			let m = await msg.channel.createMessage(`${Emojis.loading} Resolving case...`),
				caseNum = Number(args[1]),
				warning,
				Case;
			
			Case = await log.get(bot, "number", caseNum);
			if (!Case) return m.edit(`${Emojis.x} Could not find a case with the number \`${caseNum}\`.`);
			if (Case.resolved) return m.edit(`${Emojis.x} That case is already resolved!`);

			try {
				warning = await sendWarning(m, msg.author);
				if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);	
				m.edit(`${Emojis.loading} Resolving case...`);
	
				await log.resolve(bot, caseNum, "**[ADMIN]** Resolved case.", bot.user);
			} catch (e) {
				m.edit(`${Emojis.x} An error occurred.`);
				throw new Error(e);
			}

			m.edit(`${Emojis.tick} I have successfully resolved \`Case #${caseNum}\`.`);
			break;
		}
		case "case":
		case "clearcase":
		case "clearcases": {
			let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing user information...`),
				user = await Profile.search(bot, args[1], msg.author, m),
				bans = await msg.guild.getBans(),
				member = msg.guild.members.get(user.id),
				history = await log.get(bot, "user", user),
				warning;

			if (!history) return m.edit(`${Emojis.x} User does not have cases!`);

			try {
				warning = await sendWarning(m, msg.author);
				if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);	
				m.edit(`${Emojis.loading} Deleting user's cases.`);
	
				for (let Case of history)	{
					if (Case.action === "mute" && member.roles.includes(Config.roles.muted)) msg.guild.removeMemberRole(user.id, Roles.util.muted);
					if (Case.action === "ban" && bans.filter(b => b.user.id === user.id)) msg.guild.unbanMember(user.id, "**[ADMIN]** Cleared all user cases.");
					await log.resolve(bot, Case.caseNum, "**[ADMIN]** Cleared all user cases.", msg.member);
				}
			} catch (e) {
				m.edit(`${Emojis.x} An error occurred.`);
				throw new Error(e);
			}
			
			m.edit(`${Emojis.tick} I have successfully cleared \`${history.length + 1}\` cases from \`${user.username}\``);
			break;
		}
		case "reactionrole": {
			let m = await msg.channel.createMessage(`${Emojis.loading} Waiting...`),
				db = bot.m.get("reactionroles"),
				title = "Reaction Roles",
				listCompleted = false,
				invalid = [],
				roles = [],
				embed = {
					title: "Reaction Roles Setup",
					description: "Complete the steps below\nYou can type `cancel` to cancel anytime",
					fields: [],
					color: Config.colors.winered
				};
				
			//Title
			embed.fields.push({
				name: "Title",
				value: "Type `none` to use the default title."
			});

			m.edit({ embed });

			let resTitle = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 35000, maxMatches: 1 });
			if (!resTitle.length || /cancel/.test(resTitle[0].content.toLowerCase())) return m.edit({ content: `${Emojis.x} Cancelled.`, embed: null });
		
			resTitle[0].content.toLowerCase() !== "none" ? title = resTitle[0].content : title = "Reaction Roles";
			embed.fields[0].value = `Title: ${title}`;

			resTitle[0].delete();

			embed.fields.push({
				name: "Reaction Roles",
				value: "Type `done` when you have sufficient roles."
			});

			while (listCompleted === false) {
				let resReaction,
					resRole,
					arr = [],
					reaction,
					role,
					str;
				
				roles.forEach(r => {
					let role = findRole(msg.guild, r.role);
					arr.push(`${r.reaction} - ${role.mention}`);
				});
				roles.length ? str = arr.join("\n") : str = "No Roles so far.";

				embed.fields[1] = {
					name: "Reaction Roles",
					value: `Type \`done\` when you have sufficient roles.\n\n${str}\n\n**What reaction do you want to add?**`
				};

				m.edit({ embed });

				resReaction = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1 });
				if (!resReaction.length || /cancel/.test(resReaction[0].content.toLowerCase())) return m.edit({ content: `${Emojis.x} Cancelled.`, embed: null });
				if (resReaction[0].content === "done") {
					listCompleted === true;
					resReaction[0].delete();
					break;
				}

				resReaction[0].delete();

				embed.fields[1] = {
					name: "Reaction Roles",
					value: `Type \`done\` when you have sufficient roles.\n\n${str}\n\n**What role do you want to add to ${resReaction[0].content}?**`
				};
				reaction = resReaction[0].content;
				m.edit({ embed });

				resRole = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1 });
				if (!resRole.length || /cancel/.test(resRole[0].content.toLowerCase())) return m.edit({ content: `${Emojis.x} Cancelled.`, embed: null });

				role = findRole(msg.guild, resRole[0].content);
				if (!role) {
					msg.channel.createMessage(`${Emojis.x} That's not a valid role!`);
					resRole[0].delete();
					continue;
				}
				roles.push({ reaction, role: role.id });
				resRole[0].delete();
			}

			if (!roles.length) return m.edit(`${Emojis.x} No roles were added.`);

			embed = {
				title,
				description: "Click on the reactions to get your roles.\n\n",
				color: Config.colors.winered
			};

			roles.forEach(r => {
				let role = findRole(msg.guild, r.role);
				embed.description += `${r.reaction} - ${role.mention}\n`;
			});

			m.delete();
			msg.delete();
			m = await msg.channel.createMessage({ embed });

			for (let r of roles) {
				try {
					m.addReaction(r.reaction);
				} catch (e) {
					invalid.push(r.reaction);
					let index = roles.findIndex(rr => rr.reaction === r.reaction);
					if (index > -1) roles.splice(index, 1);
				}
			}
			
			if (invalid.length) msg.channel.createMessage(`${Emojis.warning.red} The reaction(s) \`${invalid.join("`, `")}\` are invalid. They were not added to the reaction list.`);

			const obj = {
				messageID: m.id,
				channelID: m.channel.id,
				roles
			};

			await db.insert(obj);
			break;
		}
		case "modmode": {
			let m = await msg.channel.createMessage(`${Emojis.loading} Grabbing channel information...`),
				db = bot.m.get("channels"),	
				channel,
				warning;
			
			channel = await db.findOne({ text: msg.channel.id });
			if (!channel) return m.edit(`${Emojis.x} This is not a private session!`);
			if (channel.modMode === true) m.edit(`${Emojis.x} The session is already in **MOD MODE**.`);

			try {
				warning = await sendWarning(m, msg.author);
				if (!warning) return m.edit(`${Emojis.x} User cancelled operation.`);	
				m.edit(`${Emojis.loading} Enabling mod mode.`);
	
				await db.findOneAndUpdate({ text: msg.channel.id }, { $set: { modMode: true } });
			} catch (e) {
				m.edit(`${Emojis.x} An error occurred.`);
				throw new Error(e);
			}

			m.edit(`${Emojis.tick} This channel is now in **MOD MODE**.`);
			break;
		}
		default: return msg.channel.createMessage(`${Emojis.x} Invalid Subcommand, check help for this command.`);
		}

	}
};