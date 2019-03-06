const express = require('express');
const { json } = require('body-parser');
const { compile } = require('handlebars');
const { join } = require('path');
const { readFileSync } = require('fs');
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
  const [ , username, tweetId ] = idRegex.exec(new URL(tweetUrl).pathname);
  if (!username || !tweetId) {
    throw new Error(`Invalid tweet url "${tweetUrl}"`);
  }
  oauth.get(
    `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${username}&since_id=${tweetId}&exclude_replies=false`,
    process.env.TWITTER_ACCESS_TOKEN, //test user token
    process.env.TWITTER_ACCESS_SECRET, //test user secret
    (err, data, res) => {
      console.log(err, data, res);
    }
  );
  // oauth.post(
  //   'https://api.twitter.com/1.1/tweets/search/30day/dev.json',
  //   process.env.TWITTER_ACCESS_TOKEN, //test user token
  //   process.env.TWITTER_ACCESS_SECRET, //test user secret
  //   JSON.stringify({
  //     query: `to:${username}`
  //   }), // POST body
  //   'application/json', // POST type
  //   (err, data, res) => {
  //     if (err) {
  //       clientRes.sendStatus(500);
  //       throw err;
  //     }
  //     const parsedData = JSON.parse(data).results;

  //     const baseTweetIds = parsedData.filter((post) =>
  //       (post.id === tweetId || post.id_str === tweetId ||
  //         post.in_reply_to_status_id === tweetId || post.in_reply_to_status_id_str === tweetId) &&
  //       post.user.screen_name === username
  //       ).map((post) => post.id_str).concat([ tweetId ]);

  //     function traverse(tweetId) {
  //       const replies = parsedData.filter((post) => post.in_reply_to_status_id === tweetId || post.in_reply_to_status_id_str === tweetId);
  //       for (let i = 0; i < replies.length; i++) {
  //         replies[i] = [ replies[i], ...traverse(replies[i].id_str) ];
  //       }
  //       return replies;
  //     }

  //     let tweets = [];
  //     for (const baseTweetId of baseTweetIds) {
  //       tweets = tweets.concat(traverse(baseTweetId));
  //     }
  //     console.log(tweets);

  //     clientRes.send('ok');
  //   }
  // );
});

app.listen(PORT, () => console.log(`Twitter Replies server listening on port ${PORT}!`));
