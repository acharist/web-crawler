import request from 'request';
import http from 'http';
import fs from 'fs';
import path from 'path';

class Server {
    public adress: string;
    public port: number;
    protected server: any;

    constructor(adress: string, port: number) {
        this.adress = adress;
        this.port = port;
    }

    private defineContenType(req: any) {
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

    public create() {
        this.server = http.createServer((req, res) => {
            let filePath: any = /assets/i.test(String(req.url)) ? `.${req.url}` : './index.html';
            
            if (req.method === 'GET') {
                fs.readFile(path.resolve(__dirname, filePath), 'utf-8', (err, data) => {
                    if (err) {
                        res.end(err);
                    }
    
                    res.writeHead(200, { 'Content-Type': this.defineContenType(req) });
                    res.end(data, 'utf-8');
                })
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
        }
    }
}

const server = new Server('127.0.0.1', 3000);
const crawler = new Crawler('https://google.com');

server.create().run();
crawler.loadResource();