import createServer from './index.mjs'
import path from 'path'

function requestEndCallback(req, res, { time }) {
  console.log(`${req.method} ${req.urlData.toString()}${res.loggingData ? ` ${res.loggingData}` : ''} ${time} ${req.ip}`)
}

let app = createServer(path.join(process.cwd(), 'application'), { requestEndCallback })
app.get('/', (req, res) => res.render('index'))
app.listen(8000)