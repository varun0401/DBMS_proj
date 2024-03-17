var client= require("./App")
var express= require("express");
const multer = require('multer');
var app= express();
var body_parser= require("body-parser")
const path = require('path'); 
const session = require('express-session');    

app.set('view engine', 'ejs');

app.use(body_parser.json())
app.use(body_parser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));
app.use('/profile-pics', express.static(__dirname + '/profile-pics'));


app.use(session({
  secret: 'varun', 
  resave: false,
  saveUninitialized: true
}));

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



  const profilePicStorage = multer.diskStorage({
    destination: 'profile-pics/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`);
    },
});

const upload_profile = multer({
  storage: profilePicStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG images are allowed'));
    }
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

  
  app.post("/update-profile", upload_profile.single('profilePic'), async function(req, res) {
    try {
      const profilePic = req.file ? req.file.filename : null;
      const userId = req.session.userId; 
      const profilePicPath = req.file.path; 
      const query = "UPDATE users SET profile_pic_path = $1 WHERE id = $2";
      await client.query(query, [profilePicPath, userId]);
  
      req.session.profilePic = profilePicPath;
  
      res.redirect("/profile");
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Error occurred during profile update');
    }
  });
  


  app.post("/register", async function (req, res) {
    try {
      var id = req.body.id;
      var Name = req.body.name;
      var email = req.body.email;
      var Ph_no = req.body.phone_number;
      var password = req.body.password;
      if (!id) {
        throw new Error('ID is required for registration');
      }

      id = Number(id);
      const query = "INSERT INTO users (id, name, email, Ph_no, password) VALUES ($1, $2, $3, $4, $5)";
      await client.query(query, [id, Name, email, Ph_no, password]);
  
      res.send("Registration successful");
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).send('Error occurred during registration');
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
            req.session.userId = id;
            res.redirect("/home");
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

// app.get("/profile_pic", async function(req, res) {
//   console.log('Session User ID:', req.session.userId);

//   try {
//     const userId = req.session.userId;
//     const query = 'SELECT profile_pic_path FROM users WHERE id = $1';
//     const result = await client.query(query, [userId]);

//     if (result.rows.length > 0) {
//       const profilePic = result.rows[0].profile_pic_path;
//       req.session.profilePic = profilePic;
//       res.send(profilePic);
//     } else {
//       res.status(404).send('Profile picture path not found');
//     }
//   } catch (error) {
//     console.error('Error fetching profile picture path:', error);
//     res.status(500).send('Internal server error');
//   }
// });


app.get("/home", async function(req, res) {
  try {
    const userId = req.session.userId;
    const post = await client.query('SELECT * FROM posts ');
    const query1 = 'SELECT profile_pic_path FROM users WHERE id = $1';
    const result1 = await client.query(query1, [userId]);
    const profilePic = result1.rows[0].profile_pic_path;
    
    const posts = post.rows;
    console.log(profilePic);

    if (!userId) {
      throw new Error('User ID not found in session');
    }

    const query = 'SELECT name FROM users WHERE id = $1';
    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found in database');
    }

    const name = result.rows[0].name;
    req.session.name = name;
    res.render("home", { pageTitle: "Home page", name, userId, posts,profilePic });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Error occurred while fetching user data');
  }
});


app.get("/profile", async function(req, res) {
  const name = req.session.name;
  const userId = req.session.userId; 
  res.render("profile", { pageTitle: "Profile", userId,name });
});




app.listen(8000);
