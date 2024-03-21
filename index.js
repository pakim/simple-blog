import express from "express";
import bodyParser from "body-parser";
const app = express();
const port = 3000;
const posts = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.render("index.ejs", {
    postList: posts
  });
});

app.get("/add", (req, res) => {
  res.render("addPost.ejs");
});

app.get("/edit/:id", (req, res) => {
  res.render("editPost.ejs", {
    id: req.params.id,
    postList: posts
  });
});

app.get("/delete/:id", (req, res) => {
  posts.splice(req.params.id, 1);
  res.render("index.ejs", {
    postList: posts
  });
});

app.post("/newPost", (req, res) => {
  const date = new Date().toDateString();
  posts.unshift({
    title: req.body["title"],
    body: req.body["body"],
    dateCreated: date,
    updated: false
  });

  res.render("index.ejs", {
    postList: posts
  });
});

app.post("/update/:id", (req, res) => {
  const index = req.params.id;
  const date = new Date().toDateString();
  
  posts[index].title = req.body["title"];
  posts[index].body = req.body["body"];
  posts[index].updated = true;
  posts[index].dateCreated = date;
  res.render("index.ejs", {
    postList: posts
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});