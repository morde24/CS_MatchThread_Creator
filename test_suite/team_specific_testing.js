import { harness } from "./testing_harness.js";
import { getTeamPageFromName, extractTeamNameFromLiquipediaUrl} from '../utils.js';

// const harness = new TestHarness();

// function testGetEmoji() {
//   const emoji = getRandomEmoji();
//   if (!emoji || typeof emoji !== 'string') {
//     throw new Error('getRandomEmoji() did not return a string');
//   }
//   return emoji;
// }

// harness.addTest('getRandomEmoji sample test', testGetEmoji);



async function test_GetTeamPageFromName() {
  const teamName = 'Natus Vincere';
  const teamPage = await getTeamPageFromName(teamName); 

  if (teamPage !== 'https://liquipedia.net/counterstrike/Natus_Vincere') {
    throw new Error(`Expected 'https://liquipedia.net/counterstrike/Natus_Vincere' but got '${teamPage}'`);
  }

  return teamPage;
}

async function test_GetTeamPageFromNameNotFound() {
    const teamName = 'This Team Does Not Exist';
    try {
        const teamPage = await getTeamPageFromName(teamName);
        if (teamPage !== null) {
            throw new Error(`Expected null for non-existent team, but got '${teamPage}'`);
        }
    }
    catch (err) {
        if (err.message.includes('Search redirected to search results')) {
            return null; // Expected outcome for a non-existent team
        }
    }
    return teamPage;
}

async function test_GetTeamPageFromNameInvalidInput_1() {
    const teamName = '';
    try {
        const teamPage = await getTeamPageFromName(teamName);
        if (teamPage !== null) {
            throw new Error(`Expected null for empty string '${teamPage}'`);
        }
    }
    catch (err) {
        if (err.message.includes('Team name is required to fetch Liquipedia page')) {
            return null; // Expected outcome for a non-existent team
        }
    }
    return teamPage;
}

async function test_GetTeamPageFromNameInvalidInput_2() {
    const teamName = '   '; // String with only whitespace
    try {
        const teamPage = await getTeamPageFromName(teamName);
        if (teamPage !== null) {
            throw new Error(`Expected null for whitespace-only string '${teamPage}'`);
        }
    }
    catch (err) {
        if (err.message.includes('Team name is required to fetch Liquipedia page')) {
            return null; // Expected outcome for a non-existent team
        }
    }
    return teamPage;
}

async function test_GetTeamPageFromNameInvalidInput_3() {
    const teamName = NaN; // NaN
    try {
        const teamPage = await getTeamPageFromName(teamName);
        if (teamPage !== null) {
            throw new Error(`Expected null for NaN input '${teamPage}'`);
        }
    }
    catch (err) {
        if (err.message.includes('Team name is required to fetch Liquipedia page')) {
            return null; // Expected outcome for a non-existent team
        }
    }
    return teamPage;
}

async function test_GetTeamPageFromNameInvalidInput_4() {
    const teamName = null; // null
    try {
        const teamPage = await getTeamPageFromName(teamName);
        if (teamPage !== null) {
            throw new Error(`Expected null for null input '${teamPage}'`);
        }
    }
    catch (err) {
        if (err.message.includes('Team name is required to fetch Liquipedia page')) {
            return null; // Expected outcome for a non-existent team
        }
    }
    return teamPage;
}

function test_ExtractTeamNameFromLiquipediaUrl() {
    const url = 'https://liquipedia.net/counterstrike/Natus_Vincere';
    const teamName = extractTeamNameFromLiquipediaUrl(url);
    if (teamName !== 'Natus Vincere') { 
        throw new Error(`Expected 'Natus Vincere' but got '${teamName}'`);
    }
    return teamName;
}

function test_ExtractTeamNameFromLiqupediaURL_InvalidURL() {
    const url = 'https://liquipedia.net/counterstrike/';
    const teamName = extractTeamNameFromLiquipediaUrl(url);
    if (teamName !== '') { 
        throw new Error(`Expected empty string for invalid URL but got '${teamName}'`);
    }
    return teamName;
}

function test_ExtractTeamNameFromLiquipediaUrl_Encoded() {
    const url = 'https://liquipedia.net/counterstrike/Team%20Name_With%20Spaces';
    const teamName = extractTeamNameFromLiquipediaUrl(url);
    if (teamName !== 'Team Name With Spaces') { 
        throw new Error(`Expected 'Team Name With Spaces' but got '${teamName}'`);
    }
    return teamName;
}

function test_ExtractTeamNameFromLiquipediaUrl_TrailingSlash() {
    const url = 'https://liquipedia.net/counterstrike/Natus_Vincere/';
    const teamName = extractTeamNameFromLiquipediaUrl(url);
    if (teamName !== 'Natus Vincere') { 
        throw new Error(`Expected 'Natus Vincere' but got '${teamName}'`);
    }
    return teamName;
}

function test_ExtractTeamNameFromLiquipediaURL_NoUnderscores() {
    const url = 'https://liquipedia.net/counterstrike/Faze';
    const teamName = extractTeamNameFromLiquipediaUrl(url);
    if (teamName !== 'Faze') { 
        throw new Error(`Expected 'Faze' but got '${teamName}'`);
    }
    return teamName;
}

function test_ExtractTeamNameFromLiquipediaURL_empty() {
    const url = '';
    const teamName = extractTeamNameFromLiquipediaUrl(url);
    if (teamName !== '') { 
        throw new Error(`Expected empty string from empty URL but got '${teamName}'`);
    }
    return teamName;
}

//getTeamPageFromName tests
harness.addTest('getTeamPageFromName returns correct Liquipedia URL', test_GetTeamPageFromName);
harness.addTest('getTeamPageFromName returns null for non-existent team', test_GetTeamPageFromNameNotFound);
harness.addTest('getTeamPageFromName returns null for empty string input', test_GetTeamPageFromNameInvalidInput_1);
harness.addTest('getTeamPageFromName returns null for whitespace-only string input', test_GetTeamPageFromNameInvalidInput_2);
harness.addTest('getTeamPageFromName returns null for NaN input', test_GetTeamPageFromNameInvalidInput_3);
harness.addTest('getTeamPageFromName returns null for null input', test_GetTeamPageFromNameInvalidInput_4);


//extractTeamNameFromLiquipediaUrl tests
harness.addTest('extractTeamNameFromLiquipediaUrl returns correct team name', test_ExtractTeamNameFromLiquipediaUrl);
harness.addTest('extractTeamNameFromLiquipediaUrl returns empty string for invalid URL', test_ExtractTeamNameFromLiqupediaURL_InvalidURL);
harness.addTest('extractTeamNameFromLiquipediaUrl correctly decodes URL-encoded team names', test_ExtractTeamNameFromLiquipediaUrl_Encoded);    
harness.addTest('extractTeamNameFromLiquipediaUrl correctly handles trailing slashes', test_ExtractTeamNameFromLiquipediaUrl_TrailingSlash);
harness.addTest('extractTeamNameFromLiquipediaUrl correctly handles URLs without underscores', test_ExtractTeamNameFromLiquipediaURL_NoUnderscores);
harness.addTest('extractTeamNameFromLiquipediaUrl returns empty string for empty URL', test_ExtractTeamNameFromLiquipediaURL_empty);

harness.runTests().catch(console.error);