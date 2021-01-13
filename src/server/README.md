# About the server.ts in the webpack version of the boilerplate.

In the webpack version of the boilerplate, it is not necessary to add static references to the libs in `node_modules` if you are using **Module Specifiers** in your client.ts imports.

Visit https://sbcode.net/threejs/module-specifiers/ for info about **Module Specifiers**.

This `server.ts` is only useful if you are running this on a production server or you want to see how the production version of `bundle.js` works in the browser instead of using the self hosted webpack dev server version of `bundle.js`.

To start the NodeJS Server

```bash
npm run build   #this creates the production version of bundle.js and places it in ./dist/client/
tsc -p ./src/server  #this compiles server.ts into ./dist/server/server.js
npm start       #this starts nodejs with express and serves the ./dist/client/ folder.
```

visit http://127.0.0.1:3000