const http = require('http');
const path = require('path');
const express = require('express');
const socketIo = require('socket.io');
const needle = require('needle');
const config = require('dotenv').config();
const TOKEN = process.env.TWITTER_BEARER_TOKEN;
const PORT = process.env.PORT || 3000;

const app = express();

const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'public', 'index.html'));
});

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

function streamTweets(socket) {
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    });

    stream.on('data', (data) => {
        try {
            const json = JSON.parse(data);
            // console.log(json);
            socket.emit('TweetData', json);
        } catch (error) {}
    });

    return stream;
}

io.on('connection', async(socket) => {
    console.log('Client connected...');

    let currentRules;

    try {
        //   Get all stream rules
        currentRules = await getRules();

        // Delete all stream rules
        await deleteRules(currentRules);

        // Set rules based on array above
        await setRules();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
    streamTweets(io);
    socket.on('disconnect', () => {
        console.log('Client is disconnected..');
        process.exit(1);
    });
});


server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
