import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

env.config();

const app = express();
const port = 3000;
const salt_rounds = parseInt(process.env.SALT_ROUNDS);
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT)
});

db.connect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkEmail = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if(checkEmail.rows.length === 0) {
      bcrypt.hash(password, salt_rounds, async (err, hash) => {
        if(err) {
          console.error("Error hashing password:", err);
        }
        else {
          try {
            const result = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [email, hash]);
            const user = result.rows[0];

            req.login(user, (err) => {
              if(err) {
                console.error("Error logging in:", err);
              }
              else {
                console.log("Registration successful");
                res.redirect("/");
              }
            })
          }
          catch(err) {
            console.error("Error inserting user into database:", err);
          }
        }
      });
    }
    else {
      console.log("Email already exists");
      res.redirect("/login");
    }
  }
  catch(err) {
    console.error("Error retrieving email data:", err);
  }
});

app.post("/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
  })
);

passport.use("local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);

      if(result.rows.length > 0) {
        const user = result.rows[0];
        const savedPassword = user.password;

        bcrypt.compare(password, savedPassword, (err, valid) => {
          if(err) {
            console.error("Error comparing passwords: ", err);
            return cb(err);
          }
          else {
            if(valid) {
              cb(null, user);
            }
            else {
              cb(null, false);
            }
          }
        });
      }
      else {
        return cb("Email not found");
      }
    }
    catch(err) {
      console.error("Error checking authentication:", err);
    }
  })  
);

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if(err) {
      return next(err);
    }
    else {
      res.redirect("/");
    }
  });
});

app.get("/", async (req, res) => {
  if(req.isAuthenticated()) {
    try {
      const result = await db.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY id DESC", [req.user.id]);
      const posts = result.rows;

      res.render("index.ejs", { postList: posts });
    }
    catch(err) {
      console.error("Error retrieving posts:", err);
    }
  }
  else {
    res.redirect("/login");
  }
});

app.get("/add", (req, res) => {
  if(req.isAuthenticated()) {
    res.render("addPost.ejs");
  }
  else {
    res.redirect("/");
  }
});

app.get("/edit/:id", async (req, res) => {
  if(req.isAuthenticated()) {
    const id = parseInt(req.params.id);

    try {
      const result = await db.query("SELECT * FROM posts WHERE id = $1 and user_id = $2", [id, req.user.id]);
      const post = result.rows[0];

      res.render("editPost.ejs", { post: post });
    }
    catch(err) {
      console.error("Error retrieving post:", err);
    }
  }
  else {
    res.redirect("/");
  }
});

app.post("/delete/:id", async (req, res) => {
  if(req.isAuthenticated()) {
    const id = parseInt(req.params.id);

    try {
      await db.query("DELETE FROM posts WHERE id = $1 and user_id = $2", [id, req.user.id]);
    }
    catch(err) {
      console.error("Error deleting post:", err);
    }

    res.redirect("/");
  }
  else {
    res.redirect("/");
  }
});

app.post("/newPost", async (req, res) => {
  if(req.isAuthenticated()) {
    const date = new Date().toDateString();
    const updated = false;
    const title = req.body.title;
    const body = req.body.body;
    const id = req.user.id;

    try {
      await db.query("INSERT INTO posts (title, body, date_created, updated, user_id) VALUES ($1, $2, $3, $4, $5)",
                      [title, body, date, updated, id]);
    }
    catch(err) {
      console.error("Error adding new post:", err);
    }

    res.redirect("/");
  }
  else {
    res.redirect("/");
  }
});

app.post("/update/:id", async (req, res) => {
  if(req.isAuthenticated()) {
    const id = parseInt(req.params.id);
    const date = new Date().toDateString();
    const title = req.body.title;
    const body = req.body.body;

    try {
      await db.query("UPDATE posts SET title = $1, body = $2, date_created = $3, updated = true WHERE id = $4 and user_id = $5", 
                      [title, body, date, id, req.user.id]);
    }
    catch(err) {
      console.error("Error updating post:", err);
    }

    res.redirect("/");
  }
  else {
    res.redirect("/");
  }
  
});

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});