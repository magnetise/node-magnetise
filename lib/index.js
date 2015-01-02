var http = require('http'),
    https = require('https'),
    util = require('util'),
    events = require('events');

function makeRequest( msg ) {
    var body = 'message=' + msg.message +
        '&from=' + msg.from +
        '&to=' + msg.to +
        '&apikey=' + this.apikey;

    if (msg.tags) {
        body += '&tags=' + msg.tags;
    }

    var options = {
        hostname: this.hostname,
        port: this.secure ? 443 : 80,
        method: 'POST',
        path: '/api/messages',
        headers: {}
    };

    options.headers['Content-Length'] = body.length;

    var handler = ( this.apikey ? makePostRequest : makeLocalRequest );

    handler.call( this, options, msg, body );
}

function makeLocalRequest( options, msg, body ) {
    var log = 'Sending message in local mode to "' + msg.to +
        '" with message "' + msg.message + '"';

    var obj = {
        to: msg.to,
        from: msg.from,
        message: msg.message,
        received: new Date(),
        live: false,
        messageid: Date.now(),
        tags: msg.tags,
        cost: 0
    };

    setTimeout( function(){
        this.emit( 'begin', options );
    }.bind( this ), 0 );

    setTimeout( function(){
        if (console && console.log) {
            console.log( log );
        }
        this.emit( 'data', JSON.stringify( obj ) );
    }.bind( this ), 0 );

    setTimeout( function(){
        this.emit( 'success', obj );
    }.bind( this ), 0 );
}

function makePostRequest( options, msg, body ) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';

    var req = ( this.secure ? https : http ).request( options );

    req.on( 'response', function( response ) {
            response.setEncoding('utf8');

            var data = '';
            response.on( 'data', function ( chunk ) {
                data += chunk;

                this.emit( 'data', chunk );
            }.bind( this ));

            response.on( 'end', function () {
              var status = response.statusCode,
                  state = 'error';

              if ( status === 202 ) {
                state = 'success';
                data = JSON.parse( data );
              }

              this.emit( state, data );
            }.bind( this ));
        });

    req.on('error', function( e ) {
        this.emit( 'error', e );
    }.bind( this ));

    req.write( body );

    this.emit( 'begin', options );

    req.end();
}



// SMSClient

function SMSClient( apikey ) {
    if (!!apikey && apikey === '') {
        throw( new Error('a valid "apikey" is required') );
    }

    this.hostname = 'magneti.se';
    this.secure = true;
    this.apikey = apikey;

    events.EventEmitter.call( this );
}

util.inherits( SMSClient, events.EventEmitter );

SMSClient.prototype.send = function( from, to, message, tags ) {
    if ( !from || from.toString() === '' ) {
        throw( new Error( '"from" is required and must not be an empty string' ) );
    }
    if ( !to || to.toString() === '' ) {
        throw( new Error( '"to" is required and must not be an empty string' ) );
    }
    if ( typeof message !== 'string' || message === '' ) {
        throw( new Error( '"message" is required and must be a valid string' ) );
    }

    var msg = {
        from: from,
        to: to,
        message: message
    };
    if ( !!tags && tags.toString() !== '' ) {
        msg.tags = tags;
    }

    makeRequest.call( this, msg );

    return this;
};



// Exports

module.exports = {

    Client: function( apikey ) {
        return new SMSClient( apikey );
    }

};
