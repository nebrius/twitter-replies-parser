const express = require('express');
const { json } = require('body-parser');
const { compile } = require('handlebars');
const { join } = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { OAuth } = require('oauth');

const PORT = 8080;
const idRegex = /^\/(.*?)\/status\/([0-9]*)$/;

const template = compile(readFileSync(join(__dirname, '..', 'views', 'index.handlebars'), 'utf-8'));

const app = express();
app.use(json());

if (!process.env.TWITTER_CONSUMER_KEY || !process.env.TWITTER_CONSUMER_SECRET) {
  throw new Error('You must define the TWITTER_CONSUMER_KEY and TWITTER_CONSUMER_SECRET environment variables');
}

if (!process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
  throw new Error('You must define the TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_SECRET environment variables');
}

const oauth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  process.env.TWITTER_CONSUMER_KEY,
  process.env.TWITTER_CONSUMER_SECRET,
  '1.0A',
  'http://localhost:8080',
  'HMAC-SHA1'
);

app.get('/', (req, res) => {
  res.send(template({}));
});

app.post('/api/analyze', (req, clientRes) => {
  const { tweetUrl } = req.body;
  const [ , username, rooTweetId ] = idRegex.exec(new URL(tweetUrl).pathname);
  const tweets = [];
  if (!username || !rooTweetId) {
    throw new Error(`Invalid tweet url "${tweetUrl}"`);
  }

  query();

  function query(next) {
    oauth.post(
      'https://api.twitter.com/1.1/tweets/search/30day/dev.json',
      process.env.TWITTER_ACCESS_TOKEN, //test user token
      process.env.TWITTER_ACCESS_SECRET, //test user secret
      JSON.stringify({
        query: `to:${username} OR from:${username}`,
        next
      }), // POST body
      'application/json', // POST type
      (err, data, res) => {
        if (err) {
          clientRes.sendStatus(500);
          throw err;
        }
        const parsedData = JSON.parse(data);
        tweets.push(...parsedData.results);
        if (parsedData.next) {
          query(parsedData.next);
        } else {
          processResults();
        }
      }
    );
  }

  function processResults() {
    // Create a dictionary of all tweets
    const tweetDictionary = {};
    for (const tweet of tweets) {
      tweetDictionary[tweet.id_str] = {
        replies: [],
        ...tweet
      };
    }
    if (!tweetDictionary.hasOwnProperty(rooTweetId)) {
      throw new Error(`Root tweet with ID ${rooTweetId} was not found in the results`);
    }
    const rootTweet = tweetDictionary[rooTweetId];
    const rootTweetDate = new Date(rootTweet.created_at).getTime();

    // Filter all results from before this tweet...it helps at least a little in the warning messages below
    for (const tweetId in tweetDictionary) {
      const tweet = tweetDictionary[tweetId];
      if (rootTweetDate > (new Date(tweet.created_at)).getTime()) {
        delete tweetDictionary[tweetId];
      }
    }

    // Link the replies to each tweet
    for (const tweetId in tweetDictionary) {
      if (tweetId === rooTweetId) {
        continue;
      }
      const tweet = tweetDictionary[tweetId];
      if (!tweet.in_reply_to_status_id_str) {
        if (tweet.text.indexOf('RT @') !== 0) {
          console.warn(`Tweet ${tweetId} has no reply to id: ${tweet.text}\n`);
        }
        continue;
      }
      if (!tweetDictionary.hasOwnProperty(tweet.in_reply_to_status_id_str)) {
        console.warn(`Tweet reply id ${tweet.in_reply_to_status_id_str} is missing in dictionary: ${tweet.text}\n`);
        continue;
      }
      tweetDictionary[tweet.in_reply_to_status_id_str].replies.push(tweet);
    }

    // TODO: collapse root tweets!

    function processTweet(thread, tweet) {
      thread.push({
        author: `${tweet.user.name} (@${tweet.user.screen_name})`,
        text: tweet.text
      });
      for (const reply of tweet.replies) {
        processTweet(thread, reply);
      }
      return thread;
    }
    const tweetThreads = rootTweet.replies.map((reply) => processTweet([], reply));
    let csvData = '';
    function escapeCSVField(text) {
      return text.replace(/\"/g, '""').replace(/\n/g, '\\\\n');
    }
    for (const thread of tweetThreads) {
      csvData += 'thread:,,\n';
      for (const reply of thread) {
        csvData += `,"${escapeCSVField(reply.author)}","${escapeCSVField(reply.text)}"\n`
      }
    }
    writeFileSync(join(__dirname, '..', `${username}.csv`), csvData);

    clientRes.send('ok');
  }
});

app.listen(PORT, () => console.log(`Twitter Replies server listening on port ${PORT}!`));
