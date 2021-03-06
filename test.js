/* TEST FILE - Copyright (c) 2017 fast-stream - Tanase Laurentiu Iulian - https://github.com/RealTimeCom/fast-stream */
'use strict';

const http = require('./index.js'),
    fs = require('fs'),
    net = require('net'),
    mime = require('mimehttp');

const config = {
    '*': {
        404: cb => cb('<html><body><h3>404 Not Found</h3></body></html>', null, 404), // optional, default 404 page
        GET: {
            '/': function(cb, req) {
                cb('<html><body><code>' + JSON.stringify(req) + '</code><code>' +
                JSON.stringify({
                    client: this._readableState.pipes.remoteAddress,
                    server: this._readableState.pipes.server.address()
                }) + '</code></body></html>');
            },
            '/close': function() {
                if (this._readableState.pipes) { this._readableState.pipes.server.close(); }
            },
            '/index.html': cb => cb('<html><body>' +
                '<form action="/post" method="post" enctype="multipart/form-data">' +
                '<input type="text" name="t1"><input type="text" name="t2"><input type="text" name="t2">' +
                '<input type="file" name="f1"><input type="file" name="f2"><input type="file" name="f2">' +
                '<input type="submit" value="Submit">' +
                '</form>' +
                '<video controls><source src="1-480.mp4" type="video/mp4"></video>' +
                '<video controls><source src="30-720.mp4" type="video/mp4"></video>' +
                '<video controls><source src="4K.mp4" type="video/mp4"></video>' +
                '</body></html>'),
            '/chunk': cb => cb('0123456789', { 'Content-Type': mime.type.txt }),
            '/c.txt': cb => {
                cb({
                    src: fs.createReadStream('/home/laur/c.txt'),
                    length: 10
                });
            },
            '/favicon.ico': cb => cb({ src: '/home/laur/favicon.ico' }, { 'Content-Type': mime.type['ico'] }),
            '/1-480.mp4': cb => cb({ src: '/home/laur/1-480.mp4' }, {
                'Content-Type': mime.type['mp4'],
                'Content-Disposition': 'inline',
                'Content-Duration': 5,
                'X-Content-Duration': 5
            }),
            '/30-720.mp4': cb => cb({ src: '/home/laur/30-720.mp4' }, {
                'Content-Type': mime.type['mp4'],
                'Content-Disposition': 'inline',
                'Content-Duration': 171,
                'X-Content-Duration': 171
            }),
            '/2-30-720.mp4': cb => cb({ src: fs.createReadStream('/home/laur/30-720.mp4') }, {
                'Content-Type': mime.type['mp4'],
                'Content-Disposition': 'inline'
                //'Content-Duration': 171,
                //'X-Content-Duration': 171
            }),
            '/4K.mp4': cb => cb({ src: '/home/laur/4K.mp4' }, {
                'Content-Type': mime.type['mp4'],
                'Content-Disposition': 'inline',
                'Content-Duration': 10,
                'X-Content-Duration': 10
            })
        },
        POST: { // remove JSON.stringify(req) or post/attach small files < 1Kb
            '/post': (cb, req) => cb('<html><body><code>' + JSON.stringify(req) + '</code></body></html>')
        }
    }
};

net.createServer(c => {
    console.log('client connected');
    c.
    on('end', () => console.log('socket end')).
    on('close', () => console.log('socket close')).
    pipe(new http(config)). // , { limit: 1e4, chunked: 1e5 }
    on('httpError', e => console.log('httpError', e.toString())).
    pipe(c);
}).
on('error', e => console.log('server error', e.toString())).
on('close', () => console.log('server close')).
listen(function() { // server listen to a random port and adress
    let a = this.address(); // get the server port and address
    console.log('server start', a);
    net.connect(a.port, a.address, function() {
        console.log('client request');
        this.end('GET /close HTTP/1.0\r\n\r\n');
    });
});
