// Copyright 2013 Matt SMith.  All rights reserved. Based on code by Mark Cavage, Inc

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var http = require('http');
var https = require('https');
var os = require('os');
var querystring = require('querystring');
var url = require('url');
var util = require('util');

var assert = require('assert-plus');
var backoff = require('backoff');
var KeepAliveAgent = require('keep-alive-agent');
var mime = require('mime');
var once = require('once');



// Globals

/* JSSTYLED */
var VERSION = JSON.parse(fs.readFileSync(require('path').normalize(__dirname + '/../package.json'), 'utf8')).version;



// Helpers

function cloneRetryOptions(options, defaults) {
        if (options === false) {
                return ({
                        minTimeout: 1,
                        maxTimeout: 2,
                        retries: 1
                });
        }

        assert.optionalObject(options, 'options.retry');
        var r = options || {};
        assert.optionalNumber(r.minTimeout, 'options.retry.minTimeout');
        assert.optionalNumber(r.maxTimeout, 'options.retry.maxTimeout');
        assert.optionalNumber(r.retries, 'options.retry.retries');
        assert.optionalObject(defaults, 'defaults');
        defaults = defaults || {};

        return ({
                minTimeout: r.minTimeout || defaults.minTimeout || 1000,
                maxTimeout: r.maxTimeout || defaults.maxTimeout || Infinity,
                retries: r.retries || defaults.retries || 4
        });
}


function defaultUserAgent() {
        var UA = 'sms-message-sender-js/' + VERSION +
                ' (' + os.arch() + '-' + os.platform() + '; ' +
                'v8/' + process.versions.v8 + '; ' +
                'OpenSSL/' + process.versions.openssl + ') ' +
                'node/' + process.versions.node;

        return (UA);
}


function ConnectTimeoutError(ms) {
        if (Error.captureStackTrace)
                Error.captureStackTrace(this, ConnectTimeoutError);

        this.message = 'connect timeout after ' + ms + 'ms';
        this.name = 'ConnectTimeoutError';
}
util.inherits(ConnectTimeoutError, Error);


function rawRequest(opts, cb) {
        assert.object(opts, 'options');
        assert.func(cb, 'callback');

        cb = once(cb);

        var proto = opts.protocol === 'https:' ? https : http;
        var timer;

        if (opts.connectTimeout) {
                timer = setTimeout(function connectTimeout() {
                        timer = null;
                        if (req) {
                                req.abort();
                        }

                        var err = new ConnectTimeoutError(opts.connectTimeout);
                        cb(err, req);
                }, opts.connectTimeout);
        }

        var req = proto.request(opts, function onResponse(res) {
                clearTimeout(timer);

                var err;
                if (res.statusCode >= 400)
                        err = res.statusCode;

                req.removeAllListeners('error');
                req.removeAllListeners('socket');
                req.emit('result', (err || null), res);
        });

        req.on('error', function onError(err) {
                clearTimeout(timer);

                cb(err, req);
                if (req) {
                        process.nextTick(function () {
                                req.emit('result', err, null);
                        });
                }
        });

        req.once('upgrade', function onUpgrade(res, socket, _head) {
                clearTimeout(timer);

                var err;
                if (res.statusCode >= 400)
                        err = res.statusCode;

                req.removeAllListeners('error');
                req.removeAllListeners('socket');
                req.emit('upgradeResult', (err || null), res, socket, _head);
        });

        req.once('socket', function onSocket(socket) {
                if (socket.writable && !socket._connecting) {
                        clearTimeout(timer);
                        cb(null, req);
                        return;
                }

                socket.once('connect', function onConnect() {
                        clearTimeout(timer);
                        if (opts._keep_alive)
                                socket.setKeepAlive(true);
                        cb(null, req);
                });
        });
} // end `rawRequest`



// API

function HttpClient(options) {
        assert.object(options, 'options');
        assert.optionalObject(options.headers, 'options.headers');
        assert.optionalString(options.url, 'options.url');

        EventEmitter.call(this);

        var self = this;

        this.agent = options.agent;
        this.connectTimeout = options.connectTimeout || false;
        this.headers = options.headers || {};

        this.retry = cloneRetryOptions(options.retry);
        this.url = options.url ? url.parse(options.url) : {};

        this.headers.accept = 'application/json';

        if (this.agent === undefined) {
                var Agent;
                var maxSockets;

                if (this.url.protocol === 'https:') {
                        Agent = KeepAliveAgent.Secure;
                        maxSockets = https.globalAgent.maxSockets;
                } else {
                        Agent = KeepAliveAgent;
                        maxSockets = http.globalAgent.maxSockets;
                }

                this.agent = new Agent({
                        maxSockets: maxSockets,
                        maxKeepAliveRequests: 0,
                        maxKeepAliveTime: 0
                });
                this._keep_alive = true;
        }
}
util.inherits(HttpClient, EventEmitter);
module.exports = HttpClient;


HttpClient.prototype.close = function close() {
        var sockets = this.agent.sockets;
        Object.keys((sockets || {})).forEach(function (k) {
                sockets[k].forEach(function (s) {
                        s.end();
                });
        });

        sockets = this.agent.idleSockets;
        Object.keys((sockets || {})).forEach(function (k) {
                sockets[k].forEach(function (s) {
                        s.end();
                });
        });
};


HttpClient.prototype.get = function get(options, callback) {
        var opts = this._options('GET', options);

        return (this.read(opts, callback));
};


HttpClient.prototype.post = function post(options, callback) {
        var opts = this._options('POST', options);

        return (this.request(opts, callback));
};


HttpClient.prototype.read = function read(options, callback) {
        var r = this.request(options, function readRequestCallback(err, req) {
                if (!err)
                        req.end();

                return (callback(err, req));
        });
        return (r);
};


HttpClient.prototype.basicAuth = function basicAuth(username, password) {
        if (username === false) {
                delete this.headers.authorization;
        } else {
                assert.string(username, 'username');
                assert.string(password, 'password');

                var buffer = new Buffer(username + ':' + password, 'utf8');
                this.headers.authorization = 'Basic ' +
                        buffer.toString('base64');
        }

        return (this);
};


HttpClient.prototype.request = function request(opts, cb) {
        assert.object(opts, 'options');
        assert.func(cb, 'callback');

        cb = once(cb);

        var call;
        var retry = cloneRetryOptions(opts.retry);

        opts._keep_alive = this._keep_alive;
        call = backoff.call(rawRequest, opts, cb);
        call.setStrategy(new backoff.ExponentialStrategy({
                initialDelay: retry.minTimeout,
                maxDelay: retry.maxTimeout
        }));
        call.failAfter(retry.retries);
        call.on('backoff', this.emit.bind(this, 'attempt'));

        call.start();
};


HttpClient.prototype._options = function (method, options) {
        if (typeof (options) !== 'object')
                options = { path: options };

        var self = this;
        var opts = {
                agent: options.agent || self.agent,
                connectTimeout: options.connectTimeout || self.connectTimeout,
                headers: options.headers || {},
                method: method,
                path: options.path || self.path,
                retry: options.retry || self.retry
        };

        if (options.query &&
            Object.keys(options.query).length &&
            opts.path.indexOf('?') === -1) {
                opts.path += '?' + querystring.stringify(options.query);
        }

        Object.keys(self.url).forEach(function (k) {
                if (!opts[k])
                        opts[k] = self.url[k];
        });

        Object.keys(self.headers).forEach(function (k) {
                if (!opts.headers[k])
                        opts.headers[k] = self.headers[k];
        });

        return (opts);
};
