# Three.js TypeScript Boilerplate

Written for my Three.js TypeScript Tutorials. Work in progress, Watch this space.

The Boilerplate is a green wireframe rotating cube, with orbit controls enabled.
It also hosts the client Threejs app using NodeJS and Express.

![](screengrab1.jpg)

```
npm install -g typescript
```

I am using

- TypeScript verion 3.7.5
- Threejs version 0.113.2
- Visual Studio Code

Now Install dependencies
```bash
npm install
```

If VSCode is still showing that it cannot find the Threejs modules, then open `client.ts` in  VSCode, press F1, then select 'Restart TS Server'

See image showing imports successfully linked.
![All Imports found](screengrab2.jpg)


Build the server and client scripts
```bash
tsc -p ./src/server
tsc -p ./src/client
```

Run it
```bash
npm run dev
```

Visit
[http://127.0.0.1:3000/](http://127.0.0.1:3000/)


While running `npm run dev`, any edits to the `client/client.ts` or `server/server.ts` you make will be auto recompiled and you shoud refresh the browser manually.

See image showing compiled JavaScript using ES6 imports.
![ThreeJS using ES6 imports](screengrab3.jpg)

