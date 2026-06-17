import 'dotenv/config';

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function create_Thread(teamA, teamB, eventName, matchTime, hltvLink, channel_id, autoArchiveDuration = 1440) {
  /**
   * Creates a public thread in the specified channel with the name format "Team A vs Team B, Event - Year" and posts the HLTV link as the content in the thread.
   * Parameters:
   * - teamA: Name of the first team
   * - teamB: Name of the second team
   * eventName: Name of the event/tournament
   * matchTime: Year of the event/tournament
   * hltvLink: URL to the HLTV match page (optional)
   * channel_id: ID of the channel where the thread will be created
   * returns: { threadName, firstMessage }
   */
  if (!channel_id) throw new Error('channelId is required to create a thread');
  
  const current_year = new Date().getFullYear();
  const threadName = `${teamA} vs ${teamB} @ ${matchTime}, ${eventName} - ${current_year}`;
  // Ensure thread name length meets Discord limits (100 chars)
  const name = threadName.length > 100 ? threadName.slice(0, 100) : threadName;
  if (!threadName) throw new Error('threadName is required to create a thread');

  const threadContent = 'no HLTV link available'; // default content if no HLTV link provided

  // set content to hltv link if available, otherwise default message
  if (hltvLink) {
    threadContent = hltvLink;
  }

  // Create the thread with the title
  const createBody = {
    name,
    auto_archive_duration: autoArchiveDuration,
    type: 11, // GUILD_PUBLIC_THREAD
    content: threadContent
  };

  const createRes = DiscordRequest(`channels/${channel_id}/threads`, { method: 'POST', body: createBody });
  return { threadName, threadContent };
}

//TODO test and see if this actually works
function to24(timeStr) {
  const m = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const mer = m[3] ? m[3].toUpperCase() : null;
  if (mer) {
    if (mer === 'AM' && hh === 12) hh = 0;
    if (mer === 'PM' && hh < 12) hh += 12;
  }
  return String(hh).padStart(2, '0') + ':' + mm;
}

/**
 * Finds the correct carousel item based on the primary team name and future date.
 * @param {string} html - The HTML content to search.
 * @param {string} primaryTeamName - The name of the primary team.
 * @returns {string} - The HTML of the first future and carousel item.
 */
