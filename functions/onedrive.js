const axios = require('axios');

async function getAccessToken({ tenant, clientId, clientSecret }) {
  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');

  const res = await axios.post(url, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return res.data.access_token;
}

async function uploadFileToOneDrive({ tenant, clientId, clientSecret, driveId, path, fileBuffer }) {
  const token = await getAccessToken({ tenant, clientId, clientSecret });
  const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(path)}:/content`;
  
  // Upload content
  const uploadRes = await axios.put(uploadUrl, fileBuffer, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/pdf'
    }
  });

  const itemId = uploadRes.data.id;
  if (!itemId) {
    throw new Error('OneDrive upload did not return an item ID.');
  }

  // Create sharing link
  const linkUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/createLink`;
  const linkRes = await axios.post(linkUrl, {
    type: 'view',
    scope: 'anonymous'
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return {
    itemId,
    webUrl: linkRes.data.link.webUrl
  };
}

module.exports = {
  uploadFileToOneDrive
};
