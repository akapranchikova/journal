'use strict';

const logger = require('utils/logger').app,
    config = require('utils/config').get('express'),
    middlewares = require('utils/middlewares'),
    express = require('express'),
    i18n = require('i18n'),
    cookieParser = require('cookie-parser'),
    expressWinston = require('express-winston'),
    bodyParser = require('body-parser'),
    path = require('path'),
    sequelize = require('utils/sequelize'),
    models = require("models");


require('body-parser-xml')(bodyParser);

module.exports = async app => {
    logger.info('Setup Express middlewares', config);

    // Disable x-powered-by header
    app.disable('x-powered-by');

    // Common middlewares
    app.use(expressWinston.logger({
        winstonInstance: logger,
        meta: false,
        msg: '{{req.method}} {{req.url}} {{res.statusCode}} - {{res.responseTime}} ms'
    }));
    app.use(bodyParser.json({limit: config.limit}));
    app.use(bodyParser.xml({limit: config.limit}));
    app.use(bodyParser.urlencoded({extended: false, limit: config.limit}));

    i18n.configure({
        locales: ['en', 'ru'],
        directory: path.join(__dirname, '../locales')
    });

    app.use(i18n.init);
    app.use(cookieParser());

    // CORS support
    if (config.allowAllOrigins) {
        app.use(middlewares.cors);
    }

    // Static resources handling
    if (config.serveStatic) {
        app.use(config.staticUrl, express.static(path.join(__dirname, '..', '..', config.staticPath)));
    }

    // Routes, will be setup on next phase
    app.route = express.Router();
    app.use(app.route);

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    app.post('/loadmarks', function (req, res) {
        models.Mark.findAll({     }).then(tasks => {
            res.json(tasks);
        });
    });

    app.get('/students', function (req, res) {
        models.Lesson.findAll({include: [models.User, models.Class]}).then(function (subj) {
            res.json(subj);
        });
    });

    app.get('/subjects', function (req, res) {

        // models.Subject.findAll({}).then(function (subj) {
        //     res.json(subj);
        // });
    });

    // handle case when route not found by throwing NotFoundError
    app.use(middlewares.notFoundHandler);

    // Error handlers
    app.use(middlewares.errorHandler);

    logger.info('Setup Express middlewares -> done');
};