function findFirstFutureCarouselItem(html, primaryTeamName) {
  // Locate the carousel-content section
  const carouselIndex = html.indexOf('class="carousel-content"');
  if (carouselIndex === -1) {
    throw new Error('No upcoming matches carousel found');
  }

  const carouselHtml = html.slice(carouselIndex);
  const itemRegex = /<div[^>]*class="carousel-item"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
  let match;
  const now = Math.floor(Date.now() / 1000);
  const normalizedPrimary = primaryTeamName ? primaryTeamName.trim().toLowerCase() : '';

  while ((match = itemRegex.exec(carouselHtml))) {
    const itemHtml = match[0];
    const timestampMatch = itemHtml.match(/<[^>]*class=["'][^"']*timer-object[^"']*["'][^>]*data-timestamp=["']?(\d+)["']?/i)
      || itemHtml.match(/data-timestamp=["']?(\d+)["']?/i);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;

    if (!timestamp || timestamp <= now) {
      continue;
    }

    if (normalizedPrimary && itemHtml.toLowerCase().includes(normalizedPrimary)) {
      return itemHtml;
    }

  }

  throw new Error('No upcoming future matches found in carousel');
}

function retrieveMatchTimeFromCarouselItem(itemHtml) {
  /**
   * retrieves discord timestamp that auto-translates for whoever views it
   * returns { matchTime }
   */
  if (!itemHtml || typeof itemHtml !== 'string') {
    throw new Error('Carousel item HTML is required');
  }

  const timestampMatch = itemHtml.match(/data-timestamp=["']?(\d+)["']?/);
  if (!timestampMatch) {
    throw new Error('Could not find a match timestamp in carousel item');
  }

  const timestamp = timestampMatch[1];
  
  return `<t:${timestamp}:F>`;
}

function retrieveTeamNamesFromCarouselItem(itemHtml, PrimaryTeamName) {
  /**
   * Helper to extract the first two team names from the item
   * Ensure that PrimaryTeamName is one of the teamNames and returned as teamA
   * returns { teamA, teamB }
   */

  // Find all span elements named "name" this is where the names are stored in the carousel item
  const nameRegex = /<span class="name"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g;
  const matches = [];
  let match;
  
  while ((match = nameRegex.exec(itemHtml)) !== null) {
    matches.push(match[1].trim());
  }
  
  if (matches.length < 2) {
    throw new Error('Could not find two teams in carousel item');
  }
  
  // Normalize for comparison (case-insensitive)
  const normalize = (str) => str.trim().toLowerCase();
  const primaryNorm = normalize(PrimaryTeamName);
  
  // Find the primary team and ensure it's teamA
  let teamA, teamB;
  const primaryIndex = matches.findIndex(team => normalize(team) === primaryNorm);
  
  if (primaryIndex !== -1) {
    teamA = matches[primaryIndex];
    teamB = matches[primaryIndex === 0 ? 1 : 0];
  } else {
    // If primary not found, use first two teams found
    teamA = matches[0];
    teamB = matches[1];
  }
  
  return { teamA, teamB };
}

function retrieveTournamentLinkFromCarouselItem(itemHtml) {
  /**
   * retrieves the full tournament name and link if available
   * returns { fullTournamentName, tournamentPageLiqupediaLink }
   */
  if (!itemHtml || typeof itemHtml !== 'string') {
    return { fullTournamentName: null, tournamentPageLiqupediaLink: null };
  }

  const anchorMatch = itemHtml.match(/<a[^>]*href=["'](\/counterstrike[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (!anchorMatch) {
    return { fullTournamentName: null, tournamentPageLiqupediaLink: null };
  }

  const tournamentPageLiqupediaLink = anchorMatch[1];
  const anchorContent = anchorMatch[2];
  const spanTextMatch = anchorContent.match(/<span[^>]*>([^<]+)<\/span>/i);
  const fullTournamentName = spanTextMatch
    ? spanTextMatch[1].trim()
    : anchorContent.replace(/<[^>]+>/g, '').trim() || null;

  return { fullTournamentName, tournamentPageLiqupediaLink };
}

export function getHTMLFromLiqupediaLink(liqupediaLink) {
  /*
   * Fetches the HTML of a Liquipedia tournament page.
  * This is a middle layer helper function, so that both single team match getters, and entire tournament match getters can use it without constantly
  * fetching the same page multiple times.
  * attempts to fetch the HTML of the specified Liquipedia page.
   * @param {string} tournamentPageLiqupediaLink - The link to the Liquipedia tournament page.
   * @returns {Promise<{html: string, url: string}|null>} - The HTML of the tournament page and the URL of the page in case of redirect, or null if the request fails.
   */
  return (async () => {
    if (!liqupediaLink) return null;
    // normalize url
    let url = liqupediaLink;
    if (url.startsWith('/')) url = `https://liquipedia.net${url}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);
    return await { html: await res.text(), url: await res.url };
  })();
}


//TODO consider cleaning this up or breaking into smaller functions?
export function getNextTeamMatch(liquipediaPageLink) {
  /*
    Fetch the Liquipedia team page and scrape the next upcoming match from the carousel. 
    Priotizes finding the next match
     Returns an object: { teamA, teamB, fullTournamentName, hltvLink }
      hltvLink is optional and may be null if not found
  */
  return (async () => {
    if (!liquipediaPageLink) throw new Error('Liquipedia page link required');

    // Normalize URL (handle relative links)
    let url = liquipediaPageLink;
    if (url.startsWith('/')) url = `https://liquipedia.net${url}`;
    let html = null;
    try {
      
      
      //run this attempt to get a carousel 5 times, with a delay between each attempt if it still fails, oh well
      // this is half if liqupedia is down, and half because some pages redirect you several times
      // (g2 -> G2 -> G2_esports for example)
      for (let i = 0; i < 5; i++) {
        try {
          ({ html: html, url: url } = await getHTMLFromLiqupediaLink(url));
          const carouselIndex = html.indexOf('class="carousel-content"');
          if (carouselIndex !== -1) break;
          // search for the canonical URL of the page (liquipedia stores the canonical URL in a <link> tag) which is the actual URL of the page
          // if the url is different from the canonical url, update the url, it doesnt seem to notice the redirection for some reason
          const canonicalUrlMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
          const canonicalUrl = canonicalUrlMatch ? canonicalUrlMatch[1] : null;
          if (url !== canonicalUrl && canonicalUrl) {
            url = canonicalUrl;
          }

        } catch (error) {
          console.error(`Attempt ${i + 1} failed: ${error.message}`);
        }
        if (i < 4) await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second timeout, liqupedia is real nice about scraping, lets not abuse them eh?
      }
      if (!html) throw new Error('Failed to fetch team page after 5 attempts');

    } catch (error) {
      throw new Error(`Failed to fetch team page: ${error.message}`);
    }

    const carouselHtml = findFirstFutureCarouselItem(html, extractTeamNameFromLiquipediaUrl(liquipediaPageLink)); //TODO re-rewrite this method, it doesnt do what it says on the tin, it just returns the first carousel item, performs no checks
    const {teamA, teamB} = retrieveTeamNamesFromCarouselItem(carouselHtml, extractTeamNameFromLiquipediaUrl(liquipediaPageLink));
    const matchTime = retrieveMatchTimeFromCarouselItem(carouselHtml);
    const {fullTournamentName, tournamentPageLiqupediaLink} = retrieveTournamentLinkFromCarouselItem(carouselHtml);

    // Attempt to get HLTV link using external helper if available
    let hltvLink = null;
    try {
      // Fetch the tournament page HTML
      const { html: tournamentPageHTML, url: tournamentPageURL } = await getHTMLFromLiqupediaLink(tournamentPageLiqupediaLink);
      if (!tournamentPageHTML) {
        throw new Error('Failed to fetch tournament page HTML');
      }
      hltvLink = await getHLTVLinkFromTournamentPage(teamA, teamB, tournamentPageHTML);
    } catch (e) {
      // ignore errors from HLTV lookup — return null instead
      hltvLink = null;
    }


    return { teamA, teamB, fullTournamentName, matchTime, hltvLink };
  })();
}


export function getHLTVLinkFromTournamentPage(teamA, teamB, tournamentPageHTML) {
  /*
   * Extracts the HLTV link for a match between two teams from a tournament bracket page.
   * Searches through all matches in the bracket and finds the one with matching team names,
   * then extracts the HLTV link from the match popup.
   * @param {string} teamA - First team name
   * @param {string} teamB - Second team name
   * @param {string} tournamentPageHTML - The full HTML of the tournament page
   * @returns {string|null} - The HLTV link or null if not found
   */
  if (!tournamentPageHTML || typeof tournamentPageHTML !== 'string') {
    return null;
  }

  try {
    // Extract the bracket wrapper
    const bracketWrapperMatch = tournamentPageHTML.match(
      /<div[^>]*class="[^"]*brkts-bracket-wrapper[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i
    );
    if (!bracketWrapperMatch) {
      return null;
    }

    const bracketHTML = bracketWrapperMatch[0];

    // Normalize team names for comparison
    const normalize = (s = '') =>
      s
        .toString()
        .normalize('NFKD')
        .replace(/[_\-\u2013\u2014]+/g, ' ')
        .replace(/[^\w\s\.]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const teamANorm = normalize(teamA);
    const teamBNorm = normalize(teamB);

    // Find all matches in the bracket
    const matchRegex = /<div[^>]*class="[^"]*brkts-match\s+brkts-match-popup-wrapper[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
    let matchElement;

    while ((matchElement = matchRegex.exec(bracketHTML))) {
      const matchHTML = matchElement[0];

      // Extract team names from the match
      const teamNameRegex = /<div[^>]*class="[^"]*team-name-dynamic[^"]*"[^>]*data-team-name="([^"]+)"/gi;
      const teamNames = [];
      let teamMatch;

      while ((teamMatch = teamNameRegex.exec(matchHTML))) {
        teamNames.push(normalize(teamMatch[1]));
      }

      // If no team-name-dynamic elements, try extracting from span.name
      if (teamNames.length === 0) {
        const spanRegex = /<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/span>/gi;
        while ((teamMatch = spanRegex.exec(matchHTML))) {
          const text = teamMatch[1].trim();
          if (text && text !== 'TBD' && text !== 'vs' && text !== '(Bo3)' && text !== '(Bo5)') {
            teamNames.push(normalize(text));
          }
        }
      }

      // Check if this match contains both teams (order-agnostic)
      if (teamNames.length >= 2) {
        const hasTeamA = teamNames.some(name => name === teamANorm);
        const hasTeamB = teamNames.some(name => name === teamBNorm);

        if (hasTeamA && hasTeamB) {
          // Found the match, now extract the HLTV link from the popup
          const hltvMatch = matchHTML.match(
            /<a[^>]*href=["'](https?:\/\/(?:www\.)?hltv\.org\/matches\/[^"']+)["'][^>]*title="HLTV Matchpage"/i
          );
          if (hltvMatch) {
            return hltvMatch[1];
          }
        }
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function getTeamPageFromName(teamName) {
  if (!teamName || teamName.trim() === '') {
      throw new Error('Team name is required to fetch Liquipedia page');  
    }
  const searchUrl = `https://liquipedia.net/counterstrike/index.php?search=${encodeURIComponent(teamName)}`;
  
  
  try {
    //not has team name, but has URL parameters that indicate a search was performed, likely means the team page doesn't exist
    const response = await fetch(searchUrl, { redirect: 'follow' });
    const finalUrl = response.url;
    
    // Check if final URL contains the team name (or formatted version) and doesn't contain "index.php?search="
    // using liquipedia's search functionality to standardize team names and even to find them in the first place
    // I am just taking the result at face value and trusting liquipedia's search to lead me to the correct team page if it exists,
    if (finalUrl && !finalUrl.includes('index.php?search=')) {
      return finalUrl;
    } else {
      throw new Error(`Search redirected to search results, not a specific team page: ${finalUrl}`);
    }
  } catch (error) {
    throw new Error(`Failed to fetch Liquipedia page for "${teamName}": ${error.message}`);
  }
}

export function extractTeamNameFromLiquipediaUrl(url) {
  if (!url) return '';
  try {
    // Remove query string and trailing slashes
    const withoutQuery = url.split('?')[0].replace(/\/+$|^\s+|\s+$/g, '');
    const parts = withoutQuery.split('/');
    const last = parts[parts.length - 1] || '';
    // convert encoded parts and replace underscores with spaces (e.g., Team_Name -> Team Name)
    return decodeURIComponent(last).replace(/_/g, ' ');
  } catch (e) {
    return '';
  }
}