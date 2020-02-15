# Stellar Notifier

A standalone service that tracks Stellar Network operations and streams notifications to the subscribers. 
The notifications are sent as JSON-encoded HTTP POST requests. 
    
### Highlights

- Highly configurable.
- Supports operations filtering by account, asset, transaction memo, and operation type. 
- Guaranteed delivery, even if the notification recipient or the Notifier itself is down for some time.
- Supports public and private Stellar networks.
- Can be used as a shared microservice that streams events to multiple endpoints.
- High performance (tested with thousands of subscriptions).
- Reliable tracking and consistency (tracking is resumed from the same transaction after restart).
- Does not require Stellar Core or Horizon node deployment.
- Notifications are signed with an ED25519 secret key to protect the recipient from spoofing.

### So... Where can I use it?

- **Payment processing**.\
Never miss a payment, even if a user decided to pay one week later, or you have some troubles with your server.
- **Anchors and ICOs**.\
Implement complex scenarios for your assets and track all user accounts. 
Track all operations involving your asset to gather statistics or calculate dividends.
- **Trading platforms**.\
Observe trading activity, aggregate market data, gather statistics, build market-making applications.
- **Monitoring tools**.\
Keep an eye on specific accounts or your favorite assets. Without pooling and other inefficient techniques.
- **Inflation pools**.\
Subscribe to inflation operation and distribute rewards when the subscription was triggered.
- And more...  

> :warning: Note: The project is at the early alpha stage. Battle-test it in your local environment before using in production.

## System requirements

