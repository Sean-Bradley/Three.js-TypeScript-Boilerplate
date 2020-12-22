"use strict";
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let myId = "";
const socket = io();
socket.on("id", (id) => {
    document.getElementById("socketID").innerText = id;
    setInterval(() => {
        socket.emit("clientTimestamp", Date.now());
    }, 1000);
});
let blob;
let url;
const img = new Image();
const clientISODateTime = document.getElementById("clientISODateTime");
const pingPongMs = document.getElementById("pingPongMs");
socket.on("image", function (buffer) {
    if (buffer.byteLength) {
        blob = new Blob([buffer], { type: 'image/png' });
        url = URL.createObjectURL(blob);
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const clientDate = new Date();
            clientISODateTime.innerText = clientDate.toISOString();
        };
        img.src = url;
    }
});
socket.on("timestampResponse", function (t) {
    pingPongMs.innerText = (Date.now() - t).toString();
});
//setTimeout(() => { socket.emit("ping") }, 1000)
