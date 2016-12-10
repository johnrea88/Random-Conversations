'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let Assistant = require('actions-on-google').ApiAiAssistant;
let express = require('express');
let bodyParser = require('body-parser');
let Database = require('./data-models').Database;

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

let db = new Database();

const START_NEW_CHAT_ACTION = 'start_new_chat';
const CHECK_FOR_MESSAGES_ACTION = 'check_for_messages';
const REPLY_TO_MESSAGE_ACTION = 'reply_to_message';
const END_CONVERSATION_ACTION = 'end_conversation';
const READ_BACK_CHAT_HISTORY_ACTION = 'read_back_chat_history';


app.get('/', function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Penpal is reinventing the way you think about communication. Coming soon.\n");
});


app.post('/', function (request, response) {
  console.log('headers: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));

  const assistant = new Assistant({request: request, response: response});
  let actionMap = new Map();
  actionMap.set(START_NEW_CHAT_ACTION, startNewChat);
  assistant.handleRequest(actionMap);

  function startNewChat(assistant) {
    console.log('startNewChat');
    let message = assistant.getArgument('message');
    let name = assistant.getArgument('name');
    assistant.tell('Your chat is being setup. Check back in a few minutes for new messages');
  }
});


var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});