Docker image by [@sgehrman](https://github.com/sgehrman) can be found [here](https://github.com/StellarKit/stellar-notifier-docker).

#### Stellar Horizon server

Notifier relies on an event stream from Horizon server, so you'll need to choose a public Horizon instance 
(like https://horizon.stellar.org and https://horizon-testnet.stellar.org/), or you own hosted Horizon instance. 
The latter option is preferable for production cases. 
Nevertheless, public Horizon instances supported by SDF work just fine as well.

#### NodeJS 8.6.0+

The service requires NodeJS 8.6.0 or later. 

#### (Optional) MongoDB 3.2+ or other storage provider

For the production deployment all notification queues are stored in the database.

MongoDB was selected as the most convenient option in terms of fast read/writes alongside with minimum memory/IO overhead. 

#### Supported platforms

Linux, Windows, MacOS.  
Effectively all platforms where you can run NodeJS and MongoDB.    

## Installation

1\. Clone the repository.

```
git clone https://github.com/orbitlens/stellar-notifier
```

2\. Install required NPM packages.

```
cd stellar-notifier
npm i
```

3\. (For production deployments)
Ensure that MongoDB is running. 
Download it [here](https://www.mongodb.com/download-center?jmp=nav#community) in case if it has not been installed yet.

4\. Set configuration parameters in `app.config.json` (see [Configuration](#configuration) section).

5\. Start the service.

```
npm run start
```

## Configuration

All configuration parameters are located in `app.config.json` file. The server also supports setting parameters using 
environment variables. By default the server loads settings from `app.config.json` file, and overwrites specific 
parameter if the corresponding environment variable found. 

- **storageProvider**\
Storage provider for persistence layer (see details in [Storage providers](#storage-providers) section).\
Default value: `"memory"`\
Env parameter: `STORAGE_PROVIDER`
- **storageConnectionString**\
Connection string for storage provider.\
Default value: `""`\
Env parameter: `STORAGE_CONNECTION_STRING`
- **apiPort**\
API exposed by the notifier.\
Default value: `4021`\
Env parameter: `API_PORT`
- **horizon**\
Horizon server URL.\
Default value: `"https://horizon.stellar.org"`.\
Env parameter: `HORIZON`
- **reactionResponseTimeout**\
Maximum expected HTTP response timeout (in seconds). 
If the reaction URL takes more time to respond, the request is aborted and notification is marked as failed.\
Default value: `10`.\
Env parameter: `REACTION_RESPONSE_TIMEOUT`
- **authorization**\
Server authorization mode.\
`disabled` mode turns off the authentication (recommended for local installations).\
`token` authentication expects `access_token` with user requests (see [API Authentication](#authentication)).\
Default value: `"disabled"`.\
Env parameter: `AUTHORIZATION`
- **adminAuthenticationToken**\
API authentication token for admin user (for `"authentication"="token"` mode). 
Leave empty to use a randomly generated token.\
Default Value: `""`.\
Env parameter: `ADMIN_AUTHENTICATION_TOKEN`
- **signatureSecret**\
Secret key used to sign the notifications. Do not forget to set your own secret. 
It can be easily generated using [Stellar Laboratory](https://www.stellar.org/laboratory/#account-creator?network=test). 
Do not use the default value or a secret key from the funded account.\
Default value: `""`.\
Env parameter: `SIGNATURE_SECRET`
- **maxActiveSubscriptions**\
Maximum simultaneously tracked subscriptions.\
Default value: `10000`.\
Env parameter: `MAX_ACTIVE_SUBSCRIPTIONS`
- **maxActiveSubscriptionsPerUser**\
Maximum simultaneously tracked subscriptions per single user.\
Default value: `100`.\
Env parameter: `MAX_ACTIVE_SUBSCRIPTIONS_PER_USER`
- **notificationConcurrency**\
Maximum concurrent notification threads (effectively, it equals the maximum parallel pending HTTP requests).\
Default value: `100`.\
Env parameter: `NOTIFICATION_CONCURRENCY`

#### Storage providers

Notifier can store notification queues and operational information in the database or in memory. 
The latter case is suited only for testing or cases without guaranteed delivery. 

There are two built-in storage providers: `mongodb` and `memory`.
Other storage providers can be easily connected through the standard interface. 

#### Config example:

    {
      "authorization": "disabled",
      "storageProvider": "mongodb",
      "storageConnectionString": "mongodb://127.0.0.1:27017/stellar-notifier",
      "apiPort": 4021,
      "horizon": "https://horizon.stellar.org",
      "signatureSecret": "SDBT736EJIIRDC3RSN544NO6OSNMZAWAKRARLOMRP2XJAOGKTQLFFR3V",
      "maxActiveSubscriptions": 10000,
      "notificationConcurrency": 100,
      "reactionResponseTimeout": 10,
      "adminAuthenticationToken": "98c12910bf35c79a800e9ea893a93b078ea92fc7a26ca76c0cd2f6003464d781"
    }

## API

### Authentication

With `authorization` config parameter set to `disabled`, there is no need to bother about authentication. 
But it only works in cases where the service is not exposed to public networks (i.e. behind the firewall).

To enable ed25519 authentication, set `authorization` to `enabled`. In this mode, any interaction with protected API will require an authorization header `Authorization: ed25519 <public_key>.<signature>`, where `public_key` is a ed25519 public key and `signature` is a serilalized in hex format cyrptographic signature of form-urlencoded request params. Please note, that all requests to protected API endpoints should contain `nonce` param and the value should be greater than in previous request.

##### Example

```
const {
    Keypair
} = require('stellar-base')

var objectToFormEncoding = function(object) {
    if (!object)
        return ''
    return Object.keys(object).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(object[k])}`).join('&')
}

//GET request

var payload = objectToFormEncoding({ 
    nonce: Date.now(),
    foo: 'foo'
})
var keyPair = new KeyPair('private_key')
var signature = keyPair.sign(payload).toString('hex')

var authHeader = `ed25519 ${keyPair.publicKey()}.${signature}`
var requestUrl = `<protected_api_endpoint>?${payload}`

//set header and make request

...

//POST request

var body = {
    nonce: Date.now(),
    foo: 'foo'
}
var keyPair = new KeyPair('private_key')
var signature = keyPair.sign(objectToFormEncoding(body)).toString('hex')

var authHeader = `ed25519 ${keyPair.publicKey()}.${signature}`

//set header, body and make request

```

### Create subscription

```
POST /api/subscription
```

**Parameters**:

- **reaction_url** [*string*] (mandatory) - a full URL that should be requested by notification
- **account** [*string*] (optional) - an account address to track
- **memo** [*string*] (optional) - expected transaction memo
- **account** [*string*] (optional) - an account address to track
- **asset_code** [*string*] (optional) - asset code to track (specify XLM and no issuer to track operations involving XLM)
- **asset_issuer** [*string*] (optional) - asset issuer to track
- **operation_types** [*Array\<Number\>*] (optional) - operation types to track

Note: at least one operation filtering criteria should be specified.

Response example:

```
{
  "id": "5ae88ef89a9e5d4a589cf27d",
  "user": "5ae87f6bc6073d3e6c9c7d1d",
  "status": 0,
  "delivery_failures": 0,
  "sent": 8,
  "reaction_url": "http://localhost:4022/test/reaction",
  "operation_types": [
    0,
    1
  ],
  "created": "2018-05-01T15:59:52.475Z",
  "updated": "2018-05-01T16:01:19.742Z"
}
``` 

The `id` value from response can be used to delete the subscription.

### Remove subscription

```
DELETE /api/subscription/:subscription_id
```

The endpoint returns 200 in case of successful unsubscription, and an error code otherwise.

**Parameters**:

- **subscription_id** [*string*] (mandatory) - the subscription id to remove

### Get all active user subscriptions

```
GET /api/subscription
```

Response example:

```
[
  {
    "id": "5ae88ef89a9e5d4a589cf27d",
    "user": "5ae87f6bc6073d3e6c9c7d1d",
    "status": 0,
    "delivery_failures": 0,
    "sent": 8,
    "reaction_url": "http://localhost:4022/test/reaction",
    "operation_types": [
      0,
      1
    ],
    "created": "2018-05-01T15:59:52.475Z",
    "updated": "2018-05-01T16:01:19.742Z"
  },
  {
    "id": "5ae88f54397cbf2474ef27e1",
    "user": "5ae87f6bc6073d3e6c9c7d1d",
    "status": 0,
    "operation_types": [],
    "delivery_failures": 4,
    "sent": 0,
    "reaction_url": "http://localhost:4022/test/reaction2",
    "asset_type": 0,
    "created": "2018-05-01T16:01:24.336Z",
    "updated": "2018-05-01T16:02:01.036Z"
  }
]
```

## Notifications Format

Notifications are sent as JSON-encoded POST requests with the following format:

```
{
  "id": "5ae88ef89a9e5d4a589cf27d-757838947790641a6",
  "subscription": "5ae88ef89a9e5d4a589cf29d",
  "type": "operation",
  "created": "2018-05-01T16:45:37.529Z",
  "sent": "2018-05-01T16:45:37.991Z",
  "operation": {
    "id": "7578389477906432555",
    "type_i": 1,
    "type": "payment",
    "destination": "GC3UA6FHLDD7IFG3MXA7JCNC2YPW62AKMKV5H2CEEBWCLUNJR3OFJSNV",
    "asset": {
      "asset_code": "ETH",
      "asset_issuer": "GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P",
      "asset_type": "1"
    },
    "amount": "0.0012",
    "account": "GCUZSLQYXDXSOXC4DURSK3AJNAQEBDSYVGYE7BC7IXGTS32MJBW35QOU"
  },
  "transaction": {
    "hash": "7580614b4703704496173f578092a0b6a56e5906d7ad5f83e529af14bab2cdd3",
    "fee": 600,
    "source": "GCUZSLQYXDXSOXC4DURSK3AJNAQEBDSYVGYE7BC7IXGTS32MJBW35QOU",
    "paging_token": "757838947790643264",
    "source_account_sequence": "7196037745321120376",
    "created_at": "2018-05-01T16:45:37Z",
    "memo": { 
      "type": "text", 
      "value": "105683157"
    }
  }
}
```

Request headers:

- `X-Request-ED25519-Signature` – the ED25519 signature for the current notification body.
- `X-Subscription` – corresponding subscription id.

## Testing

Well, there are almost no tests at this point. I'm working on adding comprehensive unit and integration test siutes. 

Will be grateful for any help with it.

Run all tests with 

```
npm run test
```

## Roadmap and Further Improvements

The following features will be added in the nearest future:

- Response validation for the flooding attacks prevention.
- Implement other notification channels: email, messengers, etc.
- Include not only transaction info, but also all operation effects.
- Implement a multi-account support and basic acquiring to turn the service into a SAAS platform, so anyone could offer public SAAS notification services for some fee.
- Add the ability to use environment variables instead of the configuration file.
- Comprehensive comments and test suites.
- Bulletproof errors processing and graceful SIGTERM handling.

Have a suggestion? Want to submit a bug or feature request? Visit the [issue tracker](https://github.com/orbitlens/stellar-notifier).  

## Special Thanks and Acknowledgements

- Many thanks to [@MikeFair](https://github.com/MikeFair) for his prominent ideas.
- To [@sgehrman](https://github.com/sgehrman) for Docker setup and bug reports.
- Kudos to [Stellar Developer Foundation](https://github.com/stellar) for the state-of-the-art software and contemporary approach.   
- And, as always, thanks to awesome Stellar Community for the support.
