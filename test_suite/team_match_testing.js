import { harness } from "./testing_harness.js";
import { getTeamPageFromName, extractTeamNameFromLiquipediaUrl, getNextTeamMatch, getHTMLFromLiqupediaLink, getHLTVLinkFromTournamentPage } from '../utils.js';

// const harness = new TestHarness();

// function testGetEmoji() {
//   const emoji = getRandomEmoji();
//   if (!emoji || typeof emoji !== 'string') {
//     throw new Error('getRandomEmoji() did not return a string');
//   }
//   return emoji;
// }

// harness.addTest('getRandomEmoji sample test', testGetEmoji);
function create_matchdetailsString(matchDetails) {
    return `Team A: ${matchDetails.teamA}\nTeam B: ${matchDetails.teamB}\nEvent: ${matchDetails.eventName}\nHLTV Link: ${matchDetails.hltvLink}`;
}

//TODO write a test case for a team with a TBD opponent, and make sure the function can handle that case without breaking.
//TODO write a test case for a team with multiple matches in carousel

async function test_getNextTeamMatch() {
    const liquipediaPageLink = 'https://liquipedia.net/counterstrike/g2';
    const matchDetails = await getNextTeamMatch(liquipediaPageLink);

    if (!matchDetails) {
        throw new Error('getNextTeamMatch returned null or undefined');
    }
    const { teamA, teamB, eventName, matchTime, hltvLink } = matchDetails;

    if (!teamA || !teamB || !eventName || !hltvLink) {
        throw new Error(`getNextTeamMatch returned incomplete match details: ${JSON.stringify(matchDetails)}`);
    }

    return create_matchdetailsString(matchDetails);
}


async function test_getHltvLinkFromTournamentPage() {
    const liquipediaPageLink = 'https://liquipedia.net/counterstrike/Intel_Extreme_Masters/2026/Cologne/Playoffs#Results';
    const html = await getHTMLFromLiqupediaLink(liquipediaPageLink);
    const matchDetails = await getHLTVLinkFromTournamentPage('Team Spirit', 'G2 Esports', html);
    const actualLink = 'https://www.hltv.org/matches/2394998/match';

    if (!matchDetails) {
        throw new Error('getNextTeamMatch returned null or undefined');
    }
    const { hltvLink } = matchDetails;

    if (!hltvLink || hltvLink !== actualLink) {
        throw new Error(`getNextTeamMatch returned incomplete match details: ${JSON.stringify(matchDetails)}`);
    }

    return create_matchdetailsString(matchDetails);
}

harness.addTest('getHLTVLinkFromTournamentPage returns the correct HLTV link', test_getHltvLinkFromTournamentPage);
//harness.addTest('getNextTeamMatch returns complete match details for a valid team page', test_getNextTeamMatch);

harness.runTests().catch(console.error);
