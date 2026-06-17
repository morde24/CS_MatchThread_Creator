import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';
// This is a file where a list of options is created for people to select from


// command that will be setup to allow the user to input a team name or a team's liquipedia page and the bot will create a Public Thread in a channel with the next match for that team and the HLTV link for the match
//With proper formatting (Team A vs Team B, EVENT - YEAR) First message: Hltv link
const GET_NEXT_TEAM_MATCH = {
  name: 'get_next_team_match',
  description: 'Gets the next match from the team\'s Liquipedia page',
  type: 1,
  dm_permission: false,
  integration_types: [0],
  contexts: [0],
  options: [
    {
      type: 3,
      name: 'liquipedia_page_link_preffered',
      description: 'Enter the link to the team\'s liquipedia page',
      required: false,
    },
    {
      type: 3,
      name: 'team_name',
      description: 'Enter the team name',
      required: false,
    }
  ],
};

const GET_CURATED_MATCHES = {
  name: 'get_curated_matches',
  description: 'Gets the curated matches of the day from the liquipedia CS page',
  type: 1,
  dm_permission: false,
  integration_types: [0],
  contexts: [0],
};

const GET_MATCHES_FOR_THE_DAY = {
  name: 'get_matches_for_the_day',
  description: 'Gets the tournament matches for the day from the liquipedia CS page',
  type: 1,
  dm_permission: false,
  integration_types: [0],
  contexts: [0],
  options: [
    {
      type: 3,
      name: 'liquipedia_page_link_preffered',
      description: 'Enter the link to the team\'s liquipedia page',
      required: false,
    },
    {
      type: 3,
      name: 'tournament_name',
      description: 'Enter the full tournament name or liquipedia link to the tournament\'s page',
      required: false,
    }
  ],
};

const SETUP_THREAD_BOT = {
  name: 'setup_thread_bot',
  description: 'Sets up the variables for the bot',
  type: 1,
  dm_permission: false,
  integration_types: [0],
  contexts: [0],
  options: [
    {
      type: 3,
      name: 'channel_id',
      description: 'the channel id of the channel you want the bot to create threads in',
      required: true,
    },
  ],
};

export const ALL_COMMANDS = [GET_CURATED_MATCHES, GET_MATCHES_FOR_THE_DAY, GET_NEXT_TEAM_MATCH,  SETUP_THREAD_BOT];


InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
