/////////////////////////////DATA BASE////////////////////////////////////////////
var Usergrid = require("usergrid");

var client = new Usergrid.client({
    orgName:'facka',
    appName:'photoGallery',
    authType: Usergrid.AUTH_CLIENT_ID,
    clientId:'b3U6vqDXqih6EeOyMN0HGsQPKQ',
    clientSecret:'b3U64Lj1JMpU1-eAymvZoEXrZos8038',
    logging: false, //optional - turn on logging, off by default
    buildCurl: false //optional - turn on curl commands, off by default
});

var Cache = require("./js/Cache");

var photoCache = new Cache();

var DB = {
	savePhoto : function(photo, success, error) {
		photo['type'] = 'photos';
		client.createEntity(photo, function (err, data) {
	    if (err) {
	    	error("Photo ya existente.");
	    } 
	    else {
	    	var newPhoto = data._data;
	    	photoCache.update(newPhoto.id,newPhoto);
	    	success(newPhoto);
	    }
		});
	},
	getPhoto : function(id, success, error) {
		var cache = photoCache.get(id);
		if (cache) {
			console.log("Returning photo from cache...");
			success(cache)
		}
		else {
			console.log("Finding photo in database...");
			var options = {
			  	method:'GET',
	    		endpoint:'photos',
	    		qs: {ql:"select * where id='"+id+"'"}
			}
			client.request(options, function(err, data) {
			    if (err){
			        console.log("Error trying to find the photo.");
			        error("Error trying to find the photo.");
			    } else {
	 				var photo = data.entities[0];
	 				if (photo) {
	 					photoCache.update(photo.id,photo);
	 				}
			        success(photo);
			    }
			});
		}
	},
	getPhotos : function(success, error) {
		console.log("Finding photo in database...");
		var options = {
		  	method:'GET',
    		endpoint:'photos',
    		qs: {ql:"select *"}
		}
		client.request(options, function(err, data) {
		    if (err){
		        console.log("Error trying to get all photos.");
		        error("Error trying to get all photos.");
		    } else {
 				var photos = data.entities;
		        success(photos);
		    }
		});
	},
	updatePhoto : function(photo,success,error) {
		console.log("Updating photo in database...");
		
		var onPhotoExists = function(photoFound) {
			var options = {
				type:'photos',
    			uuid: photoFound.uuid,
    			getOnExist:true
			};
			client.createEntity(options, function (errorCreatingEntity, data) {
			    if (errorCreatingEntity) {
			        error("Error updating photo.");
			    } else {
			    	data.set(photo);
			        data.save(function(err){
			        	if (err) {
			        		error("Error updating photo");
			        	}
			        	else {
			        		photoCache.update(photo.id, photo);
			        		success(photo);
			        	}
			        });
				}
			});
		};
		var onPhotoNotFound = function() {
			erro("Photo not found!");
		};
		DB.getPhoto(photo.id, onPhotoExists,onPhotoNotFound);
	}
};

///////////////////////////////DATA BASE END//////////////////////////////////////////
var serverURL = "http://localhost:8000";



var express = require('express');
var app = express()
  , server = require('http').createServer(app)
  , fs = require('fs')
  , locale = require("locale")
  , supported = new locale.Locales(["es", "en_US"]);

var nodemailer = require("nodemailer");
var chance = require('chance').Chance();

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'facka', 
  api_key: '851471749915331', 
  api_secret: 'g9P8_CU5_vgqKzq1cVZ0Eydg620' 
});


var MP = require ("mercadopago");
var mp = new MP ("4621549209098711", "DvdnToFU3ticvDsP9vSuXL7f6heCWY7V");

mp.sandboxMode(true);

var ItemService = {
	crearItem: function(title, price, imageUrl, success, error) {
		var preference = {
		    "items": [
		        {
		            "title": title,
		            "quantity": 1,
		            "currency_id": "ARS",
		            "unit_price": price,
		            "picture_url": imageUrl
		        }
		    ]
		};
		mp.createPreference (preference, function (err, data){
		    if (err) {
		        error(err);
		    } else {
		        console.log(JSON.stringify(data,null,4));
		        success(data);
			}
		});		
	},
	updateItem: function(id,item, success, error) {
		var preference = {
	        "items": [
	            item
	        ]
	    };

		mp.updatePreference (id, preference, function (err, data){
	        if (err) {
	            error(err);
	        } else {
	            success(data);
	        }
	    });
	},
	getItem: function (id, success, error) {
		mp.getPreference (id, function (err, data){
        if (err) {
            error(err);
        } else {
            success(data);
        }
    });
	}
};

var Items = [
	{ id: 1,
	  title: "Patagonia2",
	  imageUrl: "http://res.cloudinary.com/facka/image/upload/v1400424791/lanin-sombrero_gqlhba.jpg",
	  itemMPID: "107497586-39404c85-65d6-4df1-8cc3-2a95639f8d7d",
	  price: 30
	}
];
/*
var onSuccess = function(data) {
	console.log(JSON.stringify(data,null,4));
};

var onError = function (error) {
	console.log(error);
};

ItemService.updateItem('107497586-39404c85-65d6-4df1-8cc3-2a95639f8d7d', {"title": "Lanin Sombrero","currency_id": "ARS",
		            "unit_price": 100,"quantity": 1,"picture_url": "http://res.cloudinary.com/facka/image/upload/v1400424791/lanin-sombrero_gqlhba.jpg"},onSuccess,onError);
*/
server.listen(8000);

