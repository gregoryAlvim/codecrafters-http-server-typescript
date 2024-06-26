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
      const stringParam = path.split("/")[2]

      
      if (path === "/") {
        const response = `HTTP/1.1 200 OK\r\n\r\n`
        socket.write(response)
    
      } else if (path === `/echo/${stringParam}`) {
        const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${stringParam.length}\r\n\r\n${stringParam}`
        socket.write(response)
        
      } else if (path.length === 0) {
        const response = `HTTP/1.1 404 Not Found\r\n\r\n`
        socket.write(response)
      }

      socket.end()
    })
});

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
