var Crawler = require("crawler");
var rp = require('request');
var cheerio = require('cheerio'); // Basically jQuery for node.js

var listaNormal = [];
var listaErro = [];


function recReq(url, listaRef, listaErro, cb){
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

        console.log(response.statusCode);
        if (parseInt(response.statusCode) !== 200){
            listaErro.push(url);
            listaRef.pop();
        }
        let domain = /\/\/(?:www.)?(.*?)(?:\/|"|')/.exec(url)[1];
        let fulldomain = /(http.?:\/\/(?:www.)?.*?)(?:\/|"|')/.exec(url)[1];
        
        let r = new RegExp("(?:\"|')((?:http.*?(?:"+domain+")|\\/)(?:[^.'\",\\s<>])*?(?:.html|\/|(?:[^.'\",\\s<>]{4,})))(?:\"|')", "gm");

        while((result = r.exec(body)) !== null) {
            let item = decodeURIComponent(result[1]);
            //console.log(item);
            if (item.startsWith("/")){
                item = fulldomain + item;
            }
            if (item.startsWith("http") && !listaRef.includes(item)){
                listaRef.push(item);
                //console.log(item);
                recReq(item, listaRef, listaErro);
            }
        }
        if (cb)
            cb(listaRef, listaErro);
    });
}

//(?:"|')((?:http.*?(?:coca-cola.co.uk)|\/)(?:[^.'",\s<>])*?(?:.html|\/|(?:[^.'",\s<>]{4,})))(?:"|')
//et domain = "cocacola.co.uk";
//console.log(decodeURIComponent("http%3A%2F%2Fwww"))
recReq('http://www.fantalatinamerica.com/es/home/', listaNormal, listaErro, function (l1, l2){
    l1.sort(function(a, b){return a-b});
    l2.sort(function(a, b){return a-b});

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