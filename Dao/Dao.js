
User= require('../model/model.js');

exports.Dao_index = function(req,callback)
{
    User.get(function (err,user){
        if (err)
            callback.json({
                status : "Error",
                message: err
            });
            callback.json({
                status : "Success",
                message: "Got user details Successfully",
                data   : user
            });
    });
};


exports.Dao_view = function (req,callback) 

{
    User.find({phoneNumber:req.params.phoneNumber}, function (err,user) 
    {
        if(err)
             callback.send(err)

             callback.json({
            message : "User Signup Details",
            data    : user
        }); 
    });    

    }

exports.Dao_update = function (req,callback) 
{
    User.find({phoneNumber:req.params.phoneNumber}, function (err,user)
    {
       
        if (err)
        callback.send(err);
        user.userName = req.body.userName,
        user.phoneNumber   = req.body.phoneNumber,
        user.otp = req.body.otp;

        user.save(function (err) {
            if (err)
            callback.json(err)
            callback.json({
                message : "*** User details updated successfully ***",
                data    : user
            });
        });
    });
};

exports.Dao_Delete = function (req,callback)
{
    User.deleteOne({phoneNumber:req.params.phoneNumber}, function (err,user)
    {
        if (err)
        callback.send(err)
        callback.json({
            status : "Success",
            message: "*** User Deleted Successfully ***",
            data   : user
        });
    });
};
