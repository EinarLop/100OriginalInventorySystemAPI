const express = require('express');
const mysql = require ('mysql');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3010;
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
var cookieParser = require("cookie-parser");
app.use(express.json());
const corsConfig = { origin: true, credentials: true, }; 

app.use(cors(corsConfig));

//const jwt = require('jsonwebtoken');



app.use(cookieParser());

//  const connection = mysql.createConnection({
//    host:'us-cdbr-east-02.cleardb.com',
//     user:'b00abd3d14eb97',
//      password:'1fcadd8d',
//      database:'heroku_031336fa3af5061'

// // }) mysql -h us-cdbr-east-02.cleardb.com -u b00abd3d14eb97 -p

//  })

 var db_config = {
     host: 'us-cdbr-east-02.cleardb.com',
     user: 'b00abd3d14eb97',
     password: '1fcadd8d',
     database: 'heroku_031336fa3af5061'
};

const pool  = mysql.createPool({
  poolLimit : 10,
  host            : 'us-cdbr-east-02.cleardb.com',
  user            : 'b00abd3d14eb97',
  password        : '1fcadd8d',
  database        : 'heroku_031336fa3af5061'
});


pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});

let randomNumber;
function generateRandomNumber(){
  return Math.floor(Math.random() *10);
}

//routes
app.get('/', auth, function(req,res){
    res.send('Welcome to 100Original API');
})

// AUTHENTICATION MIDDLEWARE FOR PRIVATE ROUTES
function auth(req,res,next) {
    if(req.query.admin==randomNumber){
    next();    
    }   
    else{
        return res.status(401).send("User not authenticated");
    }
}


// Authentification routes
app.post('/login', async (req, res) => {
    // req.body has to be an object: {username, password}
    // Check that user exists in DB and retrieve it 
    const username = req.body.username;
    let user = {};

    const getUser = () => 
            new Promise((resolve, reject) => {
                pool.query(`SELECT * from user where username = '${username}'`, (err, results) => {
                    if (err) reject(err);
                    user = results[0];
                    resolve(results);
                });
            });

    await getUser();
    console.log(user);
    if (user === undefined) return res.status(400).send("Email/password is wrong");
    // if user exists, compare the hashed given password with hashed stored password
    const validPass = await bcrypt.compare(req.body.password, user.password);   // returns true or false
    if (!validPass) return res.status(400).send("Email/password is wrong")

    //res.send("Login successful");
    randomNumber = generateRandomNumber();
    res.cookie("100Orig-Id", randomNumber)
      .send("Login successful and Login successful Cookie is set");
      
})

app.post('/register', async (req, res)=>{
    // req.body has to be an object: {username, password}

    // 1. check that user does not exist

    // 2. validate the rest of the input: user, password etc

    // 3. hash the password!
    const salt = await bcrypt.genSalt(10);
    const hashPassw = await bcrypt.hash(req.body.password, salt);       // varchar(60)

    // Create the user object and insert into Database
    const sql = 'INSERT into user SET ?';
    const user = {
        "id_user": null,
        "username": req.body.username,
        "password": hashPassw,
        "privilege": 'A'
    };

    pool.query(sql, user, error =>{
        if(error) throw error;
        // res.header('Access-Control-Allow-Origin: *');
        // res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
        // res.header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
        res.send('USer registered succesfully');
    })
});

app.post('/sale',(req,res)=>{
    const sql ='INSERT into sale SET ?'
    product = {
        "id_sale": req.body.id_sale,
        "date": req.body.date,
        "total": req.body.total,
        "id_platform": req.body.id_platform,
    }
    pool.query(sql,product,error =>{
        if(error) {
            console.log(error);
            throw error;
        }
        res.send('Sale Created Succesfully!!!');
    })
})



app.post('/product',(req,res)=>{
    const sql ='INSERT into PRODUCT SET ?'
    product = {
        "id_product": req.body.id_product,
        "product_code": req.body.product_code,
        "unit_price": req.body.unit_price,
        "unit_cost": req.body.unit_cost,
        "stock": req.body.stock,
        "img_url": req.body.img_url,
    }    
    pool.query(sql,product,error =>{
        if(error) throw error;
        // res.header('Access-Control-Allow-Origin: *');
        // res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
        // res.header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
        res.send('Product Created Succesfully!!!');
    })
})

