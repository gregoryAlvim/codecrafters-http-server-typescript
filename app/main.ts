import * as fs from "node:fs";
import * as net from "node:net";

const notFoundResponse = "HTTP/1.1 404 Not Found\r\n\r\n"

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const [rest, body] = data.toString().split('\r\n\r\n')
      const [status, ...headers] = rest.split("\r\n");

      const [method, rootPath] = status.split(" ");
      const [_, path, param] = rootPath.split('/')

      switch (path) {
        case "":
          sendResponse("HTTP/1.1 200 OK\r\n\r\n")
          break;
        case "echo":
          const acceptEncoding = headers[1] ?? undefined;
          console.log(acceptEncoding)
          if (acceptEncoding) {
            const [_, value] = acceptEncoding.split(" ")
            sendResponse(`HTTP/1.1 200 OK\r\nContent-Encoding: ${value}\r\nContent-Type: text/plain\r\nContent-Length: ${param.length}\r\n\r\n${param}`)
          } else {
            sendResponse(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${param.length}\r\n\r\n${param}`)
          }
          break;
        case "user-agent": { 
            const [_, userAgent] = headers[1].split(" ");
            sendResponse(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`)
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

    function sendResponse(response: string) {
      socket.write(response)
      socket.end()
    }
});

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
