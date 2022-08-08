//cmd: node index.js
const express = require('express');
const app = express();
const http = require('http');

/*
var https = require('https');
var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};
*/

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var axios = require("axios").default;
var access_token;

app.get('/', (req, res) => {

  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => 
{
    console.log('a user connected');
    
    //getAppAccessToken();
    
    socket.on("message", async (message) =>{
        console.log("Got message");
        var data = JSON.parse(message);
        
        switch(data.type)
        {
            case 'code':
                socket.userOptions = 
                {
                    method: 'POST',
                    url: 'https://us.battle.net/oauth/token',
                    data: new URLSearchParams({
                        grant_type: 'authorization_code',
                        scope: 'openid',
                        code: data.code,
                        redirect_uri: 'http://localhost:3000',
                        client_id: 'c86cb45977ad440295eda4f417d72a6a',
                        client_secret: 'F529sxqaRFGBHs1OyBjdsDtfB1sbdyEw'
                        })    
                };

                //Get the user info
                socket.battletag = await getUserTokenAndInfo(socket.userOptions);
                //console.log("Battletag: " + socket.battletag);
                socket.emit("message", JSON.stringify({type:'battletag', battletag: socket.battletag}));
                break;
        }
    });

    socket.on('disconnect', () => 
    {
        console.log('user disconnected');
    });

  });

server.listen(3000, () => 
{
    console.log('listening on *:3000');
});

/**
 * Function for calling the battle.net API. 
 */
//Calls for user API (Authorization Code Flow)
const getUserTokenAndInfo = async (userOptions) =>
{
    try{
        const response = await axios.request(userOptions)
        //console.log("access_token: " + response.data.access_token);  
        return getUserInfo(response.data.access_token);
    }catch(error) {
        console.error(error);
    };
}

const getUserInfo = async (access_token) =>
{
    //console.log("Access token in user info: " + access_token);
    var userInfoOptions = 
        {
            method: 'GET',
            url: 'https://us.battle.net/oauth/userinfo',
            headers: {Authorization: "Bearer " + access_token},
        }

    try{
        const response = await axios.request(userInfoOptions);
        //console.log(response.data);
        return response.data.battletag;
    }catch(error){
        //console.error(error);
    };

}

//Calls for application (Client Credentials Flow)
function getAppAccessToken()
{
    var options = 
    {
        method: 'POST',
        url: 'https://us.battle.net/oauth/token',
        data: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'c86cb45977ad440295eda4f417d72a6a',
        client_secret: 'F529sxqaRFGBHs1OyBjdsDtfB1sbdyEw'

         })
    };

    axios.request(options).then(function (response) 
    {
        //console.log(response.data);
        access_token = response.data.access_token;        
        getHSInfo('https://us.api.blizzard.com/data/wow/token/?namespace=dynamic-us',access_token);
    
    })
    .catch(function (error) 
    {
        console.error(error);
    });
}

function getHSInfo(url, access_token)
{
    var access_options = 
    {
        method: 'GET',
        url: url,
        headers: {Authorization: "Bearer " + access_token},
    };

    axios.request(access_options).then(function (response)
        {
            console.log(response.data);
        })
            .catch(function (error) 
            {
            console.error(error);
        });
}
