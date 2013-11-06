var http = require('http'),
    https = require('https'),
    util = require('util'),
    events = require('events');

var options = {
  hostname: 'www.smsmessagesender.com',
  headers: {},
  secure: true
};

function Request( apikey, secure, method, path, body ) {
  events.EventEmitter.call(this);
  
  var self = this;
  
  options.method = method;
  options.path = path;
  options.headers.authorization = 'Basic ' + apikey;
  
  if ( method === 'POST' && body ) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = body.length;
  }

  var req = (secure ? https : http).request(options);
  
  if ( method === 'POST' && body ) {
    req.write( body );
  }
  
  req.on('response', function(response) {    
    response.setEncoding('utf8');
    
    var data = '';
    
    response.on('data', function ( chunk ) {    
      data += chunk;
    });
    
    response.on('end', function () {      
      var obj = JSON.parse(data);
      
      if (response.statusCode !== 200) {        
        self.emit( 'error', obj );
        
        return;
      }
      
      self.emit( 'success', obj );
    });
  });

  req.on('error', function(e) {
    var obj = JSON.parse(e);
    
    self.emit( 'error', obj );
  });
  
  req.end();
}

util.inherits(Request, events.EventEmitter);


function SMSClient( apikey, secure ) {
  events.EventEmitter.call(this);
  
  this.apikey = apikey;
  this.secure = secure;
}

util.inherits(SMSClient, events.EventEmitter);

SMSClient.prototype.send = function( originator, recipient, message, deliveryDateTime ) {
  var msg = 'message=' + message + '&originator=' + originator + '&recipient=' + recipient;
  
  if ( deliveryDateTime ) {
    msg += '&deliveryDateTime=' + deliveryDateTime
  }
  
  return new Request( this.apikey, this.secure, 'POST', '/api/sendsms', msg );
}

SMSClient.prototype.list = function() {
  return new Request( this.apikey, this.secure, 'GET', '/api/sms/ids' );
}

SMSClient.prototype.get = function( messageId ) {
  return new Request( this.apikey, this.secure, 'GET', '/api/sms/details?Id=' + messageId );
}

SMSClient.prototype.incoming = function( start, end ) {
  return new Request( this.apikey, this.secure, 'GET', '/api/incomingsms?startdate=' + start + '&enddate=' + end );
}

SMSClient.prototype.credits = function() {
  return new Request( this.apikey, this.secure, 'GET', '/api/usercredits' );
}

var apikey = 'bWF0dG9uZm9vdDoxOGE1ZDQ3OC03NmIxLTRmZWItYjI0NS03YTM5MzM5NWMxN2I=';

var sms = new SMSClient( apikey );
/*
sms.credits()
  .on( 'success', function( data ) {  
    console.log( 'credits:', data );
  })
  .on( 'error', function( err ) {
    console.log( 'error:', err )
  });

sms.list()
  .on( 'success', function( data ) {  
    console.log( 'list:', data );
  })
  .on( 'error', function( err ) {
    console.log( 'error:', err )
  });
  
sms.get( 0 )
  .on( 'success', function( data ) {  
    console.log( 'get:', data );
  })
  .on( 'error', function( err ) {
    console.log( 'error:', err )
  });

sms.incoming( '2013-01-01%2000:00:00', '2013-02-01%2000:00:00' )
  .on( 'success', function( data ) {  
    console.log( 'incoming:', data );
  })
  .on( 'error', function( err ) {
    console.log( 'error:', err )
  });
*/







