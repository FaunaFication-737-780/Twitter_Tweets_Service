
const express = require('express');

const app = express()
const PORT = process.env.PORT || 3004
const bodyParser = require('body-parser');


// parse application/x-www-form-urlencoded
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));




app.post('/', (req,res)=>{
    console.log(req.body);
    res.json(req.body)
})

(async () => {
    const rawResponse = await fetch('http://localhost:3004', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({a: 1, b: 'Textual content'})
    });
    const content = await rawResponse.json();
    console.log(content);
})();


app.listen(PORT,()=>{
    console.log('server started on port '+PORT)
})
