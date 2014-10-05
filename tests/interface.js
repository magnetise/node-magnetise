var should = require('chai').should();

var logs = [];
var _log = console.log;
var captureLog = function( line ) {
    logs.push( line );
};

describe('Local mode', function () {
    var MagnetiseClient = require('../lib/index.js');

    describe('with minimum valid parameters', function () {

        it('will emit a "begin" event', function ( done ) {
            var client = MagnetiseClient.Client();

            logs = [];
            console.log = captureLog;

            client
                .send( 'sender', '+0000000000000', 'will emit a "begin" event' )
                .on( 'begin', function( data ) {
                    should.exist( data );

                    data.should.have.property( 'hostname' );
                    data.hostname.should.equal( 'magneti.se' );
                    data.should.have.property( 'port' );
                    data.port.should.equal( 443 );
                    data.should.have.property( 'method' );
                    data.method.should.equal( 'POST' );
                    data.should.have.property( 'path' );
                    data.path.should.equal( '/api/messages' );
                    data.should.have.property( 'headers' );

                    data.headers.should.have.property( 'Content-Length' );
                })
                .on( 'success', function( data ) {
                    console.log = _log;

                    done();
                });
        });

        it('will emit a "success" event', function ( done ) {
            var client = MagnetiseClient.Client();

            logs = [];
            console.log = captureLog;

            client
                .send( 'sender', '+0000000000000', 'will emit a "success" event' )
                .on( 'success', function( data ) {
                    console.log = _log;

                    should.exist( data );

                    data.should.have.property( 'from' );
                    data.from.should.equal( 'sender' );
                    data.should.have.property( 'to' );
                    data.to.should.equal( '+0000000000000' );
                    data.should.have.property( 'message' );
                    data.message.should.equal( 'will emit a "success" event' );

                    data.should.have.property( 'received' );
                    data.should.have.property( 'live' );
                    data.live.should.equal( false );
                    data.should.have.property( 'messageid' );
                    data.should.have.property( 'cost' );
                    data.cost.should.equal( 0 );

                    done();
                });
        });

        it('and will log a message to the console', function ( done ) {
            var client = MagnetiseClient.Client();

            logs = [];
            console.log = captureLog;

            client
                .send( 'sender', '+0000000000000', 'will log a message to the console' )
                .on( 'success', function( data ) {
                    console.log = _log;

                    logs.length.should.be.greaterThan( 0 );

                    logs[0].should.equal( 'Sending message in local mode to "+0000000000000" with message "will log a message to the console"' );

                    done();
                });
        });
    });

    describe('will throw a validation error', function () {

        it('when "from" parameter is set to NULL', function () {
            var client = MagnetiseClient.Client();

            (function() {
                client.send( null, '+0000000000000', 'test message' );
            }).should.throw( '"from" is required and must not be an empty string' );
        });

        it('and when "to" parameter is set to NULL', function () {
            var client = MagnetiseClient.Client();

            (function() {
                client.send( 'sender', null, 'test message' );
            }).should.throw( '"to" is required and must not be an empty string' );
        });

        it('and when "message" parameter is set to NULL', function () {
            var client = MagnetiseClient.Client();

            (function() {
                client.send( 'sender', '+0000000000000', null );
            }).should.throw( '"message" is required and must be a valid string' );
        });

        it('and when "message" parameter is set to ""', function () {
            var client = MagnetiseClient.Client();

            (function() {
                client.send( 'sender', '+0000000000000', '' );
            }).should.throw( '"message" is required and must be a valid string' );
        });

        it('and when "message" parameter is set to 99', function () {
            var client = MagnetiseClient.Client();

            (function() {
                client.send( 'sender', '+0000000000000', 99 );
            }).should.throw( '"message" is required and must be a valid string' );
        });

    });

});
