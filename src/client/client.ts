const canvas = (document.getElementById('canvas') as HTMLCanvasElement)
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const socket: SocketIOClient.Socket = io()

//const queue = new Array()
let blob: Blob
let url: string
const img = new Image();
const serverISODateTime = document.getElementById("serverISODateTime") as HTMLSpanElement
const clientISODateTime = document.getElementById("clientISODateTime") as HTMLSpanElement
const latency = document.getElementById("latency") as HTMLSpanElement
const serverRenderDelta = document.getElementById("serverRenderDelta") as HTMLSpanElement

socket.on("image", function (data: { buffer: ArrayBuffer, serverTimeStamp: number, serverRenderDelta: number }) {
    if (data.buffer.byteLength) {
        //queue.push(data)
        blob = new Blob([data.buffer], { type: 'image/png' });
        url = URL.createObjectURL(blob);

        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            serverISODateTime.innerText = new Date(data.serverTimeStamp).toISOString()
            const clientDate = new Date()
            clientISODateTime.innerText = clientDate.toISOString()
            latency.innerText = (clientDate.getTime() - data.serverTimeStamp).toString()
            serverRenderDelta.innerText = data.serverRenderDelta.toString()
        }

        img.src = url;
    }
});


// const redraw = setInterval(() => {
//     if (queue.length) {
//         const data = queue.shift()
        
//     }
// }, 100)