app.post('/productsale', (req, res) =>{
    const sql = 'INSERT into product_sale SET ?'
    ps = {
        "id_product": req.body.id_product,
        "id_sale": req.body.id_sale,
        "quantity": req.body.quantity
    }   

    pool.query(sql, ps, error =>{
        if (error) throw error;
        res.send('Cross reference created succesfully');
    })
})


app.get('/productsale/:id',(req,res)=>{
      const {id } = req.params;
    const sql = `SELECT * FROM product_sale WHERE id_sale="${id}"`;
    pool.query(sql,(error, results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })

})

// CRUD from sale
app.get('/platforms',(req,res)=>{
    const sql = "SELECT * from platform where id_platform='P001'";
    pool.query(sql,(error, results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })

})

app.get('/product', auth, (req,res)=>{
    const sql = "SELECT * from product";
    pool.query(sql,(error, results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})

app.get('/product/:id',(req,res)=>{
    const {id } = req.params;
    const sql = `SELECT * FROM product WHERE id_product="${id}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})

app.get('/sale',(req,res)=>{
    const sql = `SELECT * FROM sale`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})
    
app.get('/product/code/:product_code',(req,res)=>{
    const {product_code} = req.params;
    const sql = `SELECT * FROM product WHERE product_code="${product_code}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})

app.put('/product/:id',(req, res)=>{
    const {id } = req.params;
    const {id_product, product_code,unit_price, unit_cost, stock, img_url} = req.body;

    const sql = `UPDATE product SET id_product = '${id_product}', unit_price = '${unit_price}', unit_cost = '${unit_cost}',product_code = '${product_code}', stock = '${stock}', img_url = '${img_url}'  WHERE id_product = '${id}' `;
    pool.query(sql,error =>{
        if(error) throw error;
        res.send("Product updated succesfully!");
    })
})


app.put('/productstock/:id', async (req, res)=>{
    const {id} = req.params;
    const quantity = req.body.quantity;
    console.log("quantity: " + quantity);
    const stockQry = `SELECT stock from product where id_product = '${id}'`;
    let newStock = quantity;

    const getStock = () => 
            new Promise((resolve, reject) => {
                pool.query(`SELECT stock from product where id_product = '${id}'`, (err, results) => {
                    if (err) reject(err);
                    console.log(results[0].stock)
                    newStock = results[0].stock - quantity
                    resolve(results);
                });
            });
    await getStock();
    
    const sql = `UPDATE product SET stock = '${newStock}'  WHERE id_product = '${id}' `;
    pool.query(sql, error =>{
        if(error) throw error;
        res.send("Product stock updated succesfully!");
    })
})

app.get('/sale/:id',(req,res)=>{
    const {id } = req.params;
    const sql = `SELECT * FROM sale WHERE id_sale="${id}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})


app.delete("/sale/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE from sale WHERE id_sale = '${id}'`;

  pool.query(sql, (error) => {
    if (error) throw error;
    res.send("Sale deleted succesfully!");
  });
});

app.delete("/product/:id", (req, res) => {
    const { id } = req.params;
    const sql = `DELETE from product WHERE id_product = '${id}'`;
  
    pool.query(sql, (error) => {
      if (error) throw error;
      res.send("Product deleted succesfully!");
    });
});


//Test

//  Formato para hacer un post en sale 
// {
//     "id_sale": "S0002",
//     "date": "2020-07-11",
//     "quantity": 3,
//     "total": 1500,
//     "id_platform": "P1"
// }


/*
app.post('/sale',(req,res)=>{
    const sql ='INSERT into sale SET ?'
    product = {
        "id_sale": req.body.id_sale,
        "date": req.body.date,
        "quantity": req.body.quantity,
        "total": req.body.total,
        "id_platform": req.body.id_platform,
    }
    pool.query(sql,product,error =>{
        if(error) throw error;
        res.send('Sale Created Succesfully!!!');
    })
})


app.put('/sale/:id',(req, res)=>{
    const {id } = req.params;
    const {id_sale, date, quantity, total, id_platform} = req.body;

    const sql = `UPDATE sale SET id_sale = '${id_sale}', date = '${date}', quantity = '${quantity}', total = '${total}', id_platform = '${id_platform}' WHERE id_sale = '${id}' `;

    pool.query(sql,error =>{
        if(error) throw error;
        res.send("Sale updated succesfully!");
    })

})

app.delete("/sale/:id", (req, res)=>{
    const {id } = req.params;
    const sql = `DELETE from sale WHERE id_sale = '${id}'`;

    pool.query(sql,error=>{
        if(error) throw error; 
        res.send('Sale deleted succesfully!');
    })

})

app.get('/sale/:id',(req,res)=>{
    const {id } = req.params;
    const sql = `SELECT * FROM sale WHERE id_sale="${id}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})



// CRUD from product


})


//  Formato para hacer un post de un nuevo de producto
// {
//     "id_product": "P0007",
//     "unit_price": 350,
//     "unit_cost": 200,
//     "product_name": "Reloj contra agua casio",
//     "product_code": "CAS10201",
//     "stock": 5,
//     "img_url": "www.casioAgua.com",
//     "id_type": "T1",
//     "id_supplier": "S1003"
// }





app.delete("/product/:id", (req, res)=>{
    const {id } = req.params;
    const sql = `DELETE from product WHERE id_product = '${id}'`;

    pool.query(sql,error=>{
        if(error) throw error; 
        res.send('Product deleted succesfully!');
    })

})





//CRUD from supplier 
app.get('/supplier',(req,res)=>{
    const sql = "SELECT * from supplier";
    pool.query(sql,(error, results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })

})
//  Formato para hacer un post de supplier
// {
//         "id_supplier": "S0001",
//         "name": "Bryan Monroy",
//         "contact": "bryamon@gmail.com"
// }

app.post('/supplier',(req,res)=>{
    const sql ='INSERT into supplier SET ?'
    supplier = {
        "id_supplier": req.body.id_supplier,
        "name": req.body.name,
        "contact": req.body.contact,
    }
    pool.query(sql,supplier,error =>{
        if(error) throw error;
        res.send('Supplier Created Succesfully!!!');
    })
})
app.put('/supplier/:id',(req, res)=>{
    const {id } = req.params;
    const {id_supplier, name, contact} = req.body;

    const sql = `UPDATE supplier SET id_supplier = '${id_supplier}', name = '${name}', contact = '${contact}'WHERE id_supplier = '${id}' `;
    pool.query(sql,error =>{
        if(error) throw error;
        res.send("Supplier updated succesfully!");
    })

})

app.delete("/supplier/:id", (req, res)=>{
    const {id } = req.params;
    const sql = `DELETE from supplier WHERE id_supplier = '${id}'`;

    pool.query(sql,error=>{
        if(error) throw error; 
        res.send('Supplier deleted succesfully!');
    })

})


app.get('/supplier/:id',(req,res)=>{
    const {id } = req.params;
    const sql = `SELECT * FROM supplier WHERE id_supplier="${id}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})

// CRUD from operation
app.get('/operation',(req,res)=>{
    const sql = "SELECT * from operation";
    pool.query(sql,(error, results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })

})
// Formato para hacer un post de operation
//     {
//         "id_operation": "O00002",
//         "type": "entrada",
//         "comment": "Devolucion por error de modelo",
//         "id_user": "U0001"
//     }

app.post('/operation',(req,res)=>{
    const sql ='INSERT into operation SET ?'
    operation = {
        "id_operation": req.body.id_operation,
        "type": req.body.type,
        "comment": req.body.comment,
        "id_user": req.body.id_user,
    }
    pool.query(sql,operation,error =>{
        if(error) throw error;
        res.send('Operation Created Succesfully!!!');
    })
})

app.put('/operation/:id',(req, res)=>{
    const {id } = req.params;
    const {id_operation, type, comment,id_user} = req.body;

    const sql = `UPDATE operation SET id_operation = '${id_operation}', type = '${type}', comment = '${comment}', id_user = '${id_user}'WHERE id_operation = '${id}' `;
    pool.query(sql,error =>{
        if(error) throw error;
        res.send("Operation updated succesfully!");
    })

})

app.delete("/operation/:id", (req, res)=>{
    const {id } = req.params;
    const sql = `DELETE from operation WHERE id_operation = '${id}'`;

    pool.query(sql,error=>{
        if(error) throw error; 
        res.send('Operation deleted succesfully!');
    })

})


app.get('/operation/:id',(req,res)=>{
    const {id } = req.params;
    const sql = `SELECT * FROM operation WHERE id_operation="${id}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})

// CRUD from platform
app.get('/platform',(req,res)=>{
    const sql = "SELECT * from platform";
    pool.query(sql,(error, results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })

})
// Formato para hacer un post de platform
//     {
//         "id_platform": "P1",
//         "name": "Amazon"
//     }

app.post('/platform',(req,res)=>{
    const sql ='INSERT into platform SET ?'
    platform = {
        "id_platform": req.body.id_platform,
        "name": req.body.name,
    }
    pool.query(sql,platform,error =>{
        if(error) throw error;
        res.send('Platform Created Succesfully!!!');
    })
})

app.put('/platform/:id',(req, res)=>{
    const {id } = req.params;
    const {id_platform, name} = req.body;

    const sql = `UPDATE platform SET id_platform = '${id_platform}', name = '${name}' WHERE id_platform = '${id}' `;
    pool.query(sql,error =>{
        if(error) throw error;
        res.send("Platform updated succesfully!");
    })

})

app.delete("/platform/:id", (req, res)=>{
    const {id } = req.params;
    const sql = `DELETE from platform WHERE id_platform = '${id}'`;

    pool.query(sql,error=>{
        if(error) throw error; 
        res.send('Platform deleted succesfully!');
    })

})
app.get('/platform/:id',(req,res)=>{
    const {id } = req.params;
    const sql = `SELECT * FROM platform WHERE id_platform="${id}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})

// CRUD from type
app.get('/type',(req,res)=>{
    const sql = "SELECT * from type";
    pool.query(sql,(error, results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })

})
//  Formato para hacer un post de type
//     {
//         "id_type": "T1",
//         "name": "Reloj"
//     }


app.post('/type',(req,res)=>{
    const sql ='INSERT into type SET ?'
    type = {
        "id_type": req.body.id_type,
        "name": req.body.name,
    }
    pool.query(sql,type,error =>{
        if(error) throw error;
        res.send('Type Created Succesfully!!!');
    })
})

app.put('/type/:id',(req, res)=>{
    const {id } = req.params;
    const {id_type, name} = req.body;

    const sql = `UPDATE type SET id_type = '${id_type}', name = '${name}' WHERE id_type = '${id}' `;
    pool.query(sql,error =>{
        if(error) throw error;
        res.send("Type updated succesfully!");
    })

})

app.delete("/type/:id", (req, res)=>{
    const {id } = req.params;
    const sql = `DELETE from type WHERE id_type = '${id}'`;

    pool.query(sql,error=>{
        if(error) throw error; 
        res.send('Type deleted succesfully!');
    })

})

app.get('/type/:id',(req,res)=>{
    const {id } = req.params;
    const sql = `SELECT * FROM type WHERE id_type="${id}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})

// CRUD from user
app.get('/user',(req,res)=>{
    const sql = "SELECT * from user";
    pool.query(sql,(error, results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })

})
//  Formato para hacer un post de type
//     {
//         "id_user": "U0001",
//         "username": "Rosa01",
//         "password": "Password123",
//         "privilege": "A"
//     }

app.post('/user',(req,res)=>{
    const sql ='INSERT into user SET ?'
    user = {
        "id_user": req.body.id_user,
        "username": req.body.username,
        "password": req.body.password,
        "privilege": req.body.privilege,

    }
    pool.query(sql,user,error =>{
        if(error) throw error;
        res.send('User Created Succesfully!!!');
    })
})

app.put('/user/:id',(req, res)=>{
    const {id } = req.params;
    const {id_user, username,password,privilege} = req.body;

    const sql = `UPDATE user SET id_user = '${id_user}', username = '${username}', password = '${password}', privilege = '${privilege}' WHERE id_user = '${id}' `;
    pool.query(sql,error =>{
        if(error) throw error;
        res.send("User updated succesfully!");
    })

})

app.delete("/user/:id", (req, res)=>{
    const {id } = req.params;
    const sql = `DELETE from user WHERE id_user = '${id}'`;

    pool.query(sql,error=>{
        if(error) throw error; 
        res.send('User deleted succesfully!');
    })

})



app.get('/user/:id',(req,res)=>{
    const {id } = req.params;
    const sql = `SELECT * FROM user WHERE id_user="${id}"`;
    pool.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length >0){
            res.json(results);
        }else{
            res.send('No results');
        }

    })
})


*/

pool.getConnection(error =>{
    if(error) throw error;
    console.log('Database up and running');

})



app.listen(PORT,()=>console.log('Server up and running '+PORT))