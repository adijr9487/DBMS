const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mysql = require('mysql');
const sessions = require('client-sessions');
const session = require('express-session');


// enabling express
const app = express();

// connecting to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'comp_man',
});

connection.connect((err)=>{
    if(!err)
    {
        console.log('Database Connected');
    }else{
        console.log(err);
    }
})

// setting up engine, public folder and parser

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(session({
    cookieName: 'session',
    secret: 'thisissecret',
    duration: 60*60*100, //60min
}));

//variables

//queries
const createTable = `CREATE TABLE sampleTable (
    id INT(2) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(50),
    name VARCHAR(30) NOT NULL,
    password VARCHAR(30) NOT NULL,
    phone VARCHAR(10),
    )`;

const Joining = `SELECT * FROM (('coust_comp' INNER JOIN complain_table ON coust_comp.complaint_id = complain_table.id)
    INNER JOIN coustomer_table ON coust_comp.coustomer_id = coustomer_table.Id;`

const post_query = "INSERT INTO coustomer_table SET ?";
const complain_post_query = "INSERT INTO complain_table SET ?";
// const complaint_history_query =  
const comp_coust_post_query = 'INSERT INTO coust_comp SET ?'

//get routers
app.get('/', (req, res)=>{
    if(req.session.items){
    res.render('userdashboard', {data: req.session.items})
    }
    else{
        res.render('index');
    }
    console.log(req.session.items)
});
app.get('/userslogin',(req, res)=>{
    if(req.session.items){
    res.render('userdashboard', {data: req.session.items})
    }
    else{
        res.render('userslogin', {"state": ""})
    }
    console.log(req.session.items)
})
app.get('/userregistration', (req, res)=>{
    if(req.session.items){
    res.render('userdashboard', {data: req.session.items})
    }
    else{
        res.render('userregistration', {"state": ""})
    }
    console.log(req.session.items)
    
    
})
app.get('/userdashboard', (req, res)=>{
    if(req.session.items){
    res.render('userdashboard', {data: req.session.items})
    }
    else{
        res.redirect('/userslogin');
    }
    console.log(req.session.items)

});
app.get('/userprofile', (req, res)=>{
    if(req.session.items){
        res.render('userprofile', {data: req.session.items})
        }
        else{
            res.redirect('/userslogin');
        }
        console.log(req.session.items)
    
    
})
app.get('/complainthistory', (req, res)=>{
    if(req.session.items){
        connection.query('SELECT * FROM coust_comp INNER JOIN complain_table ON complaint_id = complain_table.Id', (err, complains)=>{
            if(!err)
                console.log(complains);
            if(complains.length)
                res.render('complainthistory', {data: req.session.items, complains: complains})
            else{
                res.render('complainthistory', {data: req.session.items, complains: []})
            }
        });
    }
    else{
        res.redirect('/userslogin');
    }
    console.log(req.session.items)

})
app.get('/admindashboard', (req, res)=>{
    res.render('admindashboard');
    
})
app.get('/admin', (req, res)=>{
    res.render('admin');
})
// post routers

app.post('/userslogin', (req, res)=>{
    // console.log(req.body)
    const phone = req.body.phonenumber;
    const password = req.body.pass;
    connection.query(`SELECT * FROM coustomer_table WHERE phone='${phone}'`, (err, fount_item)=>{
        if(!fount_item.length)
        {
            console.log('invalid phno.')
            res.render('userslogin', {"state": "Invalid Phone Number or you might have'nt registered yet"})
            
        }
        else{
            // console.log(fount_item);
            if(fount_item[0].password == password)
            {
                req.session.items = fount_item;
                res.redirect('/userdashboard')
            }
            else{
                res.render('userslogin', {"state": "Wrong Password"})
            }
        }
    })
})

app.post('/userregistration', (req, res)=>{
    console.log(req.body)
    let post = {
        first_name : req.body.firstname,
        last_name: req.body.lastname,
        phone: req.body.phonenumber,
        email: req.body.email,
        password: req.body.pass,
    };
    connection.query(`SELECT * FROM coustomer_table WHERE email='${req.body.email}'`, (err, found_email)=>{
        // console.log(found_email)
        if(found_email.length)
        {
            connection.query(`SELECT * FROM coustomer_table WHERE phone='${req.body.phonenumber}'`, (err, found_phone)=>{
                if(found_phone.length){
                    res.render('userregistration', {'state': 'Email and Phone is already in use'});
                }
                else{
                    res.render('userregistration', {'state': 'Email is already in use'});
                }
            });             
        }
        else{
            connection.query(`SELECT * FROM coustomer_table WHERE phone='${req.body.phonenumber}'`, (err, found_phone)=>{
                if(found_phone.length){
                    res.render('userregistration', {'state': 'Phone is already in use'});
                }
                else{
                    connection.query(post_query, post, (err, result) =>{
                        console.log(result);
                        if(err) throw err;
                    });
                    console.log('Data Successfully Submited');
                    res.redirect('/userslogin'); 
                }
            });
        }
    });
});

app.post('/admin', (req, res)=>{
    console.log(req.body)
    // 
})
app.post('/userdashboard', (req, res)=>{
    // console.log(req.body)
    let post = {
        vic_name : req.body.victimname,
        date : req.body.dateofcrime,
        time : req.body.timeofcrime,
        address : req.body.address,
        type : req.body.type,
        phone : req.body.contact,
        description : req.body.description
    };
    // console.log(post);
    connection.query(complain_post_query, post, function(err, rows){
        if(err)
            console.log(err);
        else{
            console.log(rows)
            console.log(rows.insertId);
            post = {
                customer_id : req.session.items[0].Id,
                complaint_id :rows.insertId,

            }
            connection.query(comp_coust_post_query, post, (err, relares)=>{
                if(err) throw err;
                else{
                    console.log(relares);
                }
            });
            res.redirect('/complainthistory');
        }
    });


    // 
})
app.post('/complainthistory', (req, res)=>{
    console.log(req.body)
    // 
})
app.post('/userprofile', (req, res)=>{
    console.log(req.body)
    
})
app.post('/admindashboard', (req, res)=>{
    console.log(req.body)
    
})


// app.get('/register', (req, res)=>{
//     res.render('register');
//     connection.query('SELECT * FROM sampleTable', (err, items)=>{
//         if(err)
//         {
//             console.log(err)
//             connection.query('CREATE TABLE sampleTable (id INT(2) AUTO_INCREMENT PRIMARY KEY,email VARCHAR(50),name VARCHAR(30) NOT NULL,password VARCHAR(30) NOT NULL,phone VARCHAR(10),)', (err, result)=>{
//                 if(err) throw err;
//                 else{
//                     console.log('no err')
//                 }
                
//             });
//         }else
//         {
//             // console.log(err)
//             console.log('No err')
//         }
//     });
// })

// //reciever
// app.post('/login', (req, res)=>{
//     var email = req.body.email;
//     var password = req.body.password;
//     connection.query(`SELECT * FROM sampleTable WHERE email='${email}'`, (err, item, it)=>{
//         if(err) {
//             console.log('Invalid Email');
//             console.log(err);
//         }
//         else{
//             console.log(it);
//             console.log(item);

//         }   
//     });
// })

// app.post('/register', (req, res)=>{
    
// })

app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server is running on PORT 3000');
})