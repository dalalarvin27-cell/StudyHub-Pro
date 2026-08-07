const express = require("express");
const router = express.Router();
const multer = require("multer");

const Note = require("../models/Note");

const storage = multer.diskStorage({

    destination:(req,file,cb)=>{
        cb(null,"uploads/");
    },

    filename:(req,file,cb)=>{
        cb(null,Date.now()+"-"+file.originalname);
    }

});

const upload = multer({storage});

router.post("/upload",upload.single("pdf"),async(req,res)=>{

    try{

        const note = new Note({

            title:req.body.title,
            subject:req.body.subject,
            pdf:req.file.filename

        });

        await note.save();

        res.json({

            success:true

        });

    }catch(err){

        res.status(500).json(err);

    }

});

router.get("/all",async(req,res)=>{

    const notes=await Note.find();

    res.json(notes);

});

module.exports=router;