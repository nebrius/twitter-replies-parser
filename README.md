# Twitter Replies Parser

Uses the Twitter API to find all replies to a tweet and save them to a JSON file.

To run this application, you will first need to create a [Twitter App](https://developer.twitter.com/). I used a premium app for this, not a standard app, so YMMV if you try this with a standard app.

Then, you will need to clone this project and set the following environment variables:

- TWITTER_CONSUMER_KEY: your Consumer API Key
- TWITTER_CONSUMER_SECRET: your Consumer API secret key
- TWITTER_ACCESS_TOKEN: your access token, which you can create in the same page containing your Consumer API key
- TWITTER_ACCESS_SECRET: your access token secret

You can find these on your app page, which as of this writing looks like this:

![Twitter App Page showing all your keys](https://user-images.githubusercontent.com/1141386/53982209-2da67a80-40c9-11e9-8926-1c60eba09d6f.jpg)

Once you've configured everything, run this app with `npm start` and then open your browser to [http://localhost:8080](http://localhost:8080). Enjoy!

**Note:** Twitter doesn't have any APIs to _directly_ fetch the replies to a tweet, so this app uses an algorithm to try and find as many replies as it can. It is highly accurate, but not 100% accurate. Notably, it fails to pick up replies to tweets where the person replying excludes the author of the original tweet in the "reply-to" section.

## License

MIT License

Copyright (c) Bryan Hughes <bryan@nebri.us>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

