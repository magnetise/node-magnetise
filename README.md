Magnetise client for NodeJS
===========================

Getting Started
---------------

The very simplest way to send an SMS Message with magneti.se is by `POST`ing to
`http://magneti.se/api` with properties encoded in the query string or in the body
of the request.

POST Properties
---------------

The properties are:

* to: This is the destination number for the message, it should be in international format.
* from: This can either be a source number again in international format or a description.
* message: This is the message to be sent, unicode characters are not permitted.
* apikey: Your api key from your account page.
* campaign: If you want to mark a message as part of a campaign, this is strongly recommended. It can be any text string.

```node
var Magnetise = require('node-magnetise');

var apikey = 'bWF0dG9uZm9vdDoxOGE1ZDQ3OC03NmIxLTRmZWItYjI0NS03YTM5MzM5NWMxN2I=';

var magnetise = new Magnetise( apikey );

magnetise.send( "Console", 4407808889993, "This is a test", "test" )
  .on( 'success', function( data ) {
    console.info( 'send:', data );
  })
  .on( 'error', function( err ) {
    console.error( 'error:', err );
  });
```

The client will emit a success event to indicate that the request has been
received correctly and is being processed.

It will also contain a JSON object with some details about the message to be sent

* From: The from number or text for the message
* To: The destination number for the message
* Message: The message that was sent
* Received: When the message was sent
* Live: Whether the live Api Key was used
* MessageId: A GUID that uniquely identifies the message
* Campaign: The campaign that the message is associated with
