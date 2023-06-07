var http = require("http");
var fs = require("fs");
var path = require("path");
var nRand;

const PORT = 8000;

const MIME_TYPES = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "application/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpg",
  gif: "image/gif",
  ico: "image/x-icon",
  svg: "image/svg+xml",
};

const STATIC_PATH = path.join(process.cwd(), "./");

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
  const paths = [STATIC_PATH, url];
  console.log('check url: '+ url)
  
  if (url.endsWith("/")) {
    paths.push("index.html");
  
  } else if(url.includes("random")) {
    console.log('included random');
    
    if(url.includes('max')) {
      val = url.replace('/random?max=', "");
      console.log('value: ' + val);
      
      nRand = Math.round(Math.random() * (val));
      paths[1] = paths[1].replace("?max="+val, "");
      paths.push('random.html');
      
    } else {
      console.log(url);
      const search_params = url.searchParams;
      console.log(search_params)
      const num = Math.round(Math.random() * (1));
      paths.push(`${num}.html`); 
    }
  }
  
  const filePath = path.join(...paths);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await fs.promises.access(filePath).then(...toBool);
  const found = !pathTraversal && exists;
  const streamPath = found ? filePath : STATIC_PATH + "404.html";
  const ext = path.extname(streamPath).substring(1).toLowerCase();
  const stream = fs.createReadStream(streamPath);
  return { found, ext, stream, nRand };
};

http.createServer(async (req, res) => {
    console.log(req.url)
    const file = await prepareFile(req.url);
    const statusCode = file.found ? 200 : 404;
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
    res.writeHead(statusCode, { "Content-Type": mimeType });
    //file.stream.pipe(res);
    
    fs.readFile(file.stream.path, 'utf8', (err, content) => {
      const renderedContent = content.replace('{{nRand}}', file.nRand);
      res.end(renderedContent);
    });
    
    console.log(`${req.method} ${req.url} ${statusCode}`);
  })
  .listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}/`);
