import createServer from './index.mjs'
import path from 'path'

let app = createServer(path.join(process.cwd(), 'application'))
app.get('/', (req, res) => res.render('index'))

app.listen(8000)