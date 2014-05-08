var http = require('http'),
    https = require('https'),
    util = require('util'),
    events = require('events');

var defaults = {
  hostname: 'magneti.se',
  secure: false
};

function makeRequest( self, method, path, body ) {
  var options = {};
  options.hostname = defaults.hostname;
  options.port = options.secure ? 443 : 80;
  options.method = method;
  options.path = path;
  body = (body && body.length > 0 ? body + '&' : '') + 'apikey=' + self.apikey;

  if ( method === 'POST' && body ) {
    options.headers = {};
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = body.length;
  }

  var req = (options.secure ? https : http).request(options);

  req.on('response', function( response ) {
    response.setEncoding('utf8');

    var data = '';

    response.on('data', function ( chunk ) {
      data += chunk;

      self.emit( 'data', chunk );
    });

    response.on('end', function () {
      var status = response.statusCode
        , state = status > 200 && status < 300 ? 'success' : 'error'
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

  return makeRequest( this, 'POST', '/api/messages', msg );
}

module.exports = SMSClient;
