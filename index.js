var Crawler = require("crawler");
var rp = require('request');
var cheerio = require('cheerio'); // Basically jQuery for node.js

var listaNormal = [];
var listaErro = [];

function execRequests(r, fulldomain, body, listaNormal, listaErro, callback){
    if ((result = r.exec(body)) !== null) {
        let item = decodeURIComponent(result[1]);
        //console.log(item);
        if (item.startsWith("/")){
            item = fulldomain + item;
        }
        if (item.startsWith("http") && !listaNormal.includes(item)&& !listaErro.includes(item)){
            listaNormal.push(item);
            //console.log(item);
            recReq(item, listaNormal, listaErro, function(listaNormal, listaErro){
                execRequests(r, fulldomain, body, listaNormal, listaErro, callback);
            });            
        }
        else{
            execRequests(r, fulldomain, body, listaNormal, listaErro, callback);
        }        
        
    }
    else{
        callback(listaNormal, listaErro);
    }
}

function recReq(url, listaNormal, listaErro, cb){
    var options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    
    rp(options, function (a, response, body){
        //console.log("Url: "+url);
        //console.log(".");
        //console.log(response);

        //console.log(response.statusCode);
        if (parseInt(response.statusCode) !== 200)
        {
            //console.log("erro: "+ response.statusCode);
            listaErro.push(url);
            listaNormal.pop();
        }
        let domain = /\/\/(?:www.)?(.*?)(?:\/|"|')/.exec(url)[1];
        let fulldomain = /(http.?:\/\/(?:www.)?.*?)(?:\/|"|')/.exec(url)[1];
        
        let r = new RegExp("(?:\"|')((?:http.*?(?:"+domain+")|\\/)(?:[^.'\",\\s<>])*?(?:.html|\/|(?:[^.'\",\\s<>]{4,})))(?:\"|')", "gm");

        execRequests(r, fulldomain, body, listaNormal, listaErro, function(listaNormal, listaErro){
            if (cb)
                cb(listaNormal, listaErro);
        });
        
    });
}

//(?:"|')((?:http.*?(?:coca-cola.co.uk)|\/)(?:[^.'",\s<>])*?(?:.html|\/|(?:[^.'",\s<>]{4,})))(?:"|')
//et domain = "cocacola.co.uk";
//console.log(decodeURIComponent("http%3A%2F%2Fwww"))
recReq('http://www.fantalatinamerica.com/es/home/', listaNormal, listaErro, function (l1, l2){
    console.log("finalizando");
    l1.sort();
    l2.sort();

    l1.forEach(function(item){
        console.log(item);
    });
    console.log("");
    l2.forEach(function(item){
        console.log(item);
    });
});

//http://www.fantalatinamerica.com/es/home/
//https://www.cocacola.co.uk/en/home/
//https://www.coca-cola.co.th/th/home/