/*global
    window, document, fetch, MessengerExtensions, me,
    crealAppId, crealApiBaseUrl, crealAppPrefix
*/

(function () {
    "use strict";

    function showError(code, message) {
        // First parameter is the error code if available
        var errorCodeElement = document.getElementById('errorCode');
        var errorMessageElement = document.getElementById('errorMessage');

        if (code && errorCodeElement) {
            errorCodeElement.textContent = code;
        }
        if (message && errorMessageElement) {
            errorMessageElement.textContent = message;
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
            body: JSON.stringify({signedContext: signedContext})
        }).then(function (res) {
            // FIXME: Should check status code
            return res.json();
        }).then(function (res) {
            me.creal.frontend.core.init({
                authResponse: res.authResponse,
                userContext: res.userContext,
                prefix: crealAppPrefix
            });
        }).catch(function (error) {
            showError(null, JSON.stringify(error));
        });
    }

    window.extAsyncInit = function () {
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
    };
}());
