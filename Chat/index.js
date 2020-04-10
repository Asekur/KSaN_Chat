(async() => {

    //initialize person
    const { readlineName } = require("./utilsName");
    console.info("\n> Введите своё имя:");
    const name = await readlineName();
    const { readlinePort } = require("./utilsPort");
    console.info("> Введите свой порт:");
    const UDPportLocal = await readlinePort();
    console.info("> Введите порт собеседника:");
    const UDPportSender = await readlinePort();
    console.info(`\n*** Добро пожаловать в чат, ${name}`);
    console.info(`*** Ваш порт: ${UDPportLocal}`);
    console.info(`*** Напишите ваше первое сообщение :)`)

    let history = [];
    const sockets = [];

    //**************************************************************************
    //create UDP socket for broadcast request
    const dgram = require("dgram");
    const UDPclient = dgram.createSocket({ type: "udp4", reuseAddr: true });
    //when UDP socket create new message
    UDPclient.on("message", (msg, senderInfo) => {
        const myMessage = JSON.parse(msg);
        //for establish connection between two programms
        if (senderInfo.port !== Number(UDPportLocal)) {
            //create new socket
            const socket = new net.Socket();
            socket.connect({
                port: myMessage.TCPPort,
                host: senderInfo.address,
                family: 4, //IPV4
            });
            socket.on("connect", () => {
                var date = new Date();
                var today = date.getDay() + "." + date.getMonth() + "." + date.getFullYear() + "  ";
                today += date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                history.push(
                    ` Новое подключение [${today}]`,
                )
                handleNewConnection(socket, socket.remoteAddress);
                console.info(` Новое подключение `);
            });
        }
    });
    //when UDP socket get new message
    UDPclient.bind(UDPportLocal, () => {
        UDPclient.setBroadcast(true);
    });

    //**************************************************************************
    //create for TCP connection
    const net = require("net");
    const TCPClient = net.createServer();
    TCPClient.listen(() => createConnect(TCPClient));
    TCPClient.on("connection", (socket) => {
        if (sockets.length === 0) {
            socket.write(JSON.stringify({ type: GET_HISTORY }));
        }
        console.info(` Новое подключение `);
        handleNewConnection(socket, socket.remoteAddress.slice(7));
    });

    //**************************************************************************
    //get network interfaces
    const os = require("os");
    const pers = os.networkInterfaces();
    const persArr = Object.values(pers).flat();
    const { address: userIPAdress } = persArr.find((interface) => {
        if ("IPv4" !== interface.family || interface.internal !== false) {
            // find internal private IP and non-ipv4
            return false;
        }
        return true;
        //find your IP address
    });
    //for getting broadcastIP
    const userIpArray = userIPAdress.split(".");
    const broadcastIP = userIpArray
        .map((ipPart, i) => (userIpArray.length - 1 === i ? "255" : ipPart))
        .join(".");


    const GET_HISTORY = 0;
    const HISTORY = 1;
    const MESSAGE = 2;

    //create TCP connections among entering users
    async function createConnect(TCPClient) {
        const { port: TCPPort } = TCPClient.address();
        UDPclient.send(
            JSON.stringify({ name, TCPPort }),
            UDPportSender,
            broadcastIP,
        );
        startChat();
    }

    function startChat() {
        //return completed promise and if it was successful
        //resolver() - function-executor
        Promise.resolve().then(function resolver() {
            var date = new Date();
            var today = date.getDay() + "." + date.getMonth() + "." + date.getFullYear() + "  ";
            today += date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            //return promise from readlineName
            return readlineName()
                .then((message) => {
                    history.push(
                        `${name}(${
                        userIPAdress
                    }) : ${message} [${today}]`,
                    );
                    sockets.forEach((socket) => {
                        socket.write(JSON.stringify({ type: MESSAGE, name, message }));
                    });
                })
                .then(resolver);
        });
    }

    function handleNewConnection(socket, address) {
        socket.setEncoding("utf8");
        //about data
        socket.on("data", (data) => {
            handleMsg(data, address, socket);
        });
        sockets.push(socket);
        //about interrupted connection
        socket.on("error", (socket) => {
            var date = new Date();
            var today = date.getDay() + "." + date.getMonth() + "." + date.getFullYear() + "  ";
            today += date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            history.push(
                ` Подключение завершено [${today}]`,
            )
            console.info(` Подключение завершено `);
            const socketIndex = sockets.findIndex(
                (arraySocket) => arraySocket === socket,
            );
            //change array of sockets (delete socket)
            sockets.splice(socketIndex, 1);
        });
    }

    function handleMsg(data, address, socket) {
        const { type, name, message } = JSON.parse(data);
        switch (type) {
            case GET_HISTORY:
                {
                    socket.write(JSON.stringify({ type: HISTORY, history }));
                    break;
                }
            case HISTORY:
                {
                    const { history } = JSON.parse(data);
                    history.forEach((message) => console.info(message));
                    break;
                }
            case MESSAGE:
                {
                    var date = new Date();
                    var today = date.getDay() + "." + date.getMonth() + "." + date.getFullYear() + "  ";
                    today += date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                    const msgStr = `${name}(${address}) : ${message} [${today}]`;
                    console.info(msgStr);
                    history.push(msgStr);
                    break;
                }
        }
    }
})();