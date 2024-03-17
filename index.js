var client= require("./App")
var express= require("express");
const multer = require('multer');
var app= express();
var body_parser= require("body-parser")
const path = require('path');     

app.set('view engine', 'ejs');

app.use(body_parser.json())
app.use(body_parser.urlencoded({extended:true}));

app.use(express.static(__dirname + '/public'));

app.get("/navbar", function(req, res) {
  res.render("navbar", { pageTitle: "NAVBAR" });
});

app.get("/register", function(req, res) {
  res.render("register", { pageTitle: "Register" });
});


const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`); 
    },
  }); 

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'image/jpeg') {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG images are allowed'));
      }
    },
  });

app.post("/register", function (req, res) {
    var id= req.body.id;
    var Name= req.body.Name;
    var email= req.body.email;
    var Ph_no= req.body.Ph_no;
    var password= req.body.password;
    Upload_data_to_DB();


          async function Upload_data_to_DB() {
            try {
              var query= "insert into users (id,name,email,Ph_no,password) values('"+id+"','"+Name+"','"+email+"','"+Ph_no+"','"+password+"')"  
              client.query(query);
              res.send("registraion sucessful");
            } catch (error) {
              console.error('Error uploading:', error);
            }
          }


    
});




app.get("/login", function(req, res) {
  res.render("login", { pageTitle: "Login" });
});


app.post('/login', async (req, res) => {
    const { id, password } = req.body;
    
    try {
        const query = 'SELECT * FROM users WHERE id = $1 AND password = $2';
        const result = await client.query(query, [id, password]);
        
        if (result.rows.length > 0) {
            res.redirect("/posts");
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).send('Error occurred during authentication');
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.post('/upload', upload.single('postImage'), async (req, res) => {
    const { userId, content } = req.body;
    const postImage = req.file ? req.file.filename : null;
  
    try {
      const result = await client.query('INSERT INTO posts (user_id, content, image) VALUES ($1, $2, $3)', [userId, content, postImage]);      res.redirect(`/posts`);
    } catch (error) {
      console.error('Error uploading post:', error);
      res.status(500).send('Internal server error');
    }
  });;
  

app.get('/posts', async (req, res) => {
  try {
      const result = await client.query('SELECT * FROM posts ');

      if (result.rows.length === 0) {
          res.status(404).send('Post not found');
          return;
      }

      const posts = result.rows;
      res.render('posts', { pageTitle: 'Posts', posts });
  } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).send('Internal server error');
  }
});


app.get("/dashboard", function(req, res) {
  res.render("dashboard", { pageTitle: "Dashboard" });
});


app.listen(8000);
