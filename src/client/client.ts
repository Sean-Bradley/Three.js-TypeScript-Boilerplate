const canvas = (document.getElementById('canvas') as HTMLCanvasElement)
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

let myId: string = ""
const socket: SocketIOClient.Socket = io()
socket.on("id", (id: any) => {
    (document.getElementById("socketID") as HTMLSpanElement).innerText = id
    setInterval(() => {
        socket.emit("clientTimestamp", Date.now())
    }, 1000)
})

let blob: Blob
let url: string
const img = new Image();
const clientISODateTime = document.getElementById("clientISODateTime") as HTMLSpanElement
const pingPongMs = document.getElementById("pingPongMs") as HTMLSpanElement

socket.on("image", function (buffer: ArrayBuffer) {
    if (buffer.byteLength) {
        blob = new Blob([buffer], { type: 'image/png' });
        url = URL.createObjectURL(blob);

        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const clientDate = new Date()
            clientISODateTime.innerText = clientDate.toISOString()
        }

        img.src = url;
    }
});

socket.on("timestampResponse", function (t: number) {
    pingPongMs.innerText = (Date.now() - t).toString()
})
