const Koa = require('Koa')
const serve = require('koa-static-server')
const startConfig = {
    port: 9000
}
const appBlogIns = new Koa()
appBlogIns.use(serve({ rootDir: 'public/', rootPath: '/' }))
    // ================================================>>>>Start Server
const init = async() => {
    appBlogIns.listen(startConfig.port)
    console.log(`[HexoServer] Port: ${startConfig.port}`)
}
init()