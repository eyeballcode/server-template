import express from 'express'
import bodyParser from 'body-parser'
import compression from 'compression'
import path from 'path'
import minify from 'express-minify'
import uglifyJS from 'uglify-js'
import expressWS from '@small-tech/express-ws'
import expressSession from 'express-session'

export default function createServer(applicationDir, {
  appName = 'transportme-default-server',
  requestEndCallback = () => {},
  sessionConfig = null
} = {}) {
  const viewsDir = path.join(applicationDir, 'views')
  const staticDir = path.join(applicationDir, 'static')

  const app = express()
  expressWS(app)

  app.use((req, res, next) => {
    let urlData = new URL(req.url, `${req.protocol}://${req.hostname}`)
    req.urlData = urlData

    let start = +new Date()

    res.on('finish', () => {
      let end = +new Date()
      if (!urlData.pathname.startsWith('/static/')) {
        requestEndCallback(req, res, { time: end - start })
      }
    })

    next()
  })

  app.use(compression({
    level: 9,
    threshold: 512
  }))

  let mode = process.env['NODE_ENV'] || 'prod'
  app.locals.mode = mode

  app.locals.viewsDir = viewsDir
  app.locals.staticDir = staticDir

  if (mode === 'prod') {
    app.locals.prod = true

    app.enable('trust proxy', '127.0.0.1')
    app.set('view cache', true)

    app.use(minify({
      uglifyJsModule: uglifyJS,
      errorHandler: console.log
    }))
  }

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(bodyParser.text())

  app.set('etag', 'strong')
  app.set('x-powered-by', false)
  app.set('strict routing', false)
  app.set('view engine', 'pug')
  app.set('views', viewsDir)

  if (sessionConfig) {
    app.use(expressSession({
      secret: sessionConfig.secret,
      cookie: {},
      resave: false,
      saveUninitialized: false,
      name: `${appName}.session`,
      secure: app.locals.prod,
      store: sessionConfig.store
    }))
  }

  app.use('/static', express.static(staticDir, {
    maxAge: 1000 * 60 * 60 * 24
  }))

  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000')

    res.setHeader('X-Xss-Protection', '1; mode=block')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Download-Options', 'noopen')

    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Feature-Policy', "geolocation 'self'; document-write 'none'; microphone 'none'; camera 'none';")

    next()
  })

  return app
}