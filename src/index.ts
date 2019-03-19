import * as webpack from "webpack";
import { readFileSync, unlinkSync } from "fs";
import { basename, join } from "path";
import { execFile } from "child_process";
import { getOptions } from 'loader-utils';


const proxyBuilder = (filename: string) => `
var goBridgeExport = null
var loadLocalFile = false;

// process.platform != "browser";
if (typeof process !== 'undefined'&&typeof process.versions !== 'undefined'){
  if(process.versions.hasOwnProperty("electron") && location.href.match(/^http/) == null){
    loadLocalFile = true;
  }
}

if(loadLocalFile){
  const fs = require('fs');
  goBridgeExport = gobridge(new Promise((resolve, reject)=>{
    fs.readFile( __dirname + '/${filename}', null, (err, data) => {
      if (err) { reject(err); return; }; 
      resolve(data);
    });
  }));
}else{
  goBridgeExport = gobridge(fetch('${filename}').then(response => response.arrayBuffer()));  
}
export default goBridgeExport
`;

const getGoBin = (root: string) => `${root}/bin/go`;

const goexists = () => {
  return new Promise<boolean>((resolve: (value: boolean) => void) => {
    execFile("which", ["-s", "go"], (error) => {
      resolve(error == null)
    })
  });
};

const goenv = (envVar :string) => {
  return new Promise<string>((resolve: (value: string) => void) => {
    execFile("go", ["env", envVar], (error,stdout) => {
      if (error != null){
        resolve(null)          
      }
      resolve(stdout.trim())
    })
  });
};

function loader(this: webpack.loader.LoaderContext, contents: string) {
  const cb = this.async();

  const options = getOptions(this);

  var opts = {
    env: {
      GOPATH: null,
      GOROOT: null,
      GOCACHE: null,
      GOOS: "js",
      GOARCH: "wasm",
    }
  };


  (async () => {

    if (process.platform === 'win32') {
      opts.env.GOPATH = options && options.hasOwnProperty("GOPATH") ? options.GOPATH : process.env.GOPATH;
      opts.env.GOROOT = options && options.hasOwnProperty("GOROOT") ? options.GOROOT : process.env.GOROOT;
      opts.env.GOCACHE = options && options.hasOwnProperty("GOCACHE") ? options.GOCACHE : "./.gocache"
    } else {
      opts.env.GOPATH = options && options.hasOwnProperty("GOPATH") ? options.GOPATH : process.env.GOPATH != undefined ? process.env.GOPATH : null;
      opts.env.GOROOT = options && options.hasOwnProperty("GOROOT") ? options.GOROOT : process.env.GOROOT != undefined ? process.env.GOROOT : null;
      opts.env.GOCACHE = options && options.hasOwnProperty("GOCACHE") ? options.GOCACHE : process.env.GOROOT != undefined ? process.env.GOROOT : null;

      if (!opts.env.GOPATH||!opts.env.GOROOT||!opts.env.GOCACHE){
        let exists = await goexists()
        if (!exists){
          cb(new Error("go not found."))
          return 
        }  
      }

      for (let key in opts.env) { 
        if (opts.env[key] == null){
          const res = await goenv(`${key}`)
          if (res == null){
            cb(new Error(`go env ${key} failed`))
            return 
          }
          opts.env[key] = res
        }
      }
    }

    const goBin = getGoBin(opts.env.GOROOT);
    const outFile = `${this.resourcePath}.wasm`;
    const args = ["build", "-o", outFile, this.resourcePath];

    execFile(goBin, args, opts, (err) => {
      if (err) {
        cb(err);
        return;
      }

      let out = readFileSync(outFile);
      unlinkSync(outFile);
      const emittedFilename = basename(this.resourcePath, ".go") + ".wasm";
      this.emitFile(emittedFilename, out, null);

      cb(
        null,
        [
          "require('!",
          join(__dirname, "..", "lib", "wasm_exec.js"),
          "');",
          "import gobridge from '",
          join(__dirname, "..", "dist", "gobridge.js"),
          "';",
          proxyBuilder(emittedFilename)
        ].join("")
      );
    });
  })();
}

export default loader;
