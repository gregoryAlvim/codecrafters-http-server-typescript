import * as fs from "node:fs";
import * as net from "node:net";
import * as zlib from "node:zlib";

const versionHTTP = "HTTP/1.1"
const notFoundResponse = "HTTP/1.1 404 Not Found\r\n\r\n"

type HttpHeaderKey = 
  | 'Content-Type'
  | 'Content-Encoding'
  | 'Content-Length'
  | 'Accept-Encoding'
  | 'User-Agent'

type HttpHeader = { [key in HttpHeaderKey]?: string }

type HttpRequest = {
  method: string;
  path: string;
  headers: HttpHeader;
  body: string;
}

type HttpResponse = {
  statusCode: number;
  statusMessage: string;
  headers?: HttpHeader;
  body?: Buffer | string;
}

function parseHttpRequest(data: Buffer): HttpRequest {
  const request = data.toString();
  const [rest, body] = request.split("\r\n\r\n")
  const [statusLine, ...headersLine] = rest.split("\r\n");
  const [method, path] = statusLine.split(" ");

  const headers: HttpHeader = {};

  for (let i = 0; i < headersLine.length; i++) {
      const line = headersLine[i];

      if (line === '') break;

      const [key, value] = line.split(': ');
      headers[key as HttpHeaderKey] = value;
  }

  return { method, path, headers, body };
}

function buildHttpResponse(response: HttpResponse): Buffer {

  const statusLine = `${versionHTTP} ${response.statusCode} ${response.statusMessage}\r\n`;
  const headers = response.headers ? Object.entries(response.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n') : "";
  const blankLine = '\r\n\r\n';
  const body = response.body instanceof Buffer ? response.body : Buffer.from(response.body ?? "");

  return Buffer.concat([
      Buffer.from(statusLine),
      Buffer.from(headers),
      Buffer.from(blankLine),
      body,
  ]);
}

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const { method, path, headers, body, } = parseHttpRequest(data)
      const [_, filteredPath, param] = path.split('/')

      switch (filteredPath) {
        case "":
          sendResponse(buildHttpResponse({ statusCode: 200, statusMessage: "OK" }))
          break;
        case "echo":
          const acceptEncoding = headers["Accept-Encoding"];

          if (acceptEncoding) {
            if (acceptEncoding.includes("gzip")) {
              const compressedParam = zlib.gzipSync(param);
              sendResponse(buildHttpResponse({ 
                statusCode: 200, 
                statusMessage: "OK", 
                headers: { "Content-Type": "text/plain", "Content-Encoding": "gzip", "Content-Length": compressedParam.length.toString() },
                body: compressedParam
              }))

            }
          }
    
            sendResponse(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${param.length}\r\n\r\n${param}`)
          break;
        case "user-agent": { 
            const userAgent = headers["User-Agent"]

            if (userAgent) {
              sendResponse(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`)
            }
          }
          break;
        case "files":
          const directory = process.argv[3]
          const pathFile = directory + param
          
          if (method === "POST") {
            fs.writeFileSync(pathFile, body)

            sendResponse("HTTP/1.1 201 Created\r\n\r\n")
          }

          if (method === "GET") {
            if (fs.existsSync(pathFile)) {
              const stats = fs.statSync(pathFile)
              const content = fs.readFileSync(pathFile)
  
              sendResponse(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${stats.size}\r\n\r\n${content}`)
            } else {
              sendResponse(notFoundResponse)
            }
          }

          break;
        default:
          sendResponse(notFoundResponse)
          break;
      }
    })

    function sendResponse(response: Buffer | string, callback?: () => void) {
      socket.write(response)
      socket.end(callback)
    }
});

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
