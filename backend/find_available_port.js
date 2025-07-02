const net = require('net');

function findAvailablePort(startPort) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.unref();
        server.on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
        server.listen(startPort, () => {
            server.close(() => resolve(startPort));
        });
    });
}

module.exports = findAvailablePort;