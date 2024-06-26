import * as net from "net";

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const [rest, body] = data.toString().split('\r\n\r\n')
      const [status, ...headers] = rest.split("\r\n");

      const [method, rootPath, httpVersion] = status.split(" ");
      const [_, path, param] = rootPath.split('/')

      switch (path) {
        case "":
          sendResponse("HTTP/1.1 200 OK\r\n\r\n")
          break;
        case "echo":
          sendResponse(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${param.length}\r\n\r\n${param}`)
          break;
        case "user-agent":
          const [_, userAgent] = headers[1].split(" ");
          const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
          sendResponse(response)
          break;
        default:
          sendResponse("HTTP/1.1 404 Not Found\r\n\r\n")
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
