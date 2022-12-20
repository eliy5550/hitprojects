require('dotenv').config()

const express = require('express')
var mysql = require('mysql');
const multer = require('multer');
const { json } = require('express');
const jwt = require('jsonwebtoken')
const session = require('express-session')
const path = require('path')
const fs = require('fs');
const { checkPrimeSync } = require('crypto');
const { env, nextTick } = require('process');
const { Console } = require('console');
const bcrypt = require('bcrypt');
const { resolveSoa } = require('dns');


const app = express()

app.use(express.static('public'))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/onepagers')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

// app.use(session({
//   secret: "123 123",
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     secure: true,
//     httpOnly: true,
//     maxAge:30000
//   }
// }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  cookie: {
    maxAge: 3600000,
    httpOnly: true // need to add "secure" = true after adding HTTPS
  }
}))

app.set('view-engine', 'ejs')

//temp data to prevent some sql calls
var tempCategories

//database
var con = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  multipleStatements: true
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});


//middleware for all
//authentication:
const authenticateUser = (req, res, next) => {
  console.log('authenticating')

  //console.log(req.session.userid)
  if (req.session.key != undefined) {
    console.log('theres a key! ')
    jwt.verify(req.session.key, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        console.log('invalid key')
        next()
      }
      console.log("role found : " + user.role)
      req.user = user;
      next()
    })
    //next()
  } else {
    console.log('theres no key')
    req.user = {// default guest user
      id: 0,
      fullName: "guest",
      role: 'guest'
    }
    next()
  }
};

app.all('*', authenticateUser);

//add to request an array of projects the manager can manage
const appendManagerProjects = (req, res, next) => {
  if (req.user.role != 'manager') { return next(); }
  con.query(`select pid from project where projectmanager = ${req.user.id}`, (err, result) => {
    const managerProjects = []
    result.forEach(row => {
      managerProjects.push(row.pid)
    });
    req.managerProjects = managerProjects;
    next();
  })
}

const kickUnauthorizedManagerOrStudentFromGet = (req, res , next) => {
  if (req.user.role == 'guest' || req.user.role == 'student') { return res.send('YOU ARE NOT AUTHORIZED TO BE HERE!') }
  if (req.user.role == 'manager' && !req.managerProjects.includes(parseInt(req.params.pid))) {
    return res.send('YOU ARE NOT AUTHORIZED TO BE HERE!')
  }
  next()
}
const kickUnauthorizedManagerOrStudentFromPost = (req, res , next) => {
  if (req.user.role == 'guest' || req.user.role == 'student') { return res.send('YOU ARE NOT AUTHORIZED TO BE HERE!') }
  if (req.user.role == 'manager' && !req.managerProjects.includes(parseInt(req.body.pid))) {
    return res.send('YOU ARE NOT AUTHORIZED TO BE HERE!')
  }
  next()
}

//pages:
app.get('/', async (req, res) => {
  await con.query('select * from projectcategories;', (err, result) => {
    if (err) console.log(err)
    return res.render('index.ejs', { user: req.user, cats: result, picpathbase: path.join('/images', "categories", '/') })
  })
})

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) res.send('logout failed...')
    res.redirect('/')
  })
})

app.get('/projectsOfCategory/:cat', async (req, res) => {
  await con.query(`select * from project where category='${req.params.cat}'`, (err, result) => {
    console.log(`select * from project where category='${req.params.cat}'`)
    if (err) res.redirect("404.ejs");
    res.render('projectsOfCatrgory.ejs', { user: req.user, projects: result })
  });
})

app.get('/project/:pid', async (req, res) => {
  await con.query(`select * from project left join manager on project.projectmanager = manager.mid where project.pid=${req.params.pid};`, (err, result) => {
    if (err) res.redirect("404.ejs");
    var onepagerpath = path.join('/images', 'onepagers', 'defaultonepager.jpg');
    if (result[0].onepagerpath != null) {
      onepagerpath = path.join('/images', 'onepagers', result[0].onepagerpath)
    }
    console.log(onepagerpath)
    res.render('project.ejs', { user: req.user, projects: result, onepagerpath: onepagerpath })
  });
})

//login
app.get('/login', (req, res) => {
  res.render('login.ejs', { user: req.user, message: "" })
})


