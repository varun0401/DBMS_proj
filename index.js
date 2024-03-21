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

const upload_doc = multer({
  storage: profilePicStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG images are allowed'));
    }
  },
});

const presentingStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'presenting/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) 
}
});
const presentingUpload = multer({ storage: presentingStorage });


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
      const about = req.body.about;
      const profilePicPath = req.file ? req.file.path : null;  
      const sem = req.body.sem;
      const sec = req.body.sec; 
      req.session.sem = sem;
      req.session.sec = sec;
      
      if (req.file) {
        const queryUpdateProfile = "UPDATE users SET profile_pic_path = $1 WHERE id = $2";
        await client.query(queryUpdateProfile, [profilePicPath, userId]);
      }
  
      const queryFetchSSID = 'SELECT SSID FROM semsec WHERE sem = $1 AND sec = $2';
      const resultFetchSSID = await client.query(queryFetchSSID, [sem, sec]);

      
      if (resultFetchSSID.rows.length > 0) {
        const SSID = resultFetchSSID.rows[0].ssid;  
        const queryInsertClassUser = 'INSERT INTO class_user (user_id, SSID) VALUES ($1, $2)';
        await client.query(queryInsertClassUser, [userId, SSID]);
        req.session.ssid = SSID;

        req.session.profilePic = profilePicPath;
      } else {
        console.log('No SSID found for sem:', sem, 'and sec:', sec);
      }
  
      res.redirect("/profile");
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Error occurred during profile update');
    }
  });
  
  
  app.post("/edit-profile",async function(req, res) {
    try {
      const userId = req.session.userId;
      const sem = req.body.sem;
      const sec = req.body.sec; 
      req.session.sem = sem;
      req.session.sec = sec;


      const checkQuery = "SELECT * FROM semsec WHERE user_id = $1";
      const checkResult = await client.query(checkQuery, [userId]);
      if (!sem) {
        throw new Error('Semester information is required.');
      }

      if (checkResult.rows.length > 0) {
        
        const updateQuery = "UPDATE semsec SET sem = $1, sec = $2 WHERE user_id = $3";
        await client.query(updateQuery, [sem, sec, userId]);
      } else {
       
        const insertQuery = "INSERT INTO semsec (user_id, sem, sec) VALUES ($1, $2, $3)";
        await client.query(insertQuery, [userId, sem, sec]);
      }
  
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




  app.post("/delete_post", async function(req, res) {
    const postId = req.body.postId; 
  
    try {
      const query = 'DELETE FROM posts WHERE id = $1';
      await client.query(query, [postId]);
  
      res.redirect("/home"); 
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).send('Internal server error');
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

app.post('/upload-document', upload_doc.single('document'), (req, res) => {
  const uploadedDocument = req.file;
  req.session.document = uploadedDocument;
  documents.push({ id: documents.length + 1, name: uploadedDocument.originalname });
  res.redirect('/room');
});


app.get('/room', (req, res) => {
  const documents = req.session.document;
  res.render('room', { pageTitle: 'Collaborative Room', documents });
});

app.get("/home", async function(req, res) {
  try {
    const userId = req.session.userId;
    const post = await client.query('SELECT * FROM posts ');
    const query1 = 'SELECT profile_pic_path FROM users WHERE id = $1';
    const result1 = await client.query(query1, [userId]);
    console.log(result1);

    const profilePic = result1.rows[0].profile_pic_path;
    const sem = req.session.sem;
    const sec= req.session.sec;
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
    res.render("home", { pageTitle: "Home page", name, userId, posts,profilePic,sem,sec });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Error occurred while fetching user data');
  }
});


app.get("/profile", async function(req, res) {
  const name = req.session.name;
  const userId = req.session.userId; 
  const profilePic = req.session.profilePic;
  res.render("profile", { pageTitle: "Profile", userId,name,profilePic});
});



app.get('/create-room', (req, res) => {
  res.render("create_room", { pageTitle: "create room"});
});

app.post('/create-room', (req, res) => {
  const { Room_name } = req.body;
  const roomId = Math.floor(Math.random() * 1000000); 
  res.send(`Room "${Room_name}" created with ID ${roomId}`);
});

app.get("/join",(req,res)=>{
  res.render("join", { pageTitle: "Join room"});
});


app.use('/presenting', express.static(path.join(__dirname, 'presenting')));
app.post("/presenting", presentingUpload.single('presenting'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const userId = req.session.userId;
    const title = req.body.title;
    const subject_code = req.body.subject_code;
    const room_id = Math.floor(Math.random() * 1000000);

    // Retrieve the file path and name
    const notes = req.file.filename;
    const notes_path = req.file.path;
    req.session.room_id= room_id;
    const query = 'select ssid from class_user where user_id= $1';
    const result = await client.query(query, [userId]);
    const SSID=result.rows[0].ssid         

    // Insert post into the database
    const queryInsertPost = 'INSERT INTO presenting (user_id, SSID, title, notes, subject_code, room_id) VALUES ($1, $2, $3, $4, $5, $6)';
    const resultInsert = await client.query(queryInsertPost, [userId, SSID, title, notes_path, subject_code, room_id]);

    console.log('Post uploaded successfully:', resultInsert.rows[0]);
    res.redirect(`/presenting`);
  } catch (error) {
    console.error('Error uploading post:', error);
    res.status(500).send('Internal server error');
  }
});

app.get("/presenting", async function(req,res){
  res.render("presenting");
} );

app.post("/view", async function(req, res) {
  try {
    const userId = req.session.userId;
    const room_id = req.body.room_id; 
    console.log(room_id);

    if (!userId) {
      throw new Error('User ID not found in session');
    }

    // Check if the view already exists
    const checkViewQuery = 'SELECT EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = $1)';
    const viewExists = await client.query(checkViewQuery, ['presenting_notes']);

    if (viewExists.rows[0].exists) {
      // Drop the existing view if it exists
      const dropViewQuery = 'DROP VIEW IF EXISTS presenting_notes';
      await client.query(dropViewQuery);
    }

    // Create the view presenting_notes
    const queryCreateView = `CREATE VIEW presenting_notes AS SELECT notes FROM presenting WHERE room_id = ${room_id}`;
    await client.query(queryCreateView);
    
    // Fetch data from the presenting_notes view
    const queryFetchNotes = 'SELECT * FROM presenting_notes';
    const presenting_notes = await client.query(queryFetchNotes);    

    const queryUserName = 'SELECT name FROM users WHERE id = $1';
    const userResult = await client.query(queryUserName, [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found in database');
    }
    const name = userResult.rows[0].name;

    res.render("view", { pageTitle: "view page", name, userId, posts: presenting_notes.rows, sem: req.session.sem, sec: req.session.sec, presenting_notes: presenting_notes.rows });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Error occurred while fetching user data');
  }
});



app.post("/new-upload", presentingUpload.single('presenting'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const userId = req.session.userId;
    const title = req.body.title;
    const subject_code = req.body.subject_code;

    // Retrieve the file path and name
    const notes = req.file.filename;
    const notes_path = req.file.path;
    room_id=req.session.room_id
    const query = 'select ssid from class_user where user_id= $1';
    const result = await client.query(query, [userId]);
    const SSID=result.rows[0].ssid         

    const queryInsertPost = 'INSERT INTO presenting (user_id, SSID, title, notes, subject_code, room_id) VALUES ($1, $2, $3, $4, $5, $6)';
    const resultInsert = await client.query(queryInsertPost, [userId, SSID, title, notes_path, subject_code, room_id]);
   
    console.log('Post uploaded successfully:',  resultInsert.rows[0]);
    res.redirect(`/presenting`);
  } catch (error) {
    console.error('Error uploading post:', error);
    res.status(500).send('Internal server error');
  }
});



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



  app.get("/download", (req, res) => {
    const filePath = req.query.file_path;
    if (filePath) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});
app.listen(8000);
