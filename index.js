const dotenv = require("dotenv");
dotenv.config();
var http = require('http');
var fs = require('fs');
var AWS = require('aws-sdk')

const port = 8000

let filename;

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region : 'ap-south-1'
}); 

var getParams = (filename,request) => ({
    Bucket: process.env.GET_VIDEO_DATA_BUCKET_NAME,
    Key: `${filename}/Default/HLS${request.url}`, // File name you want to save as in S3
});


http.createServer(async function (request, response) {
    console.log('request starting...',filename);

    let ext = request.url.split('.')[1]

    if(ext === 'm3u8'){
        filename = request.url.split('.')[0]
        filename = filename.substring(1)

        if(['360','540','720'].includes(filename.split('_').slice(-1)[0])){
            filename = filename.split('_')
            filename.pop()
            filename = filename.join('_')
        }

        let data = s3.getObject(getParams(filename,request)).promise()

        data.then((d)=>{
            response.writeHead(200, { 'Access-Control-Allow-Origin': '*' });        
            let data = d.Body.toString()
            response.end(data, 'utf-8');
        })
    
    }else if(ext === 'ts'){
        let data = s3.getObject(getParams(filename,request)).createReadStream()
        data.pipe(response)

    }else{
        response.statusCode = 500
        response.end("Unsupported Format")
    }
 
}).listen(port);
console.log(`Server running at http://127.0.0.1:${port}/`);