app.use(express.json());
app.use(express.bodyParser());

app.use(locale(supported));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/admin', function (req, res) {
  res.sendfile(__dirname + '/admin.html');
});

app.get("/js/:which", function(req, res) {
	var file = __dirname + '/js/'+req.params.which;
    sendResponse(res,file);
});

app.get("/images/:which", function(req, res) {
	var file = __dirname + '/images/'+req.params.which;
    sendResponse(res,file);
});

app.get("/css/:which", function(req, res) {
	var file = __dirname + '/css/'+req.params.which;
    sendResponse(res,file);
});

var response404 = function(res) {
	res.sendfile(__dirname + '/404.html');
};

var response500 = function(res) {
	res.writeHead(500, { "Content-Type": "text/plain" });
	res.end("Error 500: Internal Server Error!");
};

var sendResponse = function(res, file){
	fs.exists(file,function(exists){
		if (exists) {
			res.sendfile(file);
		}
		else {
			response404(res);
		}
	});  
};

/////////////////////////////////////////////////////////////////////


///////////////////////////API UTILS//////////////////////////////////////////
var bodyHasRequiredProperties = function(body, properties){
	for (var i in properties) {
		var prop = properties[i];
		if(!body.hasOwnProperty(prop)) {
		    return false;
		} else {
			if (!body[prop]) {
				return false;
			}
		}
	}
	return true;
}
///////////////////////////API UTILS END//////////////////////////////////////////

app.post('/api/photos', function(req, res) {
	console.log("API: POST /photos");
	var requiredProperties = ["title","price","imageUrl"];
	if(!bodyHasRequiredProperties(req.body, requiredProperties)) {
	    res.statusCode = 400;
	    return res.json("Invalid request body");
	}
	
	var onSuccess = function(data) {
		var onSuccessSave = function(photoSaved) {
			console.log("Photo saved!");
			res.statusCode = 200;
			res.json(photoSaved);

		};
		var onErrorSave = function(error) {
			console.log(error);
			res.statusCode = 404;
			res.json(error);
		};

		var photo = {
			 "id": data.response.id,
  			"title": req.body.title,
  			"imageUrl": req.body.imageUrl,
  			"itemMPID": data.response.id,
  			"price": req.body.price
		};
		DB.savePhoto(photo, onSuccessSave,onErrorSave);
	};

	var onError = function(error) {
		console.log("Error creating item in MP: "+ error);
		res.statusCode = 404;
		res.json(error);
	};

	ItemService.crearItem(req.body.title, req.body.price, req.body.imageUrl, onSuccess, onError);
});


app.delete('/api/photos/:id', function(req, res) {
	console.log("API: DELETE");
	
	
		res.statusCode = 404;
		res.json(error);
	
});

app.get('/api/photos/:id', function (req, res) {
  var id = req.params.id;
  var onSuccess = function(photo) {
  	res.json(photo);
  };
  var onError = function(error) {
	res.statusCode = 404;
	res.json(error);
  };
  DB.getPhoto(id, onSuccess, onError);
});

app.put('/api/photos', function (req, res) {
  var onSuccess = function(photo) {
  	res.json(photo);
  };
  var onError = function(error) {
	res.statusCode = 404;
	res.json(error);
  };
  DB.updatePhoto(req.body, onSuccess, onError);


  var onSuccessMP = function(data) {
	console.log(JSON.stringify(data,null,4));
  };

  var onErrorMP = function (error) {
	console.log(error);
  };

  ItemService.updateItem(req.body.itemMPID, {"title": req.body.title,"currency_id": "ARS",
		            "unit_price": req.body.price,"quantity": 1,"picture_url": req.body.imageUrl},onSuccess,onError);  
});

app.get('/api/photos', function (req, res) {
  var id = req.params.id;
  var onSuccess = function(photos) {
  	res.json(photos);
  };
  var onError = function(error) {
	res.statusCode = 404;
	res.json(error);
  };
  DB.getPhotos(onSuccess, onError);
});

/////////////////////////////START EMAIL//////////////////////////////////////////////

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "email@gmail.com",
        pass: "password"
    }
});

// setup e-mail data with unicode symbols
var getWelcomeEmailOptions = function(user, language) {
	console.log("Enviando welcome email en"+ language);
	return {
	    from: "futbol5server@gmail.com", // sender address
	    to: "to@gmail.com", // list of receivers
	    subject: "Subject", // Subject line
	    text: "Hola", // plaintext body
	    html: '<p>Mensaje</p>'
	}
};


// send mail with defined transport object
var sendEmail = function (email, onSuccess, onError) {
	console.log("Sending email to "+ email.to);
	smtpTransport.sendMail(email, function(error, response) {
	    if(error) {
	        console.log(error);
	        if (onError)
	        	onError();
	    }else{
	        if (onSuccess)
	        	onSuccess();
	    }

	    // if you don't want to use this transport object anymore, uncomment following line
	    //smtpTransport.close(); // shut down the connection pool, no more messages
	});
};

/////////////////////////////END EMAIL//////////////////////////////////////////////

var schedule = require('node-schedule');

var job = schedule.scheduleJob({hour: 00, minute: 50, dayOfWeek: new schedule.Range(0, 6)}, function(){
    console.log('Job runned!');
});

console.log("Server Started at "+serverURL);