app.post('/login', upload.none(), (req, res) => {
  req.session.userid = 1;

  console.log(`data received : ${req.body.email} ${req.body.password}`);
  req.body.password = bcrypt.hashSync(req.body.password, process.env.PASSWORD_SECRET)
  //are u a student
  const sql1 = `select * from admins  WHERE email="${req.body.email}" and pass="${req.body.password}";`;
  const sql2 = `select * from manager WHERE email="${req.body.email}" and pass="${req.body.password}";`;
  const sql3 = `select * from student WHERE email="${req.body.email}" and pass="${req.body.password}";`;

  con.query(sql1 + sql2 + sql3, (err, results) => {
    if (err) throw err;
    if (results[0].length > 0) {
      //admin
      key = jwt.sign({
        id: results[0][0].aid,
        fullName: results[0][0].fullName,
        role: 'admin'
      }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      req.session.key = key;
      console.log(req.session.key)

      res.redirect('/')

    } else if (results[1].length > 0) {
      //manager
      req.session.key = jwt.sign({
        id: results[1][0].mid,
        fullName: results[1][0].fullName,
        role: 'manager'
      }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })

      res.redirect('/')

    } else if (results[2].length > 0) {
      //student
      req.session.key = jwt.sign({
        id: results[2][0].sid,
        fullName: results[2][0].fullName,
        pid: results[2][0].pid,
        role: 'student'
      }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })

      res.redirect('/')
    } else {
      res.render('login.ejs', { user: req.user, message: "try again" })
    }
  });
});

app.get('/register', (req, res) => {
  res.render('register.ejs', { message: "", user: req.user })
})

app.post('/register', upload.none(), (req, res) => {
  req.body.password = bcrypt.hashSync(req.body.password, process.env.PASSWORD_SECRET)
  con.query(`
  insert into student  (id,fullName,pass,email,phoneNumber ) 
  values("${req.body.id}"  ,"${req.body.fullName}"  , 
    "${req.body.password}" ,"${req.body.email}"  , "${req.body.phoneNumber}" );`,
    (err) => {
      if (err) {
        if (err.code == 'ER_DUP_ENTRY') { console.log('ER_DUP_ENTRY'); return res.status(400).render("register.ejs", { user: req.user, message: "Email already exists." }) }
        console.log(err.code);
        return res.status(400).render("register.ejs", { user: req.user, message: "something went wrong with your registration." })
      }
      return res.status(201).render('login.ejs', { user: req.user, message: "SUCCESSFULLY REGISTERED!" })
    });
})

app.get('/addProject', async (req, res) => {
  await con.query(`select * from projectcategories`, (err, result) => {
    if (err) res.send("cant find categories");
    //save temp cats
    tempCategories = result
    res.render('addProject.ejs', { user: req.user, cats: result, message: "" })
  });
})

app.post('/addProject', authenticateUser, upload.none(), async (req, res) => {
  const sql = `insert into project 
  (title , description , category , start , finish , maxStudents ) 
  values
  ("${req.body.title}" , "${req.body.description}" , "${req.body.category}" , "${req.body.start}" , "${req.body.finish}" , "${req.body.maxStudents}");
  `;
  console.log(sql)
  const sql2 = "select * from projectcategories;";
  con.query(sql + sql2, (err, results) => {
    if (err) { console.log(`err in add project , ${err}`); res.send("unable to add project") }
    console.log("res1= " + JSON.stringify(results[1]))
    res.render("addProject.ejs", { user: req.user, cats: results[1], message: "project added successfully!" })
  })

})



app.get('/editProjects/', async (req, res) => {
  if (req.user.role == 'admin') {
    con.query(`select * from project`, (err, result) => {
      res.render('editProjects.ejs', { user: req.user, projects: result })
    });
  } else if (req.user.role == 'manager') {
    con.query(`select * from project where projectmanager=${req.user.id};`, (err, result) => {
      if (err) { console.log(err); return res.send('there was an error') }
      res.render('editProjects.ejs', { user: req.user, projects: result })
    });
  } else {
    res.redirect('/')
  }
})


