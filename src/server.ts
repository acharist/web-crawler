import request from "request";
import qs from "querystring";
import http from "http";
import path from "path";
import fs from "fs";

class Server {
  public adress: string;
  public port: number;
  protected server;

  constructor(adress: string, port: number) {
    this.adress = adress;
    this.port = port;
  }

  private defineContenType(req) {
    let contentType = "";
    let extname = path.extname("." + req.url);

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

  private handleGet(req, res): void {
    //this function sends assets and home page
    let filePath = /assets/i.test(String(req.url))
      ? `.${req.url}`
      : "./index.html";

    fs.readFile(path.resolve(__dirname, filePath), "utf-8", (err, data) => {
      if (err) {
        res.end(err);
      }

      res.writeHead(200, {
        "Content-Type": this.defineContenType(req),
        "Cache-Control": "public, max-age=31557600",
      });

      res.end(data, "utf-8");
    });
  }

  private handlePost(req, res): void {
    let body = "";

    req.on("data", (chunk) => {
      if (body.length > 1e6) {
        req.connection.destroy();
      }

      body += chunk;
    });

    req.on("end", () => {
      const url = qs.parse(body).url;
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

  private sendPage(res, filePath, name) {
    const file = fs.createReadStream(filePath);
    res.writeHead(200, {
      "Content-Disposition": `attachment; filename="${name}.html"`,
      "Contnt-Type": "text/html",
    });

    file.pipe(res);
  }

  public create() {
    this.server = http.createServer((req, res) => {
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

  public run() {
    if (this.server) {
      this.server.listen(this.port, this.adress, () => {
        console.log(
          `Server is running at adress ${this.adress} / on port ${this.port}`
        );
      });
    } else {
      throw new Error("Need to create server first");
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
    const postfix = Date.now(); // random postfix
    // get resource name between "//" and "."
    const pattern: RegExp = /\/\/(.*)\./;
    return pattern.exec(this.resourceAdress)![1] + postfix; //! - non-null assertion operator
  }

  private page(resourceName) {
    return fs.createWriteStream(
      path.resolve(__dirname, `./pages/${resourceName}.html`)
    );
  }

  //******************************************************************* */
  public loadResource() {
    return new Promise((resolve, reject) => {
      const dir = path.resolve(__dirname, "./pages");
      const name = this.resourceName;

      if (this.validateResourceAdress()) {
        if (fs.existsSync(dir)) {
          const pageStream = this.page(name);
          request(this.resourceAdress).pipe(pageStream);
          pageStream.on("close", () => {
            resolve(name);
          });
        } else {
          fs.mkdir(dir, (err) => {
            if (err) {
              reject(new Error(err.message));
            }

            const pageStream = this.page(name);
            request(this.resourceAdress).pipe(pageStream);
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
