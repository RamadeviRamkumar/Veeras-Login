//const { Dao_view } = require('../Dao/Dao.js');

Dao = require('../Dao/Dao.js');

exports.Service_index = function(err,callback)
{
    Dao.Dao_index(err,callback);
    if (err) return console.error(err);
    callback(user);
}

exports.Service_add = function(err,callback)
{
    Dao.Dao_add(err,callback);
    if (err) return console.error(err);
    callback(user);
}

exports.Service_view = function (err, callback)
{
    Dao.Dao_view(err,callback);
    if (err) return console.error(err);
    callback(user);
}

exports.Service_update = function(err,callback)
{
    Dao.Dao_update(err,callback);
    if (err) return console.error(err);
    callback(user);
}

exports.Service_Delete = function(err,callback)
{
    Dao.Dao_Delete(err,callback);
    if (err) return console.error(err);
    callback(user);
}