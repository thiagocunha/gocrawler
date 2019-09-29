
var rp = require('request');

let formData = {nodePath: "/content/go/coca-cola/AZ/az/bilirsinizmi/jcr:content/pageContent/contentwall_2013369960"
};
options = {
    uri: "https://www.honest-bio.es/bin/goservices/contentWallServlet",
    method: "POST",/*
    headers : [
        {
            //name: "Content-Type", value: "application/x-www-form-urlencoded"
           //name: "Content-Length", value: "nodePath=%2Fcontent%2Fgo%2Fcoca-cola%2FAZ%2Faz%2Fbilirsinizmi%2Fjcr%3Acontent%2FpageContent%2Fcontentwall_2013369960".length
        
        }
    ],*/
    
/*json: formData
    json: {
        nodePath: "/content/go/coca-cola/AZ/az/bilirsinizmi/jcr:content/pageContent/contentwall_2013369960"
    }
*/    /*
    postData:{
        params: [
          {
            name: 'nodePath',
            value: "/content/go/coca-cola/AZ/az/bilirsinizmi/jcr:content/pageContent/contentwall_2013369960" //'/content/go/coca-cola/AZ/az/bilirsinizmi/jcr:content/pageContent/contentwall_2013369960'
          },
          {
            name: 'actualAmountOfRSSItems',
            value: []
          },
          {
            name: 'sortField',
            value: '@cq:lastModified'
          },
          {
            name: 'sortOrder',
            value: 'desc'
          }
        ]
      }*/
      form: ""nodePath=/content/go/honest-tea/ES/es/home/jcr:content/pageContent/contentwall,/content/go/honest-tea/ES/es/home/jcr:content/pageContent/contentwall""
    //body: "nodePath=%2Fcontent%2Fgo%2Fcoca-cola%2FAZ%2Faz%2Fbilirsinizmi%2Fjcr%3Acontent%2FpageContent%2Fcontentwall_2013369960"
};

rp(options, function(a, b, c){
    console.log(b.body);
});

