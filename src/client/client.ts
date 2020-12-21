let myId: string = ""
const socket: SocketIOClient.Socket = io()
socket.on("connect", function () {
    console.log("connect")
})
socket.on("disconnect", function (message: any) {
    console.log("disconnect " + message)
})
socket.on("id", (id: any) => {
    myId = id
})

const canvas = (document.getElementById('canvas') as HTMLCanvasElement)
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
socket.on("image", function (data: ArrayBuffer) {
    if (data.byteLength > 0) {

        var blob = new Blob([data], { type: 'image/png' });
        var url = URL.createObjectURL(blob);
        var img = new Image;
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
        }
        img.src = url;
    }
});





// const image = document.getElementById("image")
// setInterval(() => {
//     (image as HTMLImageElement).src = "render?" + Math.random()
// }, 100)