app.get('/editProject/:pid', appendManagerProjects, kickUnauthorizedManagerOrStudentFromGet, upload.none(), (req, res) => {
  //if(user.role == 'guest' || user.role == 'student' ){ return res.send('unauthorized! :(')}
  const sql = `select * from project where pid = ${req.params.pid};`
  const sql2 = 'select * from projectcategories;'
  const sql3 = `select * from task where pid = ${req.params.pid} order by tid desc; `
  const sql4 = `select * from projectupdates where pid = ${req.params.pid} order by uid desc; `
  const sql5 = `select _manager_project.pid , manager.mid, manager.fullName , manager.email , manager.phoneNumber from _manager_project join manager on _manager_project.mid = manager.mid where pid = ${req.params.pid}; `
  const sql6 = `select * from student where pid = ${req.params.pid}; `

  con.query(sql + sql2 + sql3 + sql4 + sql5 + sql6, (err, results) => {
    if (err) { return res.send(err) }

    res.render('editProject.ejs', { message: "", user: req.user, projects: results[0], cats: results[1], tasks: results[2], updates: results[3], managers: results[4], students: results[5] })
  })
})

app.post('/editProject', appendManagerProjects, upload.none(), kickUnauthorizedManagerOrStudentFromPost, (req, res) => {
  var isRegisterable = 0;
  if(req.body.isRegisterable != null){
    isRegisterable = 1;
  }
  console.log(JSON.stringify(isRegisterable));

  const sql = `UPDATE project set isRegisterable=${isRegisterable} ,title= '${req.body.title}', description = '${req.body.description}',  category = '${req.body.category}' , start= '${req.body.start}' , finish = '${req.body.finish}'  , maxStudents = ${req.body.maxStudents} where pid = ${req.body.pid};`
  con.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      res.send("err");
    }
    res.redirect("/editProject/" + req.body.pid)
  })
})



app.post('/deleteProject', upload.none(), (req, res) => {
  console.log(`delete from project where pid = ${req.body.pid}; delete from task where pid = ${req.body.pid}`)
  con.query(`delete from project where pid = ${req.body.pid}; delete from task where pid = ${req.body.pid};`, (err, results) => {
    if (err) res.send(err)
    res.redirect('/editProjects')
  })
})

app.get('/addTask/:pid',appendManagerProjects , kickUnauthorizedManagerOrStudentFromGet, (req, res) => {
  var sql1 = `select * from task where pid = ${req.params.pid}; `
  con.query(sql1, (err, result) => {
    if (err) throw err;
    res.render("addTask.ejs", { user: req.user, taskPid: req.params.pid, tasks: result, stages: ["Plan", "Develop", "Finish"] });
  })
})

app.post('/addTask/', upload.none(),appendManagerProjects , kickUnauthorizedManagerOrStudentFromPost, (req, res) => {
  console.log(req.body.description)
  const sql = `insert into task(pid , title , descriptionText, deadline ,isDone , stage ) values(${req.body.pid} , "${req.body.title}" , "${req.body.description}", "${req.body.deadline}" , 0 , "${req.body.stage}" );`
  const sql2 =`insert into projectupdates(pid, date , description , whoWasThere )values(${req.body.pid},  current_date() , "TASK ADDED! Info: ${req.body.description}" , "${req.user.fullName}" );`
  con.query(sql + sql2, (err, result) => {
    if (err) { res.send("err"); }
    res.status(201).redirect('editProject/' + req.body.pid)
  })
})

app.get('/taskStatus/:pid/:tid', (req, res) => {
  res.render('taskStatus.ejs', { user: req.user, tid: req.params.tid, pid: req.params.pid })
})

app.post('/taskStatus', upload.none(), (req, res) => {
  console.log("pid" + req.body.pid + "tid" + req.body.tid)
  const sql = `update task set isDone = 1 where tid=${req.body.tid};`
  const sql2 = `insert into projectupdates(pid, date , description , whoWasThere )values(${req.body.pid},  current_date() , "TASK COMPLETE! Info: ${req.body.description}" , "${req.user.fullName}" );`
  console.log(sql + sql2)
  con.query(sql + sql2, (err, results) => {
    if (err) res.send(err)
    if (req.user.role == 'student') {
      return res.redirect('/myProject');
    }
    res.redirect('editProject/' + req.body.pid)
  })
})

app.get('/taskDelete/:pid/:tid', (req, res) => {
  res.render('taskDelete.ejs', { user: req.user, tid: req.params.tid, pid: req.params.pid })
})

