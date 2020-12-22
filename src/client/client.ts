const canvas = (document.getElementById('canvas') as HTMLCanvasElement)
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const socket: SocketIOClient.Socket = io()

const queue = new Array()
socket.on("image", function (data: { buffer: ArrayBuffer, serverTimeStamp: number }) {
    if (data.buffer.byteLength) {
        queue.push(data)
    }
});

let blob: Blob
let url: string
const img = new Image();
const clientISODateTime = document.getElementById("clientISODateTime") as HTMLSpanElement
const latency = document.getElementById("latency") as HTMLSpanElement
setInterval(() => {
    if (queue.length) {
        const data = queue.shift()
        blob = new Blob([data.buffer], { type: 'image/png' });
        url = URL.createObjectURL(blob);

        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const clientDate = new Date()
            clientISODateTime.innerText = "Client Datetime : " + clientDate.toISOString()
            latency.innerText = "Latency : " + (clientDate.getTime() - data.serverTimeStamp)
        }

        img.src = url;
    }
}, 100)