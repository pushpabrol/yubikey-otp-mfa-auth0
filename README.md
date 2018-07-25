# yubikey-otp-mfa-auth0

## Description
This repo houses the code required for MFA via a Yubikey OTP device while accessing an application using Auth0. 

- `Note: You will need a Yubikey OTP Security Key to test this`
- `Note: To learn more about how rules(mechanism used here for MFA) work within Auth0 please refer to` 
[Rules](https://auth0.com/docs/rules/current/redirect)


## Authentication and Yubikey MFA Flow

1. User accesses application
2. User gets redirected to the Auth0 login page if they are not signed in
3. User enters credentials and logs in.
4. In Auth0, after authentication the rule engine kicks in and fires the configured rule
5. The redirect rule ( yubikey-otp-rule.js) in Auth0 now kicks in and redirects the user to the webtask where the Yubikey 
OTP 2nd factor form is shown. The user then touches his Yubikey to generate and pass an OTP. The OTP is submitted on the form
6. A number of checks are performed in this flow
   - The Yubikey Public ID from the OTP of the Yubikey is stored in the user's Auth0 `app_metadata` and this registers this OTP to the user.
   - A user can have any number of Yubikey's they can register and this number is controlled by a setting in the webtask
    -- The yubikey-otp-wt.js can be configured to select the number of OTP Public IDs/Yubikeys that a user can register to their account.
   - Once the OTP is validated the user is redirected back to Auth0 and the Authentication continues
   - If a user reaches the limit of the Yubikeys that can be registered into their account no more Yubikeys can be registered
   - If a user uses an OTP that is not registered and the threshold for registered Yubikeys is reached an error is shown to the user indicating that this is not a valid Yubikey and no more yubikeys can be registered
   
7. On completion of this verification the user is redirected back to the application


## Setup

1. Clone this repo

### Setup within Auth0 Dashboard

#### Create an application in Auth0
2. Create an application/Relying Party in Auth0 ( This is the application you want to sign in into). Note the `client_id` and the `auth0 domain`. 
   You can then use this client id in the auth0 rule engine to isolate and run the MFA rule only for this application.
   
  > * For most users of Auth0 creating an application is a trivial job but if you are new to Auth0 and want to know more about applications, different types of applications and how to create applications please go to the following page in the Auth0 documents website - [Applications](https://auth0.com/docs/applications)

#### Create and Authorize a client to call the management API 
3. Create another application in Auth0 of type 'Machine to Machine Applications' and name it `Yubikey OTP Management API Client`
4. Select the Auth0 Management API from the APIs dropdown in the screen and authorize the client. See next steps for scopes to be selected.
5. Select the following scopes
          - `read:users read:users_app_metadata update:users_app_metadata create:users_app_metadata`
 6. Click `Update` to save your changes. Note the client_id and secret of this client as `management_api_client_id` and `management_api_client_secret`

### Setup within Yubikey website

 #### Obtain Yubikey client_id and secret
 1. Go to https://upgrade.yubico.com/getapikey/ 
 2. To get your API key, enter a valid email address along with the Yubico OTP from any of your YubiKeys, and click Get API client_id and secret. Make note of these valuese as `yubikey_clientid` and `yubikey_secret`. You will need these values while creating the webtask below

 
### Setup within Webtask
7. Create a webtask under your Auth0 webtask container. To learn how to setup the webtask cli and initialize the webtask container for your tenant see https://manage.auth0.com/#/tenant/webtasks

 - The 2 steps shown below need to be executed 
   - Install wt (requires Node.js) `npm install -g wt-cli`
   - Setup wt `wt init --container "<tenant>" --url "https://sandbox.it.auth0.com" -p "<tenant>-default" --auth0`

    a. Navigate to the directory where you have cloned the repo from github. You will see 2 files - yubikey-otp-wt.js and yubikey-otp-rule.js. 
        
    b. Create your webtask
    
         You will need the following values to create the webtask:
           - yubikey_clientid: Your Yubikey Client ID obtained from Yubikey
           - yubikey_client_secret: Your Yubikey Secret obtained from Yubikey
           - auth0_domain: Domain for your auth0 tenant. Usually in the format <tenant>.auth0.com
           - returnUrl: The redirect rule callback url. This is always https://<tenant>.auth0.com/continue
           - management_api_client_id: Client ID of client that was authorized above to call the Auth0 Management API
           - management_api_client_secret: Client Secret of client that was authorized above to call the Auth0 Management API
           - Auth0 tenant & domain, usually in the format tenant.auth0.com, tenant.eu.auth0.com or tenant.au.auth0.com
           - token_signing_shared_secret: You can generate a secret with this command `openssl rand -hex 32` and use that as the token_signing_shared_secret. Make not of this secret as it will also be needed while setting up the configuration values for the Auth0 rule.
           - Webtask profile name. You will find this name under https://manage.auth0.com/#/tenant/webtasks
           - allowed_yubikeys_per_user: This is defaulted to 1. If you want your users to have an register more than one you can change this number to change the limit.
           - Run the command below with the correct values set
   > wt create --name yubikey-verification  --secret yubikey_clientid=<yubikey_client_id> --secret yubikey_secret=<yubikey_client_secret> --secret management_api_client_id=<management_api_client_id>  --secret management_api_client_secret=<management_api_client_secret>  --secret auth0_domain=<auth0_domain>  --secret returnUrl=<https://tenant.auth0.com/continue>  --secret token_signing_shared_secret=`<token signing shared secret>` --secret allowed_yubikeys_per_user=1 --profile name_of_wt_profile yubikey-otp-wt.js
   
           
      c. Once the webtask is created you will see the `webtask url` in the console as a result. Note this url and it will be used in the next step while creating 
      the rule in Auth0 

### Setup within Auth0 Dashboard ( Continuend)

#### Rule Setup

 8. Follow steps below to create the redirect rule
    - Go to https://manage.auth0.com/#/rules and create a new rule. 
    - Set the name of this rule as yubikey-otp-rule
    - Copy the code in yubikey-otp-rule.js and use this as the code of the rule you just created.
    - On the same page https://manage.auth0.com/#/rules, create the following configuration variables and set their values as shown

    > * YBMFA_TOKEN_SIGNING_SECRET =  Set this to be the same as the value for token_signing_shared_secret used while creating the webtask above
    > * WT_URL = Set this value as the url of the webtask that was in th step above

## Test

To test this MFA flow. 

Try logging into this application

Post Authentication you will be redirected to a page as shown below:

![Yubikey OTP Screen](https://github.com/pushpabrol/yubikey-otp-mfa-auth0/raw/master/Auth0_otp_with_Yubikey.png)

Insert your Yubikey device and touch the key and your Yubikey will be registered and used for 2nd factor 


## What is Auth0?

Auth0 helps you to:

* Add authentication with [multiple authentication sources](https://docs.auth0.com/identityproviders), either social like **Google, Facebook, Microsoft Account, LinkedIn, GitHub, Twitter, Box, Salesforce, amont others**, or enterprise identity systems like **Windows Azure AD, Google Apps, Active Directory, ADFS or any SAML Identity Provider**.
* Add authentication through more traditional **[username/password databases](https://docs.auth0.com/mysql-connection-tutorial)**.
* Add support for **[linking different user accounts](https://docs.auth0.com/link-accounts)** with the same user.
* Support for generating signed [Json Web Tokens](https://docs.auth0.com/jwt) to call your APIs and **flow the user identity** securely.
* Analytics of how, when and where users are logging in.
* Pull data from other sources and add it to the user profile, through [JavaScript rules](https://docs.auth0.com/rules).

## Create a free account in Auth0

1. Go to [Auth0](https://auth0.com) and click Sign Up.
2. Use Google, GitHub or Microsoft Account to login.

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
