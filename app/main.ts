import * as net from "net";

const httpStatusCodes = {
  200: "OK",
  404: "Not Found",
}

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const request = data.toString().split(' ')
      console.log(request)
      const path = request[1]
      console.log(path)
      const stringParam = path.split("/")[2]
  
      const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${stringParam.length}\r\n\r\n${stringParam}`

      socket.write(response)
      socket.end()
    })
});

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
