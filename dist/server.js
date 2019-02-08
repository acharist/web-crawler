"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var request_1 = __importDefault(require("request"));
var http_1 = __importDefault(require("http"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var Server = /** @class */ (function () {
    function Server(adress, port) {
        this.adress = adress;
        this.port = port;
    }
    Server.prototype.defineContenType = function (req) {
        var contentType = '';
        var extname = path_1.default.extname('.' + req.url);
        switch (extname) {
            case '.html':
                contentType = 'text/html';
                break;
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }
        return contentType;
    };
    Server.prototype.send = function (req, res) {
        var _this = this;
        var filePath = /assets/i.test(String(req.url)) ? "." + req.url : './index.html';
        fs_1.default.readFile(path_1.default.resolve(__dirname, filePath), 'utf-8', function (err, data) {
            if (err) {
                res.end(err);
            }
            if (_this.defineContenType(req) !== '.html') {
                res.writeHead(200, {
                    'Content-Type': _this.defineContenType(req),
                    'Cache-Control': 'public, max-age=31557600'
                });
            }
            else {
                res.writeHead(200, {
                    'Content-Type': 'text/html',
                });
            }
            res.end(data, 'utf-8');
        });
    };
    Server.prototype.create = function () {
        var _this = this;
        this.server = http_1.default.createServer(function (req, res) {
            if (req.method === 'GET') {
                _this.send(req, res);
            }
            else if (req.method === 'POST') {
                _this.send(req, res);
            }
            else {
                res.end("Method " + req.method + " is inappropriate");
            }
        });
        return this;
    };
    Server.prototype.run = function () {
        var _this = this;
        if (this.server) {
            this.server.listen(this.port, this.adress, function () {
                console.log("Server is running at adress " + _this.adress + " / on port " + _this.port);
            });
        }
        else {
            throw new Error('Need to create server fitst');
        }
        return this;
    };
    return Server;
}());
var Crawler = /** @class */ (function () {
    function Crawler(resourceAdress) {
        this.resourceAdress = resourceAdress;
    }
    Crawler.prototype.validateResourceAdress = function () {
        // example - https://google.com
        var pattern = /^https:\/\/|http:\/\//;
        return pattern.test(this.resourceAdress);
    };
    Object.defineProperty(Crawler.prototype, "resourceName", {
        get: function () {
            // get resource name between "//" and "."
            var pattern = /\/\/(.*)\./;
            return pattern.exec(this.resourceAdress)[1]; //! - non-null assertion operator
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crawler.prototype, "page", {
        get: function () {
            return fs_1.default.createWriteStream(path_1.default.resolve(__dirname, "./pages/" + this.resourceName + ".html"));
        },
        enumerable: true,
        configurable: true
    });
    Crawler.prototype.loadResource = function () {
        if (this.validateResourceAdress()) {
            request_1.default(this.resourceAdress).pipe(this.page);
        }
    };
    return Crawler;
}());
var server = new Server('127.0.0.1', 3000);
var crawler = new Crawler('https://google.com');
server.create().run();
crawler.loadResource();
