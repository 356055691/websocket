var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var ws = require("nodejs-websocket")
var PORT = 8001
var userList = [];
var num = 0;
var readyNum = 0;
var userName = [];
var userType = [];
var server = ws.createServer(function (conn) {
	console.log("New connection")
	conn.nickname = '';
	broadcast('新成员加入中。。。');
	conn.on("text", function (str) {
		if (str && str.split('USER_LOGIN_') && str.split('USER_LOGIN_')[1]) {
      conn.nickname = str.split('USER_LOGIN_')[1];
      broadcast(conn.nickname + ' 加入成功！');
      userList.push(str.split('USER_LOGIN_')[1]);
      var newList = '';
      newList = userList.join('-');
      broadcast('REFRESH_USER_' + newList);
      if (userList.length === 2) {
        broadcast('【' + userList[num] + '】 对战 【' + userList[num + 1] + '】, 请准备！');
        broadcast('PK_USER_' + userList[num] + 'PK_USER_' + userList[num + 1]);
      }
    } else if (str && str.split('READY_USER_') && str.split('READY_USER_')[1]) {
      readyNum ++;
      broadcast(readyNum + '个准备完毕！');
      if (readyNum === 2) {
        broadcast('READY_GO_' + userList[num] + 'READY_GO_' + userList[num + 1]);
        var time = 6;
        var set = setInterval(function() {
          if (time > 0) {
            time --;
            broadcast('倒计时：' + time);
          } else {
            clearInterval(set);
            time = 6;
            var res = 11;
            for (var i = 0; i < userType.length; i ++) {
              if (userType[0] && userType[1]) {
                if (userType[0] === 'bu') {
                  if (userType[1] === 'bu') {
                    res = 0;
                  }
                  if (userType[1] === 'jian') {
                    res = 1;
                  }
                  if (userType[1] === 'chui') {
                    res = 2;
                  }
                } 
                if (userType[0] === 'jian') {
                  if (userType[1] === 'bu') {
                    res = 3;
                  }
                  if (userType[1] === 'jian') {
                    res = 4;
                  }
                  if (userType[1] === 'chui') {
                    res = 5;
                  }
                }
                if (userType[0] === 'chui') {
                  if (userType[1] === 'bu') {
                    res = 6;
                  }
                  if (userType[1] === 'jian') {
                    res = 7;
                  }
                  if (userType[1] === 'chui') {
                    res = 8;
                  }
                }
              }
              if (!userType[1] && userType[0]) {
                res = 9;
              }
              if (!userType[0] && userType[1]) {
                res = 10;
              }
              if (!userType[0] && !userType[1]) {
                res = 11;
              }
            }
            switch (res) {
              case 0:
                broadcast(userName[0] + '：布 ，' + userName[1] + '：布 ，平局！');
                break;
              case 1:
                broadcast(userName[0] + '：布 ，' + userName[1] + '：剪 ，' + userName[1] + '胜！');
                break;
              case 2:
                broadcast(userName[0] + '：布 ，' + userName[1] + '：锤 ，' + userName[0] + '胜！');
                break;
              case 3:
                broadcast(userName[0] + '：剪 ，' + userName[1] + '：布 ，' + userName[0] + '胜！');
                break;
              case 4:
                broadcast(userName[0] + '：剪 ，' + userName[1] + '：剪 ，平局！');
                break;
              case 5:
                broadcast(userName[0] + '：剪 ，' + userName[1] + '：锤 ，' + userName[1] + '胜！');
                break;
              case 6:
                broadcast(userName[0] + '：锤 ，' + userName[1] + '：布 ，' + userName[1] + '胜！');
                break;
              case 7:
                broadcast(userName[0] + '：锤 ，' + userName[1] + '：剪 ，' + userName[0] + '胜！');
                break;
              case 8:
                broadcast(userName[0] + '：锤 ，' + userName[1] + '：锤 ，平局！');
                break;
              case 9:
                broadcast(userName[1] + '弃权，' + userName[1] + '胜！');
                break;
              case 10:
                broadcast(userName[0] + '弃权，' + userName[1] + '胜！');
                break;
              default:
                broadcast('双方都弃权');
            }
          }
        }, 1000);
        readyNum = 0;
        userName = [];
        userType = [];
      }
    } else if (str && str.split('CHOSEN_NAME_') && str.split('CHOSEN_NAME_')[1]) {
      userName.push(str.split('CHOSEN_NAME_')[1]);
    } else if (str && str.split('CHOSEN_TYPE_') && str.split('CHOSEN_TYPE_')[1]) {
      userType.push(str.split('CHOSEN_TYPE_')[1]);
    } else {
      broadcast(conn.nickname + '：' + str);
    }
	})
	conn.on("close", function (code, reason) {
    for (var i = 0; i < userList.length; i ++) {
      if (conn.nickname === userList[i]) {
        userList.splice(i, 1);
        var newList = '';
        newList = userList.join('-');
        broadcast('REFRESH_USER_' + newList);
      }
    }
		broadcast(conn.nickname + '离开');
	})
	conn.on("error", function (err) {
		console.log("Hand error")
		console.log(err)
	})
}).listen(PORT)
 
console.log("WebSocket server listening on port " + PORT);
 
function broadcast(str){
	server.connections.forEach(function(connection){
		connection.sendText(str);
	});
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
