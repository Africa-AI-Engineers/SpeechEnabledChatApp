// ChatEngine = ChatEngineCore.create({
//     publishKey: '<PubNub Publish Key>',
//     subscribeKey: '<PubNub Subscribe Key>'
// });

ChatEngine = ChatEngineCore.create({
    publishKey: 'pub-c-27973a3a-de7b-4e77-ba35-7f006c0e1a40',
    subscribeKey: 'sub-c-7c59f4da-ad3b-11e8-a4a4-da4a4ec5c754'
});

// use a helper function to generate a new profile
let newPerson = generatePerson(true);

// create a bucket to store our ChatEngine Chat object
let myChat;

// create a bucket to store 
let me;

// compile handlebars templates and store them for use later
let peopleTemplate = Handlebars.compile($("#person-template").html());
let meTemplate = Handlebars.compile($("#message-template").html());
let userTemplate = Handlebars.compile($("#message-response-template").html());

const source_language = "en";
const target_language = "es";

var AUDIO_FORMATS = {
            'ogg_vorbis': 'audio/ogg',
            'mp3': 'audio/mpeg',
            'pcm': 'audio/wave; codecs=1'
        };

var supportedFormats;
var player;
var speechEnabled = false;

// this is our main function that starts our chat app
const init = () => {
  
  //First things first, check for the the browser's audio capabilities
  player = document.getElementById('player');
  supportedFormats = getSupportedAudioFormats(player);

  if (supportedFormats.length === 0) {
      submit.disabled = true;
      alert('The web browser in use does not support any of the' +
            ' available audio formats. Please try with a different' +
            ' one.');
  } else {

    // connect to ChatEngine with our generated user
    ChatEngine.connect(newPerson.uuid, newPerson);

    // when ChatEngine is booted, it returns your new User as `data.me`
    ChatEngine.on('$.ready', function(data) {

        // store my new user as `me`
        me = data.me;

        // create a new ChatEngine Chat
        myChat = new ChatEngine.Chat('chatengine-demo-chat');

        // when we recieve messages in this chat, render them
        myChat.on('message', (message) => {
            renderMessage(message);
        });

        // when a user comes online, render them in the online list
        myChat.on('$.online.*', (data) => {   
          $('#people-list ul').append(peopleTemplate(data.user));
        });

        // when a user goes offline, remove them from the online list
        myChat.on('$.offline.*', (data) => {
          $('#people-list ul').find('#' + data.user.uuid).remove();
        });

        // wait for our chat to be connected to the internet
        myChat.on('$.connected', () => {

            // search for 50 old `message` events
            myChat.search({
              event: 'message',
              limit: 50
            }).on('message', (data) => {
              
              console.log(data)
              
              // when messages are returned, render them like normal messages
              renderMessage(data, true);
              
            });
          
        });

        // bind our "send" button and return key to send message
        $('#sendMessage').on('submit', sendMessage)

      });

      $("#speechButton").click(function(){

        if(speechEnabled){
          speechEnabled = false;
          $("#speechButton").css("background-color","#d4e2dd");

        } else {
          speechEnabled = true;
          $("#speechButton").css("background-color","#4ceab1");
        }

      })

  }

  
};

// send a message to the Chat
const sendMessage = () => {

    // get the message text from the text input
    let message = $('#message-to-send').val().trim();
  
    // if the message isn't empty
    if (message.length) {
      
        // emit the `message` event to everyone in the Chat
        myChat.emit( 'message', {
            text: message,
            translate: {
                text: message,
                source: source_language,
                target: target_language
            },
            polly: {
              text:message
            }
        } );

        // clear out the text input
        $('#message-to-send').val('');
    }
    
    // stop form submit from bubbling
    return false;
  
};

// render messages in the list
const renderMessage = (message, isHistory = false) => {

    // use the generic user template by default
    let template = userTemplate;

    // if I happened to send the message, use the special template for myself
    if (message.sender.uuid == me.uuid) {
        template = meTemplate;
    }

    let el = template({
        messageOutput: message.data.text,
        time: getCurrentTime(),
        user: message.sender.state
    });

    console.log(message.data);

    // render the message
    if(isHistory) {
      $('.chat-history ul').prepend(el); 
    } else {
      
      if(speechEnabled && message.sender.uuid != me.uuid){

        player.src = '/read?voiceId=' +
                        encodeURIComponent("Aditi") +
                        '&text=' + encodeURIComponent(message.data.text) +
                        '&outputFormat=' + supportedFormats[0];
        player.play();

      }

      $('.chat-history ul').append(el);

    }
  
    // scroll to the bottom of the chat
    scrollToBottom();

};

// scroll to the bottom of the window
const scrollToBottom = () => {
    $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight);
};

// get the current time in a nice format
const getCurrentTime = () => {
    return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
};

/**
* Returns a list of audio formats supported by the browser
*/
function getSupportedAudioFormats(player) {
    return Object.keys(AUDIO_FORMATS)
        .filter(function (format) {
            var supported = player.canPlayType(AUDIO_FORMATS[format]);
            return supported === 'probably' || supported === 'maybe';
         });
}

// boot the app
init();
