const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(
    "mongodb://127.0.0.1:27017/studyhub"
)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log("MongoDB Error:", err);
});

// Static Files
app.use(express.static(
    path.join(__dirname, "public")
));

// Upload Folder Access
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// Notes Routes
app.use(
    "/api/notes",
    require("./routes/notes")
);

// Home Route
app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

// Start Server
app.listen(PORT, () => {

    console.log(
        `Server Running On http://localhost:${PORT}`
    );

});