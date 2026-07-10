const { google } = require('googleapis');
const { Readable } = require('stream');

async function getDriveClient(saJsonString) {
  const credentials = JSON.parse(saJsonString);
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/drive']
  );
  return google.drive({ version: 'v3', auth });
}

async function getOrCreateFolder(drive, name, parentId, sharedDriveId) {
  const query = `name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  const listRes = await drive.files.list({
    q: query,
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'drive',
    driveId: sharedDriveId
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    return listRes.data.files[0].id;
  }

  const createRes = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    supportsAllDrives: true,
    fields: 'id'
  });

  return createRes.data.id;
}

async function getOrCreatePath(drive, pathSegments, sharedDriveId) {
  let parentId = sharedDriveId;
  for (const segment of pathSegments) {
    if (segment) {
      parentId = await getOrCreateFolder(drive, segment, parentId, sharedDriveId);
    }
  }
  return parentId;
}

async function uploadFileToDrive({ saJson, sharedDriveId, pathSegments, filename, mimeType, fileBuffer }) {
  const drive = await getDriveClient(saJson);
  const folderId = await getOrCreatePath(drive, pathSegments, sharedDriveId);

  const media = {
    mimeType: mimeType || 'application/octet-stream',
    body: Readable.from(fileBuffer)
  };

  const fileMetadata = {
    name: filename,
    parents: [folderId]
  };

  const createRes = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    supportsAllDrives: true,
    fields: 'id, webViewLink'
  });

  try {
    await drive.permissions.create({
      fileId: createRes.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      },
      supportsAllDrives: true
    });
  } catch (err) {
    console.warn('Could not set public permission on Google Drive file:', err.message);
  }

  const getRes = await drive.files.get({
    fileId: createRes.data.id,
    fields: 'webViewLink',
    supportsAllDrives: true
  });

  return {
    fileId: createRes.data.id,
    webViewLink: getRes.data.webViewLink
  };
}

module.exports = {
  uploadFileToDrive
};
