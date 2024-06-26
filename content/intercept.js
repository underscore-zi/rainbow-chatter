/*
 * This is where most of the magic happens, it is running inside the DOM of a twitch page.
 * Basic idea is we redefine the `fetch` function so we can man-in-the-middle GraphQL requests. This gives us access to two import pieces of data:
 *   1. The /integrity request, the response contains the Client-Integrity header value we need to send with some GraphQL requests
 *   2. The standard /gql requests, this will give us the standard headers (such as the Oauth token, client-id, etc) we need to send to make our request look normal
 * We also redefine the WebSocket class so we can watch for chat messages send over the irc.twitch.tv websocket and trigger a color change when we see one.
 */ 

const __CONSOLE_PREFIX = "[🌈Rainbow Chatter] "

// Store the original references to hooked objects so we can call them later
let _saved_funcs = {
    "fetch": window.fetch,
    "WebSocket": window.WebSocket
};

// _saved_gql will hold the most recent /gql request headers so we can just copy them, this is stuff like Oauth, Client-Id, etc
let _saved_gql = null;

// The color change query requires we send the integrity token so we watch for /integrity requests and save the response here
let _integrity = null;

// We don't want to use the same color twice in a row so use this to track the current color
let _last_color = null;

// Debug mode, if true we will log a bunch of stuff to the console
let __debug = true;

// fetch(...) wrapper, intercepts /gql and /integrity requests for the two vars saved above
window.fetch = function() {
    u = new URL(arguments[0]);    

    if(u.hostname != 'gql.twitch.tv') {
        return _saved_funcs['fetch'].apply(this, arguments);
    }
    
    switch(u.pathname) {
        case '/gql':
            // Just saving the /gql request headers so we can reuse them for our own requests
            _saved_gql = arguments[1];
            if (arguments[1].method == "POST" && arguments[1]["body"] !== undefined) {
                if (arguments[1]["body"].indexOf("sendChatMessage")) {
                    randomColor()
                }
            }
            break;
        case '/integrity':
            return new Promise((resolve, reject) => {
                ret = _saved_funcs['fetch'].apply(this, arguments);
                ret.then((resp)=>{
                    resolve(resp.clone())
                    if (resp.status == 200) {
                        resp.json().then((data)=>{
                            debug("Integrity Response", data)
                            _integrity = data;
                        })
                    }
                }).catch((err)=>{reject(err)})
            })
    }
    return _saved_funcs['fetch'].apply(this, arguments);
}


// In order to watch for chat messages we need to hook the websocket class and watch for us to send a PRIVMSG
window.WebSocket = class extends _saved_funcs['WebSocket'] {
    constructor() {
        super(...arguments);
        this._url = arguments[0];
        if(this._url.indexOf('irc-ws.chat.twitch.tv') != -1) {
            this._saved_send = this.send;
            this.send = function() {
                if(arguments[0].indexOf('PRIVMSG') != -1) {
                    randomColor()
                }
                return this._saved_send.apply(this, arguments);
            }
        }
    }
}


function randomColor() {
    // Normal Twitch users only get a limited set of color to choose from, so we use those here.
    const colors = [
        'FF0000', '0000FF', '008000', 'B22222', 'FF7F50', '9ACD32', 'FF4500', '2E8B57', 'DAA520', 'D2691E', '5F9EA0', '1E90FF', 'FF69B4', '8A2BE2', '00FF7F'
    ]
    let color = colors[Math.floor(Math.random() * colors.length)];
    while(color == _last_color) {
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    _last_color = color;
    changeColor("#" + color)
}

function changeColor(color) {
    debug("Changing Color to ", color)
    if(_saved_gql == null) {
        error("/gql has not been intercepted yet")
        return false
    }
    if(_integrity == null) {
        error("/integrity has not been intercepted yet")
        return false
    }

    let endpoint = 'https://gql.twitch.tv/gql'
    let payload = `[{"operationName":"Chat_UpdateChatColor","variables":{"input":{"color":"${color}"}},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"0371259a74a3db4ff4bf4473d998d8ae8e4f135b20403323691d434f2790e081"}}}]`
    
    let headers = {}
    for (var key in _saved_gql.headers) {
        headers[key] = _saved_gql.headers[key];
    }
    headers['Client-Integrity'] = _integrity['token']

    let body = {
        headers:headers, 
        method: 'POST', 
        body: payload
    }

    debug("Color Change Request", body)
    let resp = _saved_funcs['fetch'].apply(this, [endpoint, body]);
    debug("Color Change Response", resp)

    return true
}


function debug() {
    if(!__debug) return;
    console.log.apply(this, [__CONSOLE_PREFIX, ...arguments])
}

function error() {
    console.error.apply(this, [__CONSOLE_PREFIX, ...arguments])
}

function info() {
    console.info.apply(this, [__CONSOLE_PREFIX, ...arguments])
}

window.rainbowChatter = {
    setDebug: function(newval) { if(newval != undefined) __debug = newval; return __debug; },
}



info("Now running...")