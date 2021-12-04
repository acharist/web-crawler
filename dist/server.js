"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const querystring_1 = __importDefault(require("querystring"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Server {
  constructor(adress, port) {
    this.adress = adress;
    this.port = port;
  }
  defineContenType(req) {
    let contentType = "";
    let extname = path_1.default.extname("." + req.url);
    switch (extname) {
      case ".js":
        contentType = "text/javascript";
        break;
      case ".css":
        contentType = "text/css";
        break;
      case ".json":
        contentType = "application/json";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".jpg":
        contentType = "image/jpg";
        break;
      case ".wav":
        contentType = "audio/wav";
        break;
    }
    return contentType;
  }
  handleGet(req, res) {
    let filePath = /assets/i.test(String(req.url))
      ? `.${req.url}`
      : "./index.html";
    fs_1.default.readFile(
      path_1.default.resolve(__dirname, filePath),
      "utf-8",
      (err, data) => {
        if (err) {
          res.end(err);
        }
        res.writeHead(200, {
          "Content-Type": this.defineContenType(req),
          "Cache-Control": "public, max-age=31557600",
        });
        res.end(data, "utf-8");
      }
    );
  }
  handlePost(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      if (body.length > 1e6) {
        req.connection.destroy();
      }
      body += chunk;
    });
    req.on("end", () => {
      const url = querystring_1.default.parse(body).url;
      const crawler = new Crawler(url.toString());
      crawler
        .loadResource()
        .then((resourceName) => {
          this.sendPage(
            res,
            `${__dirname}/pages/${resourceName}.html`,
            resourceName
          );
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
  sendPage(res, filePath, name) {
    const file = fs_1.default.createReadStream(filePath);
    res.writeHead(200, {
      "Content-Disposition": `attachment; filename="${name}.html"`,
      "Contnt-Type": "text/html",
    });
    file.pipe(res);
  }
  create() {
    this.server = http_1.default.createServer((req, res) => {
      if (req.method === "GET") {
        this.handleGet(req, res);
      } else if (req.method === "POST") {
        this.handlePost(req, res);
      } else {
        res.end(`Method ${req.method} is inappropriate`);
      }
    });
    return this;
  }
  run() {
    if (this.server) {
      this.server.listen(this.port, this.adress, () => {
        console.log(
          `Server is running at adress ${this.adress} / on port ${this.port}`
        );
      });
    } else {
      throw new Error("Need to create server fitst");
    }
    return this;
  }
}
class Crawler {
  constructor(resourceAdress) {
    this.resourceAdress = resourceAdress;
  }
  validateResourceAdress() {
    // example - https://google.com
    const pattern = /^https:\/\/|http:\/\//;
    return pattern.test(this.resourceAdress);
  }
  get resourceName() {
    const postfix = Date.now(); // random postfix
    // get resource name between "//" and "."
    const pattern = /\/\/(.*)\./;
    return pattern.exec(this.resourceAdress)[1] + postfix; //! - non-null assertion operator
  }
  page(resourceName) {
    return fs_1.default.createWriteStream(
      path_1.default.resolve(__dirname, `./pages/${resourceName}.html`)
    );
  }
  //******************************************************************* */
  loadResource() {
    return new Promise((resolve, reject) => {
      const dir = path_1.default.resolve(__dirname, "./pages");
      console.log(dir);
      const name = this.resourceName;
      if (this.validateResourceAdress()) {
        if (fs_1.default.existsSync(dir)) {
          // make dir for pages
          const pageStream = this.page(name);
          request_1.default(this.resourceAdress).pipe(pageStream);
          pageStream.on("close", () => {
            resolve(name);
          });
          console.log(123);
        } else {
          fs_1.default.mkdir(dir, (err) => {
            if (err) {
              reject(new Error(err.message));
            }
            const pageStream = this.page(name);
            request_1.default(this.resourceAdress).pipe(pageStream);
            pageStream.on("close", () => {
              resolve(name);
            });
          });
        }
      } else {
        reject(new Error("Incorrect adress"));
      }
    });
  }
}
const server = new Server("127.0.0.1", 3000);
server.create().run();
