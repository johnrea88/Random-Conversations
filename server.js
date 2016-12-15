'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let Assistant = require('actions-on-google').ApiAiAssistant;
let express = require('express');
let bodyParser = require('body-parser');
let Database = require('./data-models').Database;

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json({type: 'application/json'}));

let db = new Database();

const START_NEW_CHAT_ACTION = 'start_new_chat';
const CHECK_FOR_MESSAGES_ACTION = 'check_for_messages';
const REPLY_TO_MESSAGE_ACTION = 'reply_to_message';
const READ_BACK_CHAT_HISTORY_ACTION = 'read_back_chat_history';
const COLLECT_NAME_FROM_USER_ACTION = 'collect_name_from_user';
const SUBMIT_MESSAGE_REPLY_ACTION = 'submit_message_reply';
const END_CONVERSATION_ACTION = 'end_conversation';


function sendHtmlFile(response, fileName) {
  response.sendFile(__dirname + '/html/' + fileName);
};

app.get('/', function (request, response) {
  db.dbDump();
  sendHtmlFile(response, 'index.html');
});


app.post('/', function (request, response) {
  console.log('headers: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));

  const assistant = new Assistant({request: request, response: response});
  let actionMap = new Map();
  actionMap.set(START_NEW_CHAT_ACTION, startNewChat);
  actionMap.set(CHECK_FOR_MESSAGES_ACTION, checkForNewMessages);
  actionMap.set(REPLY_TO_MESSAGE_ACTION, replyToMessage);
  actionMap.set(COLLECT_NAME_FROM_USER_ACTION, collectNameFromUser);
  actionMap.set(SUBMIT_MESSAGE_REPLY_ACTION, submitMessageReply);
  actionMap.set(END_CONVERSATION_ACTION, endConversation);
  assistant.handleRequest(actionMap);


  function checkForNewMessages(assistant) {
    console.log('checkForNewMessages');
    let googleUserId = assistant.getUser().user_id;
    let hasSentMessage = db.hasSentAMessage(googleUserId);
    if(!hasSentMessage) {
      // TODO: Tell the user they need to send a message before they can receive a reply
      assistant.tell('You have no new messages.');
      return;
    }
    let user = db.getUserByGoogleUserId(googleUserId);
    let unreadMessages = db.getUnreadMessages(user.id);
    if(unreadMessages.length === 0) {
      assistant.tell('You have no new messages.');
      return;
    }
    let messageCopy = 'messages';
    if(unreadMessages.length === 1) {
      messageCopy = 'message';
    }
    let prefixText = `You have ${unreadMessages.length} new ${messageCopy}.`;
    readMessage(assistant, unreadMessages[0], prefixText);
  };

  function replyToMessage(assistant) {
    console.log('replyToMessage');
    assistant.setContext('collect_message_reply', 1);
    assistant.ask('OK. What would you like to say?', ['Let me know what you\'d like to say for your reply.']);
  };

  function submitMessageReply(assistant) {
    console.log('submitMessageReply');
    let messageText = assistant.getArgument('message');
    let messageId = assistant.data.currentMessageId;
    if (!messageText || !messageId) assistant.tell('Looks like something went wrong. Try back in a few minutes.');
    let googleUserId = assistant.getUser().user_id;
    let user = db.getUserByGoogleUserId(googleUserId);
    db.replyToMessage(user.id, messageText, messageId);
    assistant.data.currentMessageId = null;
    handleNextMessage(assistant, 'Great. I\'ve sent your reply.', user);
  };

  function endConversation(assistant) {
    console.log('endConversation');
    db.endConversation(assistant.data.currentMessageId);
    assistant.data.currentMessageId = null;
    let googleUserId = assistant.getUser().user_id;
    let user = db.getUserByGoogleUserId(googleUserId);
    handleNextMessage(assistant, 'OK. I\'ve ended the conversation.', user);
  };

  function handleNextMessage(assistant, prefixText, user) {
    let unreadMessages = db.getUnreadMessages(user.id);
    if(unreadMessages.length === 0) {
      assistant.tell(`${prefixText} You have no more new messages.`);
      return;
    }
    let nextPrefixText = `${prefixText} Here is your next message.`;
    readMessage(assistant, unreadMessages[0], nextPrefixText);
  };

  function readMessage(assistant, message, prefixText) {
    message.markAsRead();
    let sentFromUserId = message.authoringUserId;
    let sentFromUser = db.getUserByUserId(sentFromUserId);
    let questionForUser = 'Would you like to reply? Or how about end the conversation.';
    let nextMessageText = `${prefixText} Your pal ${sentFromUser.name} said. ${message.text}. ${questionForUser}`;
    assistant.setContext('finished_reading_message', 1);
    assistant.data.currentMessageId = message.id;
    assistant.ask(nextMessageText);
  };

  function collectNameFromUser(assistant) {
    console.log('collectNameFromUser');
    let name = assistant.getArgument('name');
    let googleUserId = assistant.getUser().user_id;
    db.createUser(googleUserId, name);
    collectMessageHelper(assistant);
  };

  function collectMessageHelper(assistant) {
    console.log('collectMessageHelper');
    assistant.setContext('collect_message', 1);
    assistant.ask('While I work on finding you a new pen pal, let me get the first message you\'d like to send to your new friend.', ['What message would you like to send?']);
  };

  function startNewChat(assistant) {
    console.log('startNewChat');
    let googleUserId = assistant.getUser().user_id;
    let user = db.getUserByGoogleUserId(googleUserId);

    if (!user) {
      assistant.setContext('collect_name', 1);
      assistant.ask('It looks like you haven\'t told me your name yet. What name should I put on your messages for you?', ['I need your name before I can find you a pen pal.']);
      return;
    }

    let message = assistant.getArgument('message');
    if(!message) {
      collectMessageHelper(assistant);
      return;
    }

    db.startNewConversation(user, message);
    assistant.tell('Ok, I\'m working on sending your message. Check back in a few minutes for new replies!');
  }
});


var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});