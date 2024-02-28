Service = require('../service/service.js')

exports.index = function(err,user)
{
    Service.Service_index(err,user);
    if (err) return console.error(err);
};

exports.add = function(err,user)
{
    Service.Service_add(err,user);
    if (err) return console.error(err);
}

exports.view = function(err,user)
{
    Service.Service_view(err,user);
    if (err) console.error(err);
}

exports.update = function(err,user)
{
    Service.Service_update(err,user);
    if (err) console.error(err);
}

exports.Delete = function(err,user)
{
    Service.Service_Delete(err,user);
    if (err) console.error(err);
}