const http = require('http')
const fs = require('fs')

let urlBase = 'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.7'
let fileBase = 'flight-view'

let uris = [
    '/css/bootstrap.min.css',
    '/fonts/glyphicons-halflings-regular.eot',
    '/fonts/glyphicons-halflings-regular.svg',
    '/fonts/glyphicons-halflings-regular.ttf',
    '/fonts/glyphicons-halflings-regular.woff',
    '/fonts/glyphicons-halflings-regular.woff2'
]

if (!fs.existsSync(fileBase + '/fonts')) {
    fs.mkdirSync(fileBase + '/fonts')
}

for (let i = 0; i < uris.length; i++) {
    http.get(urlBase + uris[i], (response) => {
        response.pipe(fs.createWriteStream(fileBase + uris[i]))
    })
}
