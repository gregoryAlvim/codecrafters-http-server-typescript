import { request } from "http";
import * as net from "net";

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const [rest, body] = data.toString().split('\r\n\r\n')
      const [status, ...headers] = rest.split("\r\n");
      const [method, path, httpVersion] = status.split(" ");
      const [_, userAgent] = headers[2].split(" ");

      if (path === "/") {
        const response = "HTTP/1.1 200 OK\r\n\r\n"
        socket.write(response)
      }
      else if (path.includes("echo/")) {
        const query = path.split("echo/")
        const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${query.length}\r\n\r\n${query}`
        socket.write(response)
      } else if (path === "/user-agent") {
        const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
        socket.write(response)
      } else {
        const response = `HTTP/1.1 404 Not Found\r\n\r\n`
        socket.write(response)
      }

      socket.end()
    })
});

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
