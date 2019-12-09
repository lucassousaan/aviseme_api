var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var objectId = require('mongodb').ObjectId;
var crypto = require('crypto');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
});

var port = 8080;

app.listen(port);

var db = new mongodb.Db(
    'avisemedb',
    new mongodb.Server('localhost', 27017, {}),
    {}
);

console.log("Servidor está online na porta " + port);

app.get('/', (req, res) => {
    res.send({ msg: 'Olá' });
});

//Cria um usuário
app.post('/avisemeapi/newUser', (req, res) => {
    var bodyReq = req.body;
    const encrypted_password = crypto.createHash("md5").update(bodyReq.password).digest("hex");
    bodyReq.password = encrypted_password;

    db.open((err, mongoclient) => {
        mongoclient.collection("users", (err, collection) => {
            collection.find({ username: bodyReq.username }).toArray((err, result) => {
                if (err) {
                    res.json(err);
                } else {
                    if (result.length > 0) {
                        res.status(409).json({
                            msg: "Nome de usuário já existe"
                        });
                        mongoclient.close();
                    } else {
                        collection.find({ email: bodyReq.email }).toArray((err, result) => {
                            if (err) {
                                res.json(err);
                            } else {
                                if (result.length > 0) {
                                    res.status(409).json({
                                        msg: "Email já está sendo utilizado"
                                    });
                                    mongoclient.close();
                                } else {
                                    collection.insert(bodyReq, (err, records) => {
                                        if (err) {
                                            res.json(err);
                                        } else {
                                            res.status(201).json(records);
                                        }
                                        mongoclient.close();
                                    });
                                }
                            }
                        });
                    }
                }
            });
        });
    });
});

//Autentica usuário
app.post('/avisemeapi/login', (req, res) => {
    var bodyReq = req.body;
    const encrypted_password = crypto.createHash("md5").update(bodyReq.password).digest("hex");
    bodyReq.password = encrypted_password;

    db.open((err, mongoclient) => {
        mongoclient.collection("users", (err, collection) => {
            collection.find(bodyReq).toArray((err, result) => {
                if (err) {
                    res.json(err);
                } else {
                    if (result.length > 0) {
                        res.status(200).send(result);
                    } else {
                        res.status(401).send({
                            msg: "Usuário ou senha incorretos"
                        });
                    }
                }
                mongoclient.close();
            });
        });
    });
})

//Cria nova ocorrência
app.post('/avisemeapi/ocurrence', (req, res) => {
    var bodyReq = req.body;
    var date = new Date();
    bodyReq.data_ocorrencia = date;
    db.open((err, mongoclient) => {
        mongoclient.collection("ocurrence", (err, collection) => {
            collection.insert(bodyReq, (err, records) => {
                if (err) {
                    res.json(err);
                } else {
                    res.status(201).json(records);
                }
                mongoclient.close();
            });
        });
    });
});

// busca todas ocorrências
app.get('/avisemeapi/ocurrence', (req, res) => {
    db.open((err, mongoclient) => {
		mongoclient.collection('ocurrence', (err, collection) => {
			collection.find().toArray(function(err, results){
				if(err){
					res.json(err);
				} else {
					res.json(results);
				}
				mongoclient.close();
			});
		});
	});
});

//Busca ocorrência específica, de acordo com o id
app.get('/avisemeapi/ocurrence/:id', (req, res) => {
	db.open((err, mongoclient) => {
		mongoclient.collection('ocurrence', (err, collection) => {
			collection.find(objectId(req.params.id)).toArray(function(err, results){
				if(err){
					res.json(err);
				} else {
					res.status(200).json(results);
				}
				mongoclient.close();
			});
		});
	});

});
