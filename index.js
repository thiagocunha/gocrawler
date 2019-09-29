var Crawler = require("crawler");
var rp = require('request');
var cheerio = require('cheerio'); // Basically jQuery for node.js

var listaNormal = [];
var listaEstendida = [];
var listaExecutados = [];
var listaErrosGerais = [];
var listaErro = [];
var cache = {};

function normalizaUrl(url){
    return url.replace(/[\\\/\*\.\?\:\<\>\|\'\"]/ig, "");
}
function cachedRequest(options, callback){
    let chave = normalizaUrl(options.uri);
    if (listaErrosGerais.includes(chave))
    {
        callback();
    }
    else{
        const path = require('path');
        const fs = require('fs');
        let arqCache = path.join(__dirname, "cache", chave);
        
        if (fs.existsSync(arqCache) && fs.statSync(arqCache).size>0){
            let response = JSON.parse(fs.readFileSync(arqCache));
            callback({}, response, response.body);
        }
        else{
            rp(options, function(a, response, body){
                if (response && parseInt(response.statusCode) == 200)
                {
                    fs.writeFile(arqCache, JSON.stringify(response), function(){
                        console.info(arqCache+" criado");
                    });     
                    callback(a, response, body);               
                }
                else{
                    listaErrosGerais.push(chave);
                    callback();
                }
            });
        }
    }
}

function execRequests(r, fulldomain, body, listaNormal, listaErro, callback){
    if ((result = r.exec(body)) !== null) {
        let item = decodeURIComponent(result[1]);
        let itemLower = item.toLowerCase().replace(/\/$/, "");
        //console.log(item);
        if (item.startsWith("/")){
            item = fulldomain + item;
        }
        if (item.startsWith("http") && !listaExecutados.includes(itemLower)&& !listaNormal.includes(item)&& !listaErro.includes(item)){
            listaExecutados.push(itemLower);

            //listaNormal.push(item);
            //console.log(item);
            setTimeout( function() {
                recReq(item, listaNormal, listaErro, function(listaNormal, listaErro){
                    execRequests(r, fulldomain, body, listaNormal, listaErro, callback);
                });            
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
        /*transform: function (body) {
            return cheerio.load(body);
        }*/
    };
    
    cachedRequest(options, function (a, response, body){
        console.log("Url: "+url);
        //console.log(".");
        //console.log(response.request.uri.href);
        let urlFinal = url;
        if (response && response.request && response.request.uri && response.request.uri.href)
            urlFinal = response.request.uri.href;

        let match = /(?:\/\/(?:www.)?(.*?)(?:\/|"|')|\/\/(?:www.)?(.*?)$)/.exec(url);
        let matchFull = /(?:(http.?:\/\/(?:www.)?.*?)(?:\/|"|')|(http.?:\/\/(?:www.)?.*?$))/.exec(url);
        let domain = "nothing";
        let fulldomain = "nothing";
        if (match[1]){
            domain = match[1]; 
            fulldomain = matchFull[1];
        }
        else{
            domain = match[2];
            fulldomain = matchFull[2];
        }
        
        //console.log(response.statusCode);
        if (!response || parseInt(response.statusCode) !== 200 || !response.headers["content-type"].includes("text") || urlFinal.includes("linkedin.com")  || urlFinal.includes("sharer.php") || urlFinal.includes("twitter.com") || urlFinal.includes("facebook.com") || urlFinal.includes("loja.cocacolabrasil")|| urlFinal.includes("merakettim.coca-colaturkiye.com"))
        {
            //console.log("erro: "+ response.statusCode);
            if (!listaErro.includes(urlFinal)){
                listaErro.push(urlFinal);        
                let tempStatus = "";
                if (response)
                    tempStatus = response.statusCode;
                listaEstendida.push({original: url, final: urlFinal, dominio: domain, dominioCompleto: fulldomain, statusCode: tempStatus, sucesso: true});
            }

            if (cb)
                cb(listaNormal, listaErro, urlFinal);
    
        }
        else{

            if (!listaNormal.includes(urlFinal)){
                
                

                
                
                if (urlFinal.includes(domain)){
                    listaNormal.push(urlFinal);
                    listaEstendida.push({original: url, final: urlFinal, dominio: domain, dominioCompleto: fulldomain, statusCode: response.statusCode, sucesso: true});
                    let r = new RegExp("(?:\"|')((?:http.{3,4}(?:"+domain+")|\\/)(?:[^.'\",\\s<>])*?(?:.html|\/|(?:[^.'\",\\s<>]{4,})))(?:\"|')", "gm");
        
                    execRequests(r, fulldomain, body, listaNormal, listaErro, function(listaNormal, listaErro){
                        console.log("URL checked");
                        if (cb)
                            cb(listaNormal, listaErro, url);
                    });
                }
                else{
                    if (cb)
                        cb(listaNormal, listaErro, url);
                }
            }
            else{
                if (cb)
                        cb(listaNormal, listaErro, url);
            }
        }
        
    });
}

//(?:"|')((?:http.*?(?:coca-cola.co.uk)|\/)(?:[^.'",\s<>])*?(?:.html|\/|(?:[^.'",\s<>]{4,})))(?:"|')
//et domain = "cocacola.co.uk";
//console.log(decodeURIComponent("http%3A%2F%2Fwww"))

//http://www.fantalatinamerica.com/es/home/
//https://www.cocacola.co.uk/en/home/
//https://www.coca-cola.co.th/th/home/

var allSites = ["www.aguamineralcrystal.com.br/pt/home/",
"www.fuze-tea.com",
"www.coca-cola.com/global",
"www.sprite.ae/en/home/",
"www.coca-cola.sa/en/home",
"ke.minutemaid.com/en/home/",
"www.spritesa.co.za/en/home/",
"tz.minutemaid.com/en/home/",
"www.minutemaid.co.ug/en/home/",
"www.minutemaid.co.zw/en/home/",
"bw.coca-cola.com/en/home/",
"mw.coca-cola.com/en/home/",
"na.coca-cola.com/en/home/",
"zm.coca-cola.com/en/home/",
"zw.coca-cola.com/en/home/",
"www.kist.com.pa/es/home",
"www.hit.com.ve/es/home/",
"www.coca-cola.am/hy/home/",
"www.fuzetea.co.za/en/home/",
"www.coca-cola.ge",
"www.coca-cola.uz/uz/",
"www.coca-cola.uz/ru/",
"www.fanta.ma/fr/home",
"www.chinotto.com.ve/es/home",
"www.fanta.lat/es/ec/home/",
"www.fanta.lat/es/cr/home/",
"www.fanta.lat/es/do/home/",
"www.fanta.lat/es/sv/home/",
"www.fanta.lat/es/gt/home/",
"www.fanta.lat/es/ni/home",
"www.fanta.lat/es/hn/home/",
"www.fanta.lat/en/bz/home/",
"www.fanta.lat/en/tt/home/",
"www.fanta.lat/en/bs/home/",
"www.fanta.lat/es/home/",
"www.fanta.lat/en/home/",
"www.sprite.lat/es/co/home",
"www.sprite.lat/es/cr/home",
"www.sprite.lat/es/do/home",
"www.sprite.lat/es/ec/home",
"www.sprite.lat/es/sv/home",
"www.sprite.lat/es/gt/home",
"www.sprite.lat/es/hn/home",
"www.sprite.lat/es/ni/home",
"www.sprite.lat/es/pa/home",
"www.sprite.lat/es/home",
"www.coke.com.tw/zh/home/",
"www.coca-cola.com.tr/tr/home/",
"www.appletiser.com/za/en/home/",
"www.appletiser.com/es/es/home",
"www.honest-bio.es",
"www.drinkhonest.fr/fr/home",
"www.appletiser.com/pt/pt/home",
"www.fanta.com.tr/tr/home/",
"www.drinkhonest.nl",
"www.fanta.co.za/en/home/",
"www.coca-cola.com.bd/bn/home/",
"lk.coca-cola.com/en/home/",
"www.powerade.co.za/en/home/",
"www.quatro.com.co/es/home/",
"www.glaceau.co.za/en/home/",
"www.fusetea.com.tr/tr/home/",
"www.sprite.com.tr",
"www.appletiser.com/en/home",
"www.minutemaid.co.id/id/home/",
"www.cappy.com.tr/tr/home/",
"www.coca-cola.co.id/id/home/",
"mv.coca-cola.com/en/home/",
"www.coca-cola.com.gh/en/home/",
"www.coca-cola.mu/en/home/",
"www.coke.eg/en/home/",
"www.coke.eg/ar/",
"tunisia.coca-cola.com/fr/home",
"www.coca-cola.dz/fr/home",
"www.coca-cola.dz/ar",
"www.fanta.eg/ar/home",
"www.fanta.ae/en/home/",
"www.fanta.ae/ar/",
"www.fanta.dz/ar/",
"www.fanta.eg/en/home/",
"www.sprite.dz/ar/",
"www.sprite.dz/fr/home/",
"www.sprite.eg/en/home",
"www.sprite.eg/ar/home",
"tunisia.coca-cola.com/ar/home/",
"www.cocacolalatinamerica.com/es/ar/home",
"www.cocacolalatinamerica.com/es/pe/home",
"www.cocacolalatinamerica.com/es/cl/home",
"www.cocacolalatinamerica.com/es/bo/home",
"www.fantalatinamerica.com/es/ar/home",
"www.cocacolalatinamerica.com/es/uy/home",
"www.cocacolalatinamerica.com/es/py/home",
"www.fantalatinamerica.com/es/cl/home",
"www.fantalatinamerica.com/es/bo/home",
"www.fantalatinamerica.com/es/uy/home",
"www.spritelatinamerica.com/es/ar/home",
"www.fantalatinamerica.com/es/pe/home",
"www.spritelatinamerica.com/es/cl/home",
"www.fantalatinamerica.com/es/py/home",
"www.spritelatinamerica.com/es/uy/home",
"www.spritelatinamerica.com/es/py/home",
"www.spritelatinamerica.com/es/pe/home",
"www.spritelatinamerica.com/es/bo/home",
"www.cocacolalatinamerica.com/es/home",
"www.fantalatinamerica.com/es/home",
"www.spritelatinamerica.com/es/home",
"www.coca-cola.lt/lt/home",
"www.schweppesmix.com/en/home/",
"www.bankia.bg/bg/home/",
"www.coca-cola.ma/fr/home/",
"www.coca-cola.com.pk",
"www.coca-cola.lt/fanta/lt/home/",
"www.coca-cola.md/ro/home/",
"www.coca-cola.lt/sprite/lt/home/",
"www.schweppes.bg/bg/home/",
"www.coca-cola.al/al/home",
"www.coca-cola.al/sprite/al/home/",
"www.coca-cola.al/fanta/al/home/",
"www.coca-cola.lt/fuzetea/lt/home/",
"www.coca-cola.lv/lv/home",
"www.coca-cola.lv/fanta/lv/home/",
"www.cappy.bg/bg/home/",
"www.coca-cola.hr/cappy/hr/home/",
"www.coca-cola.ua/ua/home",
"www.coca-cola.hr/fanta/hr/home/",
"www.coca-cola.com.cy/el/home",
"www.coca-cola.lv/sprite/lv/home/",
"www.coca-cola.ua/sprite/ru/home/",
"www.coca-cola.ua/fanta/ua/home/",
"www.coca-cola.com.cy/fanta/el/home/",
"www.fantapr.com/es/home/",
"www.coca-cola.hr/schweppes/hr/home/",
"www.bonaqua.ru/ru/home/",
"www.coca-cola.hr/hr/home",
"www.fuze-tea.ru",
"www.glaceausmartwater.ru/ru/home",
"www.coca-cola.hr/adez",
"www.coca-cola.lv/fuzetea/lv/home/",
"www.coca-cola.hr/smartwater/hr/home",
"www.coca-cola.hr/fuzetea/hr/home/",
"www.coke.ch/fr/home",
"www.drinkhonest.co.uk",
"www.coca-cola.co.th/th/home/",
"www.coke.ch/powerade/fr/home/",
"www.coke.hu/cappy/hu/home/",
"www.coke.hu/naturaqua/hu/home/",
"www.coke.hu/hu/home",
"www.coke.hu/kinley/hu/home/",
"www.coca-cola.me/sr/home",
"www.coke.hu/fuzetea/hu/home/",
"www.coke.ch/fanta/fr/home/",
"www.fanta.ru/ru/home",
"www.fanta.bg/bg/home/",
"www.coke.hu/fanta/hu/home/",
"www.fuzetea.bg",
"www.coke.ch/adez",
"www.coke.ch/sprite/fr/home/",
"www.coca-cola.az/az/home/",
"www.coke.ch/de/home",
"www.coca-cola.ee/et/home",
"www.damlasu.com.tr/tr/home/",
"www.coca-cola.com.ph/en/home/",
"www.coke.ch/powerade/de/home/",
"www.coca-cola.ee/fanta/et/home/",
"www.coca-cola.ee/sprite/et/home/",
"www.coke.ch/sprite/de/home/",
"www.fanta.co.id/id/home/",
"www.coke.ch/fanta/de/home/",
"www.coca-cola.ee/fuzetea/et/home/",
"www.coke.ch/adez",
"www.coca-cola.eu",
"www.coca-cola.cz/cs/home",
"www.coca-cola.cz/cappy/cs/home/",
"www.honestitalia.it/it/home",
"www.drinkhonest.be/nl/home",
"www.drinkhonest.be/fr/home",
"www.wilkinswater.com/en/home",
"www.coca-cola.si/sl/home",
"www.fanta-kos.com",
"www.powerade.ru/ru/home/",
"www.coca-cola.kz/ru/home/",
"www.coca-cola.kz/kk/home/",
"www.sprite.ru/ru/home",
"www.coca-cola.cz/fanta/cs/home/",
"www.coca-cola.cz/fuzetea/cs/home/",
"www.coca-cola.si/fuzetea/sl/home/",
"www.coca-cola.cz/bonaqua/cs/home/",
"www.cocacola.es/es/home/",
"www.cocacola.pt/pt/inicio/",
"www.cocacola.es/fanta/es/home/",
"www.cocacola.es/aquarius/es/home/",
"www.cocacola.es/royalbliss/es/home/",
"www.cocacola.pt/fanta/pt/home/",
"www.cocacola.es/minutemaid/es/home/",
"www.cocacola.es/nordicmist/es/home/",
"www.cocacola.se/sv/home/",
"www.cocacola.fi/fi/home",
"www.cocacola.es/nestea/es/home/",
"www.cocacola.es/powerade/es/home/",
"www.cocacola.es/sprite/es/home/",
"www.cocacola.se/powerade/sv/home/",
"www.cocacola.is/is/home/",
"es.ades.com",
"www.cocacola.pt/powerade/pt/home/",
"www.cocacola.pt/nestea/pt/home/",
"www.cocacola.pt/aquarius/pt/home/",
"www.cocacola.se/fanta/sv/home/",
"www.cocacola.pt/sprite/pt/home/",
"https://www.cocacola.es/energy/es/home",
"www.cocacola.se/energy/sv/home/",
"www.cocacola.is/energy/is/home/ ",
"www.cocacola.nl/nl/home/",
"www.cocacola.co.uk/en/home/",
"www.cocacola.dk/da/home/",
"www.cocacola.de/de/home",
"www.cocacola.de/vio/de/home/",
"www.cocacola.ie/en/home/",
"www.cocacola.be/minutemaid/nl/home/",
"www.cocacola.be/minutemaid/fr/home/",
"www.cocacola.be/fr/home",
"www.cocacola.ie/signaturemixers/en/home/",
"www.cocacola.be/nl/home",
"www.cocacola.co.uk/fanta/en/home/",
"www.cocacola.dk/ramlosa/da/home/",
"www.cocacola.de/fanta/de/home/",
"www.coca-cola.rs/sr/home",
"www.cocacola.ie/fanta/en/home/",
"www.cocacola.de/powerade/de/home/",
"www.cocacola.be/fanta/fr/home/",
"www.cocacola.de/sprite/de/home/",
"www.cocacola.be/chaqwa/nl/home/",
"www.cocacola.be/chaqwa/fr/home/",
"www.cocacola.de/mezzomix/de/home/",
"www.cocacola.de/lift/de/home/",
"www.cocacola.be/fanta/nl/home/",
"www.cocacola.nl/fanta/nl/home/",
"www.cocacola.nl/finley/nl/home/",
"www.cocacola.nl/royalbliss/nl/home",
"www.cocacola.nl/signaturemixers/nl/home/",
"www.cocacola.co.uk/signaturemixers/en/home/",
"www.cocacola.be/signaturemixers/fr/home/",
"www.cocacola.be/signaturemixers/nl/home/",
"www.coca-cola.rs/schweppes/sr/home/",
"www.cocacola.nl/sprite/nl/home/",
"www.coca-cola.rs/sprite/sr/home/",
"www.cocacola.be/chaudfontaine/nl/home/",
"www.cocacola.be/chaudfontaine/fr/home/",
"www.coca-cola.rs/fanta/sr/home/",
"www.cocacola.nl/chaudfontaine/nl/home/",
"www.cocacola.nl/fuzetea/nl/home",
"www.cocacola.de/aquarius/de/home/",
"www.coca-cola.rs/fuzetea/sr/home/",
"www.cocacola.co.uk/energy/en/home/ ",
"www.cocacola.ie/energy/en/home",
"www.cocacola.nl/energy/nl/home",
"www.cocacola.be/energy/nl/home",
"www.cocacola.be/energy/fr/home",
"www.cocacola.be/cocacolalight/nl/home/",
"www.cocacola.be/cocacolalight/fr/home/",
"www.coca-cola.it/it/home/",
"www.cocacola.fr/fr/home/",
"www.coca-cola.ro/dorna/ro/home/",
"www.cocacola.no/no/home/",
"www.coca-cola.ro/ro/home",
"www.cocacola.fr/powerade/fr/home/",
"www.coca-cola.it/powerade/it/home/",
"www.cocacola.fr/minutemaid/fr/home/",
"www.cocacola.no/fanta/no/home/",
"www.coca-cola.sk/sk/home",
"www.cocacola.fr/fanta/fr/home/",
"www.coca-cola.ro/cappy/ro/home/",
"www.cocacola.fr/finley/fr/home/",
"www.coca-cola.ro/sprite/ro/home/",
"www.coca-cola.it/lilia/it/home/",
"www.coca-cola.ba/cappy/bs/home/",
"www.coca-cola.sk/cappy/sk/home/",
"www.coca-cola.it/sprite/it/home/",
"www.coca-cola.ba/emotion/bs/home",
"www.coca-cola.ba/schweppes/bs/home/",
"www.coca-cola.ro/fanta/ro/home/",
"www.coca-cola.it/fanta/it/home",
"www.cocacola.fr/sprite/fr/home/",
"www.coca-cola.it/kinley/it/home/",
"www.coca-cola.ba/bs/home",
"www.coca-cola.ba/fanta/bs/home/",
"www.coca-cola.ro/fuzetea/ro/home/",
"www.coca-cola.sk/fanta/sk/home/",
"www.coca-cola.ro/smartwater/ro/home/",
"www.coca-cola.ro/adez/ro/home/",
"www.cocacola.no/energy/no/home",
"www.coca-cola.ba/fuzetea/bs/home/",
"www.coca-cola.sk/fuzetea/sk/home/",
"www.coca-cola.sk/bonaqua/sk/home/",
"www.cocacola.com.br/pt/home",
"www.coca-cola.com.co/es/co/home",
"www.coca-cola.com.co/es/ec/home/",
"www.honestekologisk.se",
"www.coca-cola.com.co/es/cr/home/",
"www.coca-cola.com.co/es/pa/home/",
"www.coca-cola.com.co/en/bz/home",
"www.coca-cola.com.co/en/bs/home/",
"www.coca-cola.com.co/en/cx/home/",
"www.coca-cola.com.co/es/do/home/",
"www.coca-cola.com.co/es/hn/home/",
"www.coca-cola.com.co/en/tt/home/",
"www.coca-cola.com.co/es/ve/home/",
"www.coca-cola.com.co/es/ni/home/",
"www.coca-cola.com.co/es/sv/home/",
"www.coca-cola.com.co/es/gt/home/",
"www.coca-cola.com.co/es/home",
"www.coca-cola.com.co/en/home",
"www.cokestudio.co.za",
"www.coca-cola.pl/kropla/pl/home/",
"www.coke.at/de/home",
"www.coca-cola.pl/cappy/pl/home/",
"www.coca-cola.com.au/en/home",
"www.drinkhonest.de",
"www.coca-cola.pl/pl/home",
"www.coke.at/cappy/de/home/",
"www.chaywa.co.za/en/home",
"www.drinkhonest.no/no/home",
"www.coca-cola.pl/sprite/pl/home/",
"www.coca-cola.pl/kinley/pl/home/",
"www.coca-cola.pl/adez",
"www.coke.at/fanta/de/home",
"www.coca-cola.pl/fanta/pl/home/",
"www.coke.at/adez/de/home",
"www.cappy.com.pk",
"www.coca-cola.pl/fuzetea",
"www.coke.at/sprite/de/home/",
"coke.at/kinley/de/home/",
"www.coca-cola.co.mz/pt/home/",
"www.coca-cola.co.ug/en/home/",
"www.coca-cola.co.ke/en/home/",
"www.coca-cola.com.ng/en/home",
"www.coke.co.za",
"www.coca-cola.co.tz/ss/home/",
"et.coca-cola.com/en/home/",
"www.cocacola-kos.com/al/home",
"www.cocacola-kos.com/sr/home",
"www.coca-cola.it/smartwater"]

//allSites = ["www.fuze-tea.com"];
//allSites.forEach(
    
function processaSite(allSites, indice){

    const path = require('path');
    const fs = require('fs');
    
    listaErro = [];
    listaNormal = [];
    listaEstendida = [];
    listaExecutados = [];

    let site = allSites[indice];
    let arqSite = path.join(__dirname, "urls_"+indice+".csv");

    if (!fs.existsSync(arqSite)){
        console.log("STARTING " + site);
        if (!site.includes("http")){
            site = "http://"+site;
        }
        recReq(site, listaNormal, listaErro, function (l1, l2, url){
            var stream = fs.createWriteStream(arqSite);
            stream.once('open', function(fd) {
            
                
                console.log("finalizando");
                //l1.sort();
                //l2.sort();

                listaEstendida.forEach(function(item){
                    stream.write("'"+ item.final + "', '" + item.original +"', '"+item.dominio+"', '"+item.dominioCompleto+"', '"+item.final.replace(item.dominioCompleto, "")+"', '"+item.statusCode+"', '"+item.sucesso+"'\n");
                    //console.log(item);
                });
                console.log("");

                stream.end();

                if (indice<allSites.length-1)
                    processaSite(allSites, indice+1);
            });
        });
    }
    else if (indice<allSites.length-1){
        console.log("SKIPPING " + site);
        processaSite(allSites, indice+1);
    }
}

processaSite(allSites, 0);