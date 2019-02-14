import request from 'request';
import qs from 'querystring';
import http from 'http';
import fs from 'fs';
import path from 'path';

class Server {
    public adress: string;
    public port: number;
    protected server;

    constructor(adress: string, port: number) {
        this.adress = adress;
        this.port = port;
    }

    private defineContenType(req) {
        let contentType = '';
        let extname = path.extname('.' + req.url)

        switch (extname) {
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
    }

    private handleGet(req, res): void { //this function sends assets and home page
        let filePath = /assets/i.test(String(req.url)) ? `.${req.url}` : './index.html';
        
        fs.readFile(path.resolve(__dirname, filePath), 'utf-8', (err, data) => {
            if (err) {
                res.end(err);
            }

            res.writeHead(200, { 
                'Content-Type': this.defineContenType(req),
                'Cache-Control': 'public, max-age=31557600'
            });

            res.end(data, 'utf-8');
        });
    }

    private handlePost(req, res): void {
        let body = '';
        
        req.on('data', chunk => {
            if (body.length > 1e6) {
                req.connection.destroy();
            }

            body += chunk;
        });

        req.on('end', () => {
            const url = qs.parse(body).url;
            const crawler = new Crawler(url.toString());

            try {
                crawler.loadResource();
                //if ok - return to the home page 
            } catch(err) {
                //else - show error
                console.log(err)
            } 
            
            this.handleGet(req, res);
        });
    }

    public create() {
        this.server = http.createServer((req, res) => {
            if (req.method === 'GET') {
                // this.handleGet(req, res);
                this.handleGet(req, res);
            } else if(req.method === 'POST') {
                this.handlePost(req, res);
            } else {
                res.end(`Method ${req.method} is inappropriate`)
            }
        });

        return this;
    }

    public run() {
        if (this.server) {
            this.server.listen(this.port, this.adress, () => {
                console.log(`Server is running at adress ${this.adress} / on port ${this.port}`);
            });
        } else {
            throw new Error('Need to create server fitst');
        }

        return this;
    }
}

class Crawler {
    private resourceAdress: string;

    constructor(resourceAdress: string) {
        this.resourceAdress = resourceAdress;
    }

    private validateResourceAdress() {
        // example - https://google.com
        const pattern: RegExp = /^https:\/\/|http:\/\//;
        return pattern.test(this.resourceAdress);
    }

    private get resourceName() {
        // get resource name between "//" and "."
        const pattern: RegExp = /\/\/(.*)\./;
        return pattern.exec(this.resourceAdress)![1]; //! - non-null assertion operator
    }

    private get page() {
        return fs.createWriteStream(path.resolve(__dirname, `./pages/${this.resourceName}.html`))
    }

    public loadResource() {
        if(this.validateResourceAdress()) {
            request(this.resourceAdress).pipe(this.page);
        } else {
            throw new Error('Incorrect adress');
        }
    }
}

const server = new Server('127.0.0.1', 3000);
server.create().run();