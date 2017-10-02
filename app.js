const
  express = require('express'),
  fs = require('fs'),
  cheerio = require('cheerio'),
  request = require('request'),
  app = express(),
  port = '8090';

app.get('/scrape/:page', (req, res) => {
  //Scrape site for color list
  
  //Method to construct request URL
  const targetPageURL = `http://paintref.com/cgi-bin/colorcodedisplay.cgi?manuf=Military&con=m&page=${req.params.page}&rows=200`;
  
  request(targetPageURL, function(error, response, html){
    
    // Make sure there's no errors on the request
    
    if(!error){
      // Parse returned html with Cheerio
      
      const $ = cheerio.load(html);
      
      // Define the capture variables
      
      let
        colorCollection = [];
      
      // Traverse to color table
      
      $("center > table:nth-child(5) > tbody > tr:not('.head')").each( function() {
        
        let
          color = {name : "", hexValue : ""};
        if( req.params.page > 1 ) {
          color.name = $(this).find('td:nth-child(5) a').text();
        } else {
          color.name = $(this).find('td:nth-child(6) a').text();
        }
        
        if($(this).find('td:nth-child(8)').attr('bgcolor') === undefined) {
          color.hexValue = `#${$(this).find('td:nth-child(9)').attr('bgcolor')}`;
        } else {
          color.hexValue = `#${$(this).find('td:nth-child(8)').attr('bgcolor')}`;
        }
  
        let found = colorCollection.some(function (el) {
          return el.name === color.name;
        });
        if(!found) colorCollection.push(color);
      });
      
      fs.readFile('paintRefMilitary_NoDup.json', 'utf8', function readFileCallback(err,data) {
        if(err) {
          console.log(err);
          json = JSON.stringify(colorCollection);
          fs.writeFile('paintRefMilitary_NoDup.json', json, 'utf8', () => console.log('Write complete'))
  
        } else {
          colors = JSON.parse(data);
  
          colorCollection.forEach(color => {
            let found = colors.some(function (el) {
              return el.name === color.name;
            });
            if (!found) colors.push(color);
          });
  
          json = JSON.stringify(colors);
          fs.writeFile('paintRefMilitary_NoDup.json', json, 'utf8', () => console.log('Write complete'))
        }
      });
  
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(colorCollection, null, 3));
    }
  })
});

app.listen(port);

console.log(`Scraping away on port ${port}`);

exports = module.exports = app;