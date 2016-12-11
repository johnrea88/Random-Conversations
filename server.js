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
const COLLECT_NAME_FROM_USER_ACTION = 'collect_name_from_user'


app.get('/', function (request, response) {
  db.dbDump();
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Penpal is reinventing the way you think about communication. Coming soon.\n");
});


app.post('/', function (request, response) {
  console.log('headers: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));

  const assistant = new Assistant({request: request, response: response});
  let actionMap = new Map();
  actionMap.set(START_NEW_CHAT_ACTION, startNewChat);
  actionMap.set(COLLECT_NAME_FROM_USER_ACTION, collectNameFromUser);
  assistant.handleRequest(actionMap);

  function collectNameFromUser(assistant) {
    console.log('collectNameFromUser');
    let name = assistant.getArgument('name');
    let googleUserId = assistant.getUser().user_id;
    db.createUser(googleUserId, name);
    assistant.setContext('collect_message', 1);
    assistant.ask('While I work on finding you a new pen pal, let me get the first message you\'d like to send to your new friend.', ['What message would you like to send?']);
  };

  function startNewChat(assistant) {
    console.log('startNewChat');
    let userId = assistant.getUser().user_id;
    let user = db.getUserByGoogleUserId(userId);

    if (!user) {
      assistant.setContext('collect_name', 1);
      assistant.ask('It looks like you haven\'t told me your name yet. What name should I put on your messages for you?', ['I need your name before I can find you a pen pal.']);
      return;
    }

    let message = assistant.getArgument('message');
    db.startNewConversation(user, message);
    assistant.tell('Ok, I\'m working on sending your message. Check back in a few minutes for new replies!');
  }
});


var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});