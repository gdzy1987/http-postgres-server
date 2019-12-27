const koa = require("koa");
const koaBody = require("koa-body");
const Pool = require('pg').Pool

module.exports = function(options) {
  function query(pool, sql) {
      return new Promise((resolve, reject) => {
        pool.query(sql, function(error, results) {
          if (error) reject(error);
          let rows = results.rows;
          console.log(rows);
          resolve({
            rows
          });
        });            
    });    
  }

  /**
   * config Object
   *  host: "localhost",
   *  user: "root",
   *  password: "12345678",
   *  database: "test"
   * 
   * 详细 config 配置查看 https://github.com/mysqljs/mysql#connection-options
   */

  config = {
    host: options.host || 'localhost',
    port: options.port || 3306,
    user: options.user || 'sa',
    database: options.database || 'test',
    password: (options.password + '') || 'root'
  }

  const port = options.http_port || "5555";

  const pool = new Pool(config);

  const app = new koa();

  app.use(
    koaBody({
      multipart: true
    })
  );

  app.use((ctx, next)=>{
    return next()
  })

  app.use(async (ctx, next) => {
    if (ctx.path.indexOf("/api/query") === 0) {
      let params = ctx.request.body;
      let sql = params.sql;
      try {
        let data = await query(pool, sql);
        return (ctx.body = data.rows);
      } catch (err) {
        return (ctx.body = {
          errcode: 400,
          message: err.message
        });
      }
    }
    return await next();
  });

  app.use(async ctx => {
    let result 
    try{
      result = await query(pool, "SELECT schemaname,tablename FROM pg_tables");
    }catch(err){
      return ctx.body = err.message
    }

    let tableHtml = [];
    console.log("-----------------------------------------------------")
    console.log(result);
    result.rows.forEach((item, index) =>
      tableHtml.push(
        "<tr><td> " + (index + 1) + " </td><td>" + item.schemaname + '.' + item.tablename + "</td></tr>"
      )
    );

    ctx.body = require('./view')(tableHtml, port);
  });

  
  app.listen(port, function() {
    console.log("服务启动成功, 请访问 “http://127.0.0.1:" + port + '"\n');
  });
  app.on('error', async (err, ctx, next) => {

    // TODO logger errStack
    console.error(err.message);
  
  });
};



var fs      = require('fs')
var util    = require('util')

var logPath = 'upgrade.log'
var logFile = fs.createWriteStream(logPath, { flags: 'a' })

console.log = function() {
  logFile.write(util.format.apply(null, arguments) + '\n')
  process.stdout.write(util.format.apply(null, arguments) + '\n')
}

console.error = function() {
  logFile.write(util.format.apply(null, arguments) + '\n')
  process.stderr.write(util.format.apply(null, arguments) + '\n')
}