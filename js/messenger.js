/*jslint
    for
*/
/*global
    window, document, fetch, MessengerExtensions, me,
    crealAppId, crealAppPrefix, crealApiBaseUrl, crealSiteBaseUrl,
    crealAppErrorFn, crealAppProfileRequestFn, crealAppMessagingRequestFn
*/

(function () {
    "use strict";

    function getQueryParameter(key) {
        var query = window.location.search.substr(1);
        var params = query.split('&');
        var i, idx;
        for (i = 0; i < params.length; i += 1) {
            idx = params[i].indexOf('=');
            if (idx >= 0) {
                if (key === decodeURIComponent(params[i].substr(0, idx))) {
                    return decodeURIComponent(params[i].substr(idx + 1));
                }
            }
        }
    }

    function showError(code, message) {
        if (typeof crealAppErrorFn === "function") {
            crealAppErrorFn(code, message);
        }
    }

    function showProfileRequest(callback) {
        if (typeof crealAppProfileRequestFn === "function") {
            crealAppProfileRequestFn(callback);
        } else {
            callback();
        }
    }

    function showMessagingRequest(callback) {
        if (typeof crealAppMessagingRequestFn === "function") {
            crealAppMessagingRequestFn(callback);
        } else {
            callback();
        }
    }

    function processLogin(context) {
        var signedContext = context.signed_request;
        fetch(crealApiBaseUrl + '/v1/messenger/login', {
            mode: 'cors',
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                signedContext: signedContext,
                shareToken: getQueryParameter('shareToken')
            })
        }).then(function (res) {
            // This could be improved for better errors
            if (!res.ok) {
                throw new Error('Error ' + res.status + ' on login');
            } else {
                return res.json();
            }
        }).then(function (res) {
            me.creal.frontend.core.init({
                authResponse: res.authResponse,
                userContext: res.userContext,
                apiBaseUrl: crealApiBaseUrl,
                baseUrl: crealSiteBaseUrl,
                prefix: crealAppPrefix
            });
        }).catch(function (error) {
            showError(null, error + ' - ' + JSON.stringify(error));
        });
    }

    var askedPermissions = [];
    function askPermission(name, callback) {
        askedPermissions(name);
        MessengerExtensions.askPermission(function (response) {
            callback(response.permissions);
        }, function (code, message) {
            showError(code, message);
        }, name);
    }

    function getPermissions(callback) {
        MessengerExtensions.getGrantedPermissions(function (response) {
            callback(response.permissions);
        }, function (code, message) {
            showError(code, message);
        });
    }

    function handleLogin() {
        // The Messenger Extensions JS SDK is done loading
        MessengerExtensions.getSupportedFeatures(function (result) {
            var features = result.supported_features;
            if (features.indexOf('context') >= 0) {
                MessengerExtensions.getContext(crealAppId, function (context) {
                    processLogin(context);
                }, function (code, message) {
                    showError(code, message);
                });
            } else {
                showError(null, 'Context feature is not supported');
            }
        }, function (code, message) {
            showError(code, message);
        });
    }

    window.extAsyncInit = function () {
        function permissionsCallback(permissions) {
            if (permissions.indexOf('user_profile') < 0) {
                if (askedPermissions.indexOf('user_profile') < 0) {
                    // On first time ask permission directly from user
                    askPermission('user_profile', permissionsCallback);
                } else {
                    // If permission was denied, ask more politely
                    showProfileRequest(function () {
                        askPermission('user_profile', permissionsCallback);
                    });
                }
            } else if (permissions.indexOf('user_messaging') < 0) {
                if (askedPermissions.indexOf('user_messaging') < 0) {
                    // On first time ask permission directly from user
                    askPermission('user_messaging', permissionsCallback);
                } else {
                    // If permission was denied, ask more politely
                    showMessagingRequest(function () {
                        askPermission('user_messaging', permissionsCallback);
                    });
                }
            } else {
                handleLogin();
            }
        }
        getPermissions(permissionsCallback);
    };
}());
