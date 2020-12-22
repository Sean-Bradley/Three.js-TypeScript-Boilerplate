"use strict";
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const socket = io();
const queue = new Array();
socket.on("image", function (data) {
    if (data.buffer.byteLength) {
        queue.push(data);
    }
});
let blob;
let url;
const img = new Image();
const clientISODateTime = document.getElementById("clientISODateTime");
const latency = document.getElementById("latency");
setInterval(() => {
    if (queue.length) {
        const data = queue.shift();
        blob = new Blob([data.buffer], { type: 'image/png' });
        url = URL.createObjectURL(blob);
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const clientDate = new Date();
            clientISODateTime.innerText = "Client Datetime : " + clientDate.toISOString();
            latency.innerText = "Latency : " + (clientDate.getTime() - data.serverTimeStamp);
        };
        img.src = url;
    }
}, 50);
