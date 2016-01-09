var express = require('express');
var router = express.Router();

// database module
var database = require('../config/database');
var RunQuery = database.RunQuery;

router.route('/')
    .get(function (req, res, next) {
        req.session.delivery = {};
        if (req.isAuthenticated()) {
            if (req.session.cart){
                if (req.session.summary.totalQuantity > 0) {
                    res.redirect('checkout/delivery/')
                }
            }
            res.redirect('/cart');
        }
        else {
            // show sign-in form
            // if no
            // register form

            //select items in cart
            req.session.inCheckOut = true;
            res.redirect('/sign-in');
            var contextDict = {
                title: 'Checkout - Customer Information',
                navList: [{name: 'Sign in', link: '/sign-in'}, {name: 'Sign up', link: '/sign-up'}],
                signInError: ''
            };
            res.render('sign-in', contextDict);
        }
    });

router.route('/delivery')
    .get(function (req, res, next) {
        req.session.delivery = {};

        // show addresses
        var selectQuery = '\
            SELECT *\
            FROM Addresses\
            WHERE UserID = ' + req.user.UserID + ';';

        RunQuery(selectQuery, function (rows) {
            req.session.delivery = rows;
            console.log(req.session.delivery);

            var contextDict = {
                title: 'Checkout - Delivery Address',
                addresses: rows,
                customer: req.user
            };
            res.render('checkout/delivery', contextDict);
        });
        // if choose from exist address => redirect
        // if create new add
        // 1. Open form
        // 2. Save data
        // 3. Redirect
    });

router.route('/delivery/new')
    .post(function (req, res, next) {
        var fullName = req.body.fullName;
        var email = req.body.email;
        var address = req.body.streetAddress;
        var postcode = req.body.postcode;
        var city = req.body.city;
        var country = req.body.country;
        var phone = req.body.phone;

        // add address
        var insertQuery = '\
            INSERT INTO Addresses\
            VALUES(null, ' +
            req.user.UserID + ', \'' +
            fullName + '\', \'' +
            address + '\', \'' +
            postcode + '\', \'' +
            city + '\', \'' +
            country + '\', \'' +
            phone + '\', 0)';

        RunQuery(insertQuery, function (rows) {
            req.session.delivery = {
                AddressID: rows.insertId,
                FullName: fullName,
                Email: email,
                StreetAddress: address,
                PostCode: postcode,
                City: city,
                Country: country,
                Phone: phone
            };
            console.log(req.session.delivery);

            res.redirect('/checkout/review');
        });
    });

router.route('/delivery/:id')
    .post(function (req, res, next) {
        var selectQuery = '\
            SELECT *\
            FROM Addresses\
            WHERE AddressID = ' + req.params.id + ';';

        RunQuery(selectQuery, function (rows) {
            req.session.delivery = rows[0];
            console.log(req.session.delivery);
            res.redirect('/checkout/review');
        });
    });

router.route('/review')
    .get(function (req, res, next) {
        //show current cart
        //Order
        var contextDict = {
            title: 'Checkout - Review Order',
            cart: req.session.cart,
            summary: req.session.summary,
            delivery: req.session.delivery,
            customer: req.user
        };
        res.render('checkout/review', contextDict);
    });

router.route('/order')
    .get(function (req, res, next) {
        var insertQuery = '\
            INSERT INTO Orders\
            VALUES(null, ' +
            req.user.UserID + ', ' +
            req.session.delivery.AddressID + ', NOW());';

        RunQuery(insertQuery, function (rows) {
            console.log(req.session.cart);
            for (var item in req.session.cart) {
                console.log(item);
                if (req.session.cart[item].quantity > 0) {
                    insertQuery = '\
                    INSERT INTO `Order Details`\
                    VALUES(' +
                        rows.insertId + ', ' +
                        req.session.cart[item].ProductID + ', ' +
                        req.session.cart[item].quantity + ');';
                    RunQuery(insertQuery, function (res) {
                        console.log(res.insertId);
                    });
                }
            }

            var contextDict = {
                title: 'Checkout - Order #' + rows.insertId,
                cart: req.session.cart,
                summary: req.session.summary,
                delivery: req.session.delivery,
                customer: req.user
            };
            res.render('checkout/review', contextDict);
        });
    });

module.exports = router;