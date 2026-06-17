import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest, 
  create_Thread,
  getTeamPageFromName, extractTeamNameFromLiquipediaUrl, getNextTeamMatch } from './utils.js';
import { ALL_COMMANDS } from './commands.js';
import e from 'express';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};
// In-memory map of guild (server) ID -> channel ID set by setup command
export const serverChannelMap = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type, data, and context ids
  const { id, type, data, guild_id} = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    // handle setup command specifically to store the guild->channel mapping
    switch (name.toLowerCase()) {
      // Allows the bot to know what channel to post the match threads in for each server
      case 'setup_thread_bot': {
        // setup must be run in a server channel, not a DM (this bot only allows setup in servers)
        if (!guild_id) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: 'Setup must be run in a server channel (not a DM).' },
          });
        }
        const channel_id = data.options.find(option => option.name === 'channel_id').value;
        //TODO - add some more optionality, maybe let user know if they are overwriting a previous channel mapping for their server, etc
        serverChannelMap[guild_id] = channel_id;
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Setup complete — messages will be posted in <#${channel_id}> for this server.`,
          },
        });
      }

      case 'get_team_next_match': {
        /*
          Order of Operations:
          1. Get team name from command options
          2. Scrape liquipedia for the next match of that team
          3. Create a thread in the channel specified by setup with the match details and HLTV link as the first message
          4. Respond to the command with a message confirming the thread creation and link to the thread
        */

          //find out which options the user provided
          const teamName = data.find(option => option.name === 'team_name').value;
          const liquipediaPageLink = data.find(option => option.name === 'liquipedia_page_link_preffered').value;

          if (!teamName && !liquipediaPageLink) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: 'Please provide at least a team name or a liquipedia page link to get the next match.' },
            });
          } else if (!liquipediaPageLink && teamName) {
            //get the liquipedia page link from the team name
            try{
              liquipediaPageLink = await getTeamPageFromName(teamName);
            } catch (err) {
              console.error(err);
              return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: 'Error fetching team page from name. Please make sure the team name is correct and try again.' },
              });
            }
          }
          

          //TODO - add error handling for if team name is invalid or team has no upcoming matches, etc
          const matchDetails = await getNextTeamMatch(liquipediaPageLink);
          const { threadName, firstMessage } = create_Thread(
            matchDetails.teamA, 
            matchDetails.teamB, 
            matchDetails.eventName,
            matchDetails.matchTime,
            matchDetails.hltvLink,
            serverChannelMap[guild_id] //channel_id
          );
          
          // fill in teamName for response message
          if (!teamName) {
            const teamNameFromLink = extractTeamNameFromLiquipediaUrl(liquipediaPageLink);  
            if (teamNameFromLink) {  
              teamName = teamNameFromLink;
            } else {  
              teamName = MatchDetails.teamA; // default to teamA if we can't extract a team name from the link
            }
          }

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Thread created for ${teamName}'s next match: <#${thread.id}>`,
            },
          });

      }
    }
    

    // handle any command that hasnt been added to the switch case yet
    if (ALL_COMMANDS.some(cmd => cmd.name === name)) {
      // Send a message into the channel where command was triggered from
      console.log(name);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `COMMANDS ARE A WIP`
            }
          ]
        },
      });
    }

    

  return;
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
