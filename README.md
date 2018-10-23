# csv-to-salesforce

## SalesForce API Documentation Links

* https://developer.salesforce.com/docs/api-explorer/sobject/Contact (Dojo Member)
* https://developer.salesforce.com/docs/api-explorer/sobject/Opportunity (Sale / Donation)
* https://developer.salesforce.com/docs/api-explorer/sobject/Account (Dojo Member Family Group Account)

## Running

Uses `node` v10.12.0 and `yarn` 1.10.1.

Run `yarn` to install dependencies.

Create a file in this folder called `bin.sh`

```bash
export CLIENT_ID=""
export CLIENT_SECRET=""
export LOGIN_URL=""
export SF_USERNAME=""
export SF_PASSWORD=""
export SF_SECURITY_TOKEN=""

node ./index.js
```

Then run `sh ./bin.sh`.
