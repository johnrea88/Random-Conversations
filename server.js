'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let Assistant = require('actions-on-google').ApiAiAssistant;
let express = require('express');
let bodyParser = require('body-parser');

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

const GENERATE_ANSWER_ACTION = 'generate_answer';
const CHECK_GUESS_ACTION = 'check_guess';
const START_NEW_CHAT_ACTION = 'start_new_chat';

app.post('/', function (request, response) {
  console.log('headers: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));

  const assistant = new Assistant({request: request, response: response});

  function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAnswer(assistant) {
    console.log('generateAnswer');
    var answer = getRandomNumber(0, 100);
    assistant.data.answer = answer;
    assistant.ask('I\'m thinking of a number from 0 and 100. What\'s your first guess?');
  }

 function checkGuess(assistant) {
      console.log("BAR TEST: " + assistant.data.foo);
      assistant.data.foo = "bar";
      console.log('checkGuess');
      console.log('getRawInput(): ' + assistant.getRawInput());
      let answer = assistant.data.answer;
      let guess = parseInt(assistant.getArgument('guess'));
      if (answer > guess) {
       assistant.ask('It\'s higher than ' + guess + '. What\'s your next guess?');
      } else if (answer < guess) {
       assistant.ask('It\'s lower than ' + guess + '. Next guess?');
      } else {
        assistant.tell('Congratulations, that\'s it! I was thinking of ' + answer);
      }
  }

  function startNewChat(assistant){
    console.log('startNewChat');
    let message = assistant.getArgument('message');
    let name = assistant.getArgument('name');
    console.log('message: ' + message);
    console.log('name: ' + name);
    console.log('getRawInput: ' + assistant.getRawInput());
    assistant.tell('Your chat is being setup. Check back in a few minutes for new messages');
  }

  let actionMap = new Map();
  actionMap.set(GENERATE_ANSWER_ACTION, generateAnswer);
  actionMap.set(CHECK_GUESS_ACTION, checkGuess);
  actionMap.set(START_NEW_CHAT_ACTION, startNewChat);

  assistant.handleRequest(actionMap);
});

// Start the server
var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});