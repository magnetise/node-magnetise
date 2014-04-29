var http = require('http'),
    https = require('https'),
    util = require('util'),
    events = require('events');

var options = {
  hostname: 'magneti.se',
  headers: {},
  secure: false
};

function makeRequest( self, method, path, body ) {
  options.method = method;
  options.path = path;
  body = (body && body.length > 0 ? body + '&' : '') + 'apikey=' + self.apikey;

  if ( method === 'POST' && body ) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = body.length;
  }

  var req = (self.secure ? https : http).request(options);

  req.on('response', function( response ) {
    response.setEncoding('utf8');

    var data = '';

    response.on('data', function ( chunk ) {
      data += chunk;

      self.emit( 'data', chunk );
    });

    response.on('end', function () {
      var state = response.statusCode === 200 ? 'success' : 'error';
        , obj = JSON.parse(data);

      self.emit( state, obj );
    });
  });

  req.on('error', function(e) {
    var obj = JSON.parse(e);

    self.emit( 'error', obj );
  });

  if ( method === 'POST' && body ) {
    req.write( body );
  }

  req.end();

  return self;
}

util.inherits(Request, events.EventEmitter);


function SMSClient( apikey ) {
  events.EventEmitter.call(this);

  this.apikey = apikey;
}

util.inherits(SMSClient, events.EventEmitter);

SMSClient.prototype.send = function( from, to, message, campaign ) {
  var msg = 'message=' + message
      + '&from=' + from
      + '&to=' + to
      + '&campaign=' + campaign;

  return makeRequest( this, 'POST', '/api', msg );
}

module.exports = SMSClient;

/*

var Magnetise = require('magnetise');

var apikey = 'bWF0dG9uZm9vdDoxOGE1ZDQ3OC03NmIxLTRmZWItYjI0NS03YTM5MzM5NWMxN2I=';

var magnetise = new Magnetise( apikey );

magnetise.send( "Console", 4407808889993, "This is a test", "test" )
  .on( 'data', function( chunk ) {
    console.log( 'data:', chunk )
  })
  .on( 'success', function( data ) {
    console.log( 'credits:', data );
  })
  .on( 'error', function( err ) {
    console.log( 'error:', err )
  });

*/
