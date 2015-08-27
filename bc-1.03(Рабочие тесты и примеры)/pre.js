var fs = require('fs')
 , path = require('path');

var source = 'test/';

var filename = 'test.b';

var Module = {'preRun' : function() {

                      
          var sourcePath = FS.createPath('/', source, true, false);

           var files = fs.readdirSync(source); 

           var file = path.join(source, filename);
            
           var data = fs.readFileSync(file);
           FS.createDataFile(sourcePath, filename, data, true, false); 
          }
};
Module.arguments = ['test/test.b'];
Module.return = '';
