"use strict";
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const socket = io();
//const queue = new Array()
let blob;
let url;
const img = new Image();
const serverISODateTime = document.getElementById("serverISODateTime");
const clientISODateTime = document.getElementById("clientISODateTime");
const latency = document.getElementById("latency");
const serverRenderDelta = document.getElementById("serverRenderDelta");
socket.on("image", function (data) {
    if (data.buffer.byteLength) {
        //queue.push(data)
        blob = new Blob([data.buffer], { type: 'image/png' });
        url = URL.createObjectURL(blob);
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            serverISODateTime.innerText = new Date(data.serverTimeStamp).toISOString();
            const clientDate = new Date();
            clientISODateTime.innerText = clientDate.toISOString();
            latency.innerText = (clientDate.getTime() - data.serverTimeStamp).toString();
            serverRenderDelta.innerText = data.serverRenderDelta.toString();
        };
        img.src = url;
    }
});
// const redraw = setInterval(() => {
//     if (queue.length) {
//         const data = queue.shift()
//     }
// }, 100)
