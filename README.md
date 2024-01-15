Rendering in WebGPU - Musab Fiqi

-----------------------------------------
Controls: 
use WASD and mouse to move camera.

-----------------------------------------
Required
1. Use nvm to install the version of node.js you want.
2. npm init -y to install default package.json file.
3. npm i http-server
4. Run "npm start" after adding these two scripts to package.json
    - "start": "npm run install-missing-dependencies && npm run serve",
    - "install-missing-dependencies": "npm i",
    - "build": "webpack --config webpack.config.js",
    - "serve": "http-server"
5. npm i webpack webpack-cli
6. npm i typescript ts-loader
7. npx tsc -init to make tsconfig.json
8. npm i @types/node
	- maps typescript type to js type
9. npm i @webgpu/types
	- defines typescript types for webgpu
10. npm i gl-matrix
11. npm i live-server -g
12. npm i jquery
13. npm install --save-dev @types/jquery
-----------------------------------------
Useful commands:
- nvm current
- nvm list
- node -v
- npm -v

----------------------------------------
NOTES:
- Possibly enable //"types": ["node", "@webgpu/types"], in tsconfig.json
- ctrl + f5 in chrome to get rid of browser cache
- Following this tutorial series: https://www.youtube.com/watch?v=UBqme9A_O3c&list=PLn3eTxaOtL2Ns3wkxdyS3CiqkJuwQdZzn&pp=iAQB
- update tsconfig with lib and module. 
- https://www.npmjs.com/package/@types/node