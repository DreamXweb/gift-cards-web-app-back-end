const Firestore = require('@google-cloud/firestore');
const axios = require('axios');

// Use your project ID here
const PROJECTID = 'dreamx-a4eba';
const COLLECTION_NAME = 'cloud-functions-firestore';
const ELASTIC_EMAIL_URL = 'https://api.elasticemail.com/v4/emails?apikey=3A79CC68F56210D3C4855D3B8E5B5FC86A598D0312BFE39CD8AE8BB3590186F59346C665C1E447BDA2C45911E9F1286E';

// noinspection JSValidateTypes
const firestore = new Firestore({
  projectId: PROJECTID,
  timestampsInSnapshots: true
  // NOTE: Don't hardcode your project credentials here.
  // If you have to, export the following to your shell:
  //   GOOGLE_APPLICATION_CREDENTIALS=<path>
  // keyFilename: '/cred/cloud-functions-firestore-000000000000.json',
});

const anError = (res) => {
  res.status = 400;
  return res.send({'status': 'error'});
}

// TODO good template
const defaultElasticEmailBody = {
  Recipients: [
    {
      Email: "",
    }
  ],
  Content: {

    // TODO try to change it to different emails
    From: "alexxxxxx2019@gmail.com",

    Subject: "The best email in the world",
    TemplateName: "New Default Template:2022-07-12 00:16:23",

  }
}

const sendEmail = async ({email}) => {
  defaultElasticEmailBody.Recipients[0].Email = email;
  console.log('defaultElasticEmailBody = ', defaultElasticEmailBody);
  return await axios.post(ELASTIC_EMAIL_URL, defaultElasticEmailBody);
}

/**
 * Retrieve or store a method in Firestore
 *
 * Responds to any HTTP request.
 *
 * GET = retrieve
 * POST = store (no update)
 *
 * success: returns the document content in JSON format & status=200
 *    else: returns an error:<string> & status=404
 *
 * @param {express:Request} req HTTP request context.
 * @param {express:Response} res HTTP response context.
 */
exports.main = async (req, res) => {

  // for no CORS
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status = 204;
    return res.send('');
  }

  if (req.method === 'POST') {

    if (!req.body) {
      return anError(res);
    }

    let type = req.body['type'];

    if (!type) {
      return anError(res);
    }

    if (type === 'start-registration') {

      let email = req.body['email'];

      if (!email) {
        return anError(res);
      }

      // TODO check that there is no user with the email.
      // TODO possible errors:
      // TODO 1. The verification email has already been sent
      // TODO 2. The user with the email is already registered

      // TODO create registration code\link that can be verified and add it to the email

      // TODO check the result
      console.log('email = ', email);
      let response = await sendEmail({email});

      console.log('response.data =', response.data);

      res.status = 200;
      return res.send({'status': 'success'});


    }

  }




  // TODO remove all that is not used

  if (req.method === 'POST') {
    // store/insert a new document
    const data = (req.body) || {};
    const ttl = Number.parseInt(data.ttl);
    const ciphertext = (data.ciphertext || '')
        .replace(/[^a-zA-Z0-9\-_!.,; ']*/g, '')
        .trim();
    const created = new Date().getTime();

    // .add() will automatically assign an ID
    return firestore.collection(COLLECTION_NAME).add({
      created,
      ttl,
      ciphertext
    }).then(doc => {
      console.info('stored new doc id#', doc.id);
      res.status = 200;
      return res.send(doc);
    }).catch(err => {
      console.error(err);
      res.status = 404;
      return res.send({
        error: 'unable to store',
        err
      });
    });
  }

  // everything below this requires an ID
  if (!(req.query && req.query.id)) {
    res.status = 404;
    return res.send({
      error: 'No II'
    });
  }
  const id = req.query.id.replace(/[^a-zA-Z0-9]/g, '').trim();
  if (!(id && id.length)) {
    res.status = 404;
    return res.send({
      error: 'Empty ID'
    });
  }

  if (req.method === 'DELETE') {
    // delete an existing document by ID
    return firestore.collection(COLLECTION_NAME)
        .doc(id)
        .delete()
        .then(() => {
          res.status = 200;
          return res.send({ status: 'ok' });
        }).catch(err => {
          console.error(err);
          res.status = 404;
          return res.send({
            error: 'unable to delete',
            err
          });
        });
  }

  // read/retrieve an existing document by ID
  return firestore.collection(COLLECTION_NAME)
      .doc(id)
      .get()
      .then(doc => {
        if (!(doc && doc.exists)) {
          res.status = 404;
          return res.send({
            error: 'Unable to find the document'
          });
        }
        const data = doc.data();
        if (!data) {
          res.status = 404;
          return res.send({
            error: 'Found document is empty'
          });
        }
        res.status = 200;
        return res.send(data);
      }).catch(err => {
        console.error(err);
        res.status = 404;
        return res.send({
          error: 'Unable to retrieve the document',
          err
        });
      });
};
