function (user, context, callback) {
    console.log(auth0);
      if(context.clientID === 'client_id' && context.connection === 'name of your connection')
      {
      var timeDiff = 14 * 24 * 60 * 60 * 1000;
      var _ = require('lodash');
      var config = {
          AUDIENCE: 'yubikeyOTPWithSelfRegistration',
          TOKEN_SIGNING_SECRET: configuration.YBMFA_TOKEN_SIGNING_SECRET,
          ISSUER: auth0.domain,
          WT_URL: configuration.YBMFA_WT_URL
      };
      var token;
          //Returning from OTP validation
          if (context.protocol === 'redirect-callback') {
              verifyToken(
                  config.AUDIENCE,
                  config.TOKEN_SIGNING_SECRET,
                  config.ISSUER,
                  context.request.query.token,
                  postVerify
              );
          } else {
                  token = createToken(
                      config.AUDIENCE,
                      config.TOKEN_SIGNING_SECRET,
                      config.ISSUER, {
                          sub: user.user_id,
                          email: user.email
                      }
                  );
  
                      context.redirect = {
                          url: config.WT_URL + '?token=' + token
                      };
                      return callback(null, user, context);
  
  
  
          }
      
      }
    else return callback(null, user, context);
  
      function createToken(audience, signingSecret, issuer, user) {
          var options = {
              expiresInMinutes: 10,
              audience: audience,
              issuer: issuer
          };
          return jwt.sign(user, new Buffer(signingSecret, "base64"), options);
      }
  
      function verifyToken(audience, signingSecret, issuer, token, cb) {
        console.log(token);
          jwt.verify(
              token,
              new Buffer(signingSecret, "base64"), {
                  audience: audience,
                  issuer: issuer
              },
              cb
          );
      }
      function postVerify(err, decoded) {
          if (err) {
              console.log(err);
              return callback(new UnauthorizedError("MFA failed"));
          } else {
            return callback(null, user, context);
          }
      }
  
  
  
  }
