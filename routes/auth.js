const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

router.post("/signup", async(req,res)=>{

    try{

        const {name,email,password} = req.body;

        const hashedPassword =
        await bcrypt.hash(password,10);

        const user = new User({

            name,
            email,
            password:hashedPassword

        });

        await user.save();

        res.json({

            success:true,
            message:"User Created"

        });

    }

    catch(error){

        res.status(500).json(error);

    }

});

router.post("/login", async(req,res)=>{

    try{

        const {email,password} = req.body;

        const user =
        await User.findOne({email});

        if(!user){

            return res.json({
                success:false,
                message:"User Not Found"
            });

        }

        const valid =
        await bcrypt.compare(
            password,
            user.password
        );

        if(!valid){

            return res.json({
                success:false,
                message:"Wrong Password"
            });

        }

        const token =
        jwt.sign(

            {id:user._id},

            process.env.JWT_SECRET,

            {
                expiresIn:"7d"
            }

        );

        res.json({

            success:true,

            token

        });

    }

    catch(error){

        res.status(500).json(error);

    }

});

module.exports = router;