app.get('/editStudent/:sid', (req, res) => {
  if (req.user.role == 'student') {
    if (req.user.id == req.params.sid) {
      const sql = `select * from student where sid = ${req.user.id}`
      con.query(sql, (err, result) => {
        if (result.length == 0) { res.send("can't find student data!") }
        res.render('editStudent.ejs', { user: req.user, message: "", students: result })
      })
    } else { res.redirect("/") }
  } else if (req.user.role == 'guest') {
    res.redirect("/")
  } else {
    res.render('editStudent.ejs', { user: req.user, message: "<b>you are editing a student's profile</b>" })
  }
})

app.post('/editStudent/', upload.none(), (req, res) => {

  if (req.user.role == 'student' || req.user.role == 'admin') {
    if (req.user.id == req.body.sid || req.user.role == 'admin') {
      const sql = `update student set id= ${req.body.id} , fullname = "${req.body.fullName}" , phoneNumber = "${req.body.phoneNumber}" where sid =${req.body.sid};`
      con.query(sql, (err, result) => {
        res.send(`done! <a href="editStudent/${req.user.id}">back</a>`)
      })
    } else { res.send(`you are trying to edit a different student! <a href="editStudent/${req.user.id}">back</a>`) }
  } else { `you are not a student! <a href="editStudent/${req.user.id}">back</a>` }
})

app.post('/taskDelete', upload.none(), (req, res) => {
  const sql = `delete from task where tid = ${req.body.tid};`
  const sql2 = `insert into projectupdates (pid , date , description , whoWasThere) values (${req.body.pid} , current_date() , "TASK DELETED! Info: ${req.body.description}" , "${req.user.fullName}");`
  con.query(sql + sql2, (err, results) => {
    if (err) res.send(err)
    res.redirect('editProject/' + req.body.pid)
  })
})

app.get('/myProject', (req, res) => {
  con.query(`select * from student where sid = ${req.user.id};` , (err , result)=>{
    if(err || result[0] == null) return res.send('error')
    if(result[0].pid == null){return res.send('you are not registered to a project yet!')}
    con.query(`select * from task where pid = ${result[0].pid};select * from _student_task inner join task on _student_task.tid = task.tid where sid=${req.user.id};;` , (error , result2)=>{
      if(error) return res.send('error');
      return res.render('studentProject.ejs' , {user : req.user , tasks: result2[0] , pid:result[0].pid , myTasks: result2[1] })
    });
  })
})

app.get('/projectRegister/:pid', (req, res) => {
  con.query(`select pid from student where sid = ${req.user.id}`, (err, result) => {
    console.log(result[0])
    if (result.length == 0) {
      return res.send(`you can't register to this project.`)
    } else {
      if (result[0].pid == null) {
        return res.render('projectRegister.ejs', { user: req.user, pid: req.params.pid, result });
      } else {
        return res.send(`You are already registered to a project.`)
      }
    }
  })
})

app.post('/projectRegister', upload.none(), (req, res) => {
  const sql1 = `select count(*) as count from student where pid =  ${req.body.pid};`
  const sql2 = `select maxStudents from project where pid =  ${req.body.pid};`
  const sql3 = `update student set pid = ${req.body.pid} where sid = ${req.user.id}`

  con.query(sql1 + sql2, (err, results) => {
    if (err || !results[1][0]) {
      console.log(err); return res.send('there was an error..')
    }
    const amountOfUsers = results[0][0].count;
    const maxStudents = results[1][0].maxStudents;

    if (amountOfUsers >= maxStudents) {
      return res.send('You did not register... <br> This project is FULL!')
    }

    con.query(sql3, (err, result) => {
      if (err) { console.log(err); return res.send('there was an error') }
      return res.send("<h1>Registered!</h1><br><h2>This project's manager will set up a meeting at the beginning of the semester. Please be patient. <a href='/'>BACK</a></h2>")
    })


  })

  // con.query(sql1 , (err, result) => {
  //   if (err) throw err;
  //   res.send("<h1>Registered!</h1><br><h2>This project's manager will set up a meeting at the beginning of the semester. Please be patient. <a href='/'></a></h2>")
  // })
})

//students
app.get('/students', (req, res) => {
  const sql = `select * from student;`;
  con.query(sql, (err, result) => {
    return res.render('students.ejs', { user: req.user, students: result })
  })

})

//managers
app.get('/addManager/:pid', (req, res) => {
  const sql = 'select * from manager;'
  const sql2 = `select * from project join manager on manager.mid = project.projectmanager where pid = ${req.params.pid};`;
  con.query(sql + sql2, (err, results) => {
    if (err) { console.log(err); return res.send('an error accured!') }
    return res.render('addManager.ejs', { user: req.user, managers: results[0], manager: results[1], pid: req.params.pid })
  })
})

