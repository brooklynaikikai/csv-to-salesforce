const lodash = require('lodash')
const jsforce = require('jsforce')
const fetch = require('isomorphic-fetch')

const getAccountName = (LastName) => `${LastName} Household`

const createContact = async ({url, accessToken, body}) => {
  const res = await fetch(`${url}/services/data/v39.0/sobjects/Contact`, { 
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  const contact = await res.json()
  return contact.id
}

const createAccount = async ({url, accessToken, body}) => {
  const res = await fetch(`${url}/services/data/v39.0/sobjects/Account`, { 
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  const account = await res.json()
  return account.id
}

const createOpportunity = async ({url, accessToken, body}) => {
  const res = await fetch(`${url}/services/data/v39.0/sobjects/Opportunity`, { 
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  const opprotunity = await res.json()
  return opprotunity.id
}

const createCampaign = async ({url, accessToken, body}) => {
  const res = await fetch(`${url}/services/data/v39.0/sobjects/Campaign`, { 
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  const campaign = await res.json()
  return campaign.id
}

const findContactById = async ({url, accessToken, id}) => {
  const res = await fetch(`${url}/services/data/v39.0/sobjects/Contact/${id}`, { 
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  const contact = await res.json()
  return contact
}

const queryFind = async ({url, accessToken, query}) => {
  const res = await fetch(`${url}/services/data/v39.0/search/?q=FIND+%7B${query}%7D`, { 
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  const {searchRecords} = await res.json()
  return searchRecords
}

const filterBySearchResultType = ({searchRecords, type}) => {
  const entities = lodash.filter(searchRecords, searchRecord => searchRecord.attributes.type === type)
  const entitiyIds = lodash.map(entities, entity => entity.Id)
  if (!entitiyIds.length) return false
  return entitiyIds[0]
}

const findContactIdByEmail = async ({url, accessToken, query}) => {
  const searchRecords = await queryFind({url, accessToken, query})
  return filterBySearchResultType({searchRecords, type: 'Contact'})
}

const findAccounIdByName = async ({url, accessToken, query}) => {
  const searchRecords = await queryFind({url, accessToken, query})
  return filterBySearchResultType({searchRecords, type: 'Account'})
}

const findCampaignIdByName = async ({url, accessToken, query}) => {
  const searchRecords = await queryFind({url, accessToken, query})
  return filterBySearchResultType({searchRecords, type: 'Campaign'})
}

const upsertContact = async ({url, accessToken, body}) => {
  const results = await findContactIdByEmail({url, accessToken, query: body.Email})
  if (results) return results
  const res = await createContact({url, accessToken, body})
  return res
}

const upsertAccount = async ({url, accessToken, body}) => {
  const results = await findAccounIdByName({url, accessToken, query: body.Name})
  if (results) return results
  const res = await createAccount({url, accessToken, body})
  return res
}

const upsertCampaign = async ({url, accessToken, body}) => {
  const results = await findCampaignIdByName({url, accessToken, query: body.Name})
  if (results) return results
  const res = await createCampaign({url, accessToken, body})
  return res
}

const handleRow = async ({url, accessToken, contactBody, accountBody, campaignBody, opprotunityBody}) => {
  const AccountId = await upsertAccount({url, accessToken, body: accountBody})
  const ContactId = await upsertContact({url, accessToken, body: {...contactBody, AccountId}})
  const CampaignId = await upsertCampaign({url, accessToken, body: campaignBody})
  const Opportunity = await createOpportunity({url, accessToken, body: {...opprotunityBody, CampaignId, AccountId}})
  return { AccountId, ContactId, CampaignId, Opportunity }
}

const prepRow = ({FirstName, LastName, Amount, Campaign}) => {

  const contactBody = {
    FirstName,
    LastName,
    "Email": `${FirstName}.${LastName}@gmail.com`
  }

  const accountBody = {
    "Type": "Customer",
    "Name": getAccountName(LastName)
  }

  const opprotunityBody = {
    Amount,
    StageName: "Posted",
    CloseDate: new Date(),
    Name: `${FirstName} ${LastName} Donation` 
  }

  const campaignBody = {
    Name: Campaign
  }

  return {
    contactBody,
    accountBody,
    opprotunityBody,
    campaignBody
  }

}

const prepAndHandleRow = ({url, accessToken, FirstName, LastName, Amount, Campaign}) => {
  const {
    contactBody,
    accountBody,
    opprotunityBody,
    campaignBody
  } = prepRow({FirstName, LastName, Amount, Campaign})
  return handleRow({url, accessToken, contactBody, accountBody, opprotunityBody, campaignBody})
}

;(async () => {

  const {
    CLIENT_ID,
    CLIENT_SECRET,
    SF_USERNAME,
    SF_PASSWORD,
    SF_SECURITY_TOKEN,
    LOGIN_URL
  } = process.env
  
  var conn = new jsforce.Connection({
    oauth2 : {
      loginUrl: LOGIN_URL,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    } 
  });

  const PASSWORD = (SF_SECURITY_TOKEN) ? SF_PASSWORD + SF_SECURITY_TOKEN : SF_PASSWORD
  const userInfo = await conn.login(SF_USERNAME, PASSWORD)

  const url = LOGIN_URL
  const accessToken = conn.accessToken

  const FirstName = "Fiat"
  const LastName = "Octoman"
  const Amount = '80'
  const Campaign = 'Spring 2018'

  const x = await prepAndHandleRow({url, accessToken, FirstName, LastName, Amount, Campaign})
  
  console.log(x)

})();
