
// let myId: string = ""
// const socket: SocketIOClient.Socket = io()
// socket.on("connect", function () {
//     console.log("connect")
// })
// socket.on("disconnect", function (message: any) {
//     console.log("disconnect " + message)
// })
// socket.on("id", (id: any) => {
//     myId = id
// })

//function b64(e: any) { var t = ""; var n = new Uint8Array(e); var r = n.byteLength; for (var i = 0; i < r; i++) { t += String.fromCharCode(n[i]) } return window.btoa(t) }
// var ctx = (document.getElementById('canvas') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D 
// const image = document.getElementById("image")
// socket.on("image", function (info) {
//     if (info.image) {
//         console.log(info)
//         var img = new Image();
//         img.src = 'data:image/jpeg;base64,' + info.buffer;
//         ctx.drawImage(img, 0, 0);
//     }
// });
// socket.on('imageConversionByClient', function (data: any) {
//     (image as HTMLImageElement).setAttribute("src", "data:image/png;base64," + b64(data.buffer));
// });
// socket.on('image', async image => {
//     // image is an array of bytes
//     const buffer = Buffer.from(image);
//     (image as HTMLImageElement).setAttribute("src", "data:image/png;base64," + image);
//     //await fs.writeFile('/tmp/image', buffer).catch(console.error); // fs.promises
// });

const image = document.getElementById("image")
setInterval(() => {
    (image as HTMLImageElement).src = "render?" + Math.random()
}, 100)