app.post('/addManager', upload.none(), (req, res) => {
  const sql = `update project set projectmanager = '${req.body.mid}' where pid = ${req.body.pid} ;`;
  con.query(sql, (err, result) => {
    return res.redirect('/editProject/' + req.body.pid)
  })
})

app.get('/responsibilities/:tid', (req, res) => {
  const sql = `select * from task join student on task.pid = student.pid where tid = ${req.params.tid};`;
  const sql2 = `select * from _student_task join student on student.sid = _student_task.sid where tid=${req.params.tid};`;
console.log(sql2)
  con.query(sql + sql2, (err, results) => {
    if (err) { console.log(err); return res.send('there was an error'); }
    return res.render('responsibilities.ejs', { user: req.user, students: results[0], responsibilities: results[1], tid: req.params.tid })
  })
})

app.post('/responsibilities', upload.none(), (req, res) => {
  const sql = `insert into _student_task values(${req.body.tid}, ${req.body.sid});`;
  con.query(sql, (err, result) => {
    return res.redirect('back')
  })
})

app.get('/addStudent/:pid',appendManagerProjects , kickUnauthorizedManagerOrStudentFromGet, (req, res) => {
  const sql = `select * from student`;
  con.query(sql, (err, result) => {
    if (err) { console.log(err); return res.send('there was an error'); }
    return res.render('addStudent.ejs', { user: req.user, students: result, pid: req.params.pid })
  })
})

app.post('/addStudent/', upload.none(),appendManagerProjects , kickUnauthorizedManagerOrStudentFromPost ,(req, res) => {
  const sql = `update student set pid = ${req.body.pid} where sid = ${req.body.sid};`
  con.query(sql, (err, result) => {
    if (err) { console.log(err); return res.send('An error accured!') }
    return res.redirect('back');
  })
})

app.post('/removeStudentFromProject', upload.none(), (req, res) => {
  const sql = `update student set pid = null where sid = ${req.body.sid};`
  con.query(sql, (err, result) => {
    if (err) { console.log(err); return res.send('An error accured!') }
    return res.redirect('back');
  })
})


app.post('/removeResponsibility', upload.none(), (req, res) => {
  const sql = `delete from _student_task where tid= ${req.body.tid} and sid=${req.body.sid};`
  con.query(sql, (err, result) => {
    if (err) { console.log(err); return res.send('An error accured!') }
    return res.redirect('back');
  })
})


app.get('/onepager/:pid', appendManagerProjects ,kickUnauthorizedManagerOrStudentFromGet, (req, res) => {
  res.render('onepager.ejs', { user: req.user, pid: req.params.pid })
})

app.post('/onepager/', upload.single('file'),appendManagerProjects, kickUnauthorizedManagerOrStudentFromPost,(req, res) => {
  //res.send(`name  ${req.file.filename}, size ${req.file.size}, mime  ${req.file.mimetype}, dest ${req.file.destination}`)
  const sql = `update project set onepagerpath = "${req.file.filename}" where pid = ${req.body.pid}`
  con.query(sql, (err) => {
    if (err) { console.log(err); return res.send('there was an error!') }
    return res.send('ok!')
  })
})

app.post('/addMeeting', upload.none() , appendManagerProjects, kickUnauthorizedManagerOrStudentFromPost,(req, res) => {
  const sql = `insert into projectupdates (pid , date , description , whoWasThere) values (${req.body.pid} , CURDATE() , "MEETING CREATED! Info: ${req.body.description}" , "The project manager and , ${req.body.whoWasThere}");`  
  con.query(sql, (err) => {
    if (err) { console.log(err); return res.send('there was an error!') }
    return res.redirect('back')
  })
})


app.get('/available', (req, res) => {
  con.query(`select * from project where isRegisterable = 1` , (err , result)=>{
    res.render('available.ejs', { user: req.user , projects : result })
  });
})



//api
app.get('/api', () => {
  res.status(200).json({ message: "hi" })
})



app.listen(process.env.PORT, process.env.SERVER, () => {
  console.log('listening on :  http://' + process.env.SERVER + ":" + process.env.PORT);
  console.log(process.env.USER)
})