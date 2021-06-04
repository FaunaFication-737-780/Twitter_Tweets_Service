const http = require('http');
const path = require('path');
const express = require('express');
const socketIo = require('socket.io');
const needle = require('needle');
const config = require('dotenv').config();
const TOKEN = process.env.TWITTER_BEARER_TOKEN;
const PORT = process.env.PORT || 3004;
const app = express();
const bodyparser = require('body-parser')
const request = require('request');
const server = http.createServer(app);
const io = socketIo(server);


app.use(bodyparser.json())
const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
// eslint-disable-next-line max-len
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id';

const rules = [{ value: 'Biodiversity' }];

// Get stream rules
async function getRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    });
    // console.log(response.body);
    return response.body;
}

// Set stream rules
async function setRules() {
    const data = {
        add: rules,
    };

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
        },
    });

    return response.body;
}

// Delete stream rules
async function deleteRules(rules) {
    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map((rule) => rule.id);

    const data = {
        delete: {
            ids: ids,
        },
    };

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
        },
    });

    return response.body;
}

function streamTweets() {
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    });

    stream.on('data', (data) => {
        try {
            const json = JSON.parse(data);
            //console.log(json);
            //socket.emit('TweetData', json);
            const headersOpt = {
                "content-type": "application/json",
            };
            request({
                method: 'post',
                url: 'http://localhost:3000/Tweet',
                form: json,
                headers: headersOpt,
                json: true,
            }, function (error, response, body) {
                //Print the Response
                console.log(body);
            });
        } catch (error) {}
    });

    return stream;
}

let currentRules;

try {
    //   Get all stream rules
    currentRules = getRules();

    // Delete all stream rules
    deleteRules(currentRules);

    // Set rules based on array above
    setRules();
} catch (error) {
    console.error(error);
    process.exit(1);
}
streamTweets();

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
