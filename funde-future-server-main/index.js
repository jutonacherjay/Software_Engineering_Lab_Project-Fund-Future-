const express = require('express');
const cors = require('cors');
const Mailgen = require('mailgen');
const jwt = require('jsonwebtoken');

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const nodemailer = require("nodemailer");
const mg = require('nodemailer-mailgun-transport');

require('dotenv').config();
const stripe = require("stripe")("sk_test_51MsoefLLZ1o50Tb07lZcDPmFuo1mVf4QDfl7Yy8imWJ14fltPh1SM42yrilwK3G4NMJdoGfwoRAhbgd6XRDtyJMP00QtCpZuIp");

const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.wd2bc6v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



function sendInvoiceEmail(donation) {
  const {
    donor_mail,
    amount,
    transactionId,
    campaign_id,
    campaign_name,
    donor_name,
    charity_name,
  } = donation;

  let config = {
    service: "gmail",
    auth: {
      user: process.env.GOOGLE_EMAIL,
      pass: process.env.GOOGLE_EMAIL_PASS,
    },
  };


  
  // C
  // Creates a new campaign and adds it to the database.
  app.get("/campaigns", verifyJWT, async (req, res) => {
    const email = req.query.email;
    const decodedEmail = req.decoded.email;
    if (email !== decodedEmail) {
      return res.status(403).send({ message: "forbidden-access" });
    }
    const query = { campaigner_mail: email };
    const cursor = campaignCollection.find(query);
    const campaigns = await cursor.toArray();
    res.send(campaigns);
  });



  // R
  // Retrieves a specific campaign based on its ID.
  app.get("/campaign/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const campaign = await campaignCollection.findOne(query);
    res.send(campaign);
  });



  // U
  // Updates an existing campaign based on its ID.
  app.put("/campaigns/:id", verifyJWT, async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const campaign = req.body;
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        title: campaign.title,
        category: campaign.category,
        address: campaign.address,
        short_desc: campaign.short_desc,
        description: campaign.description,
        lastModified: new Date(),
      },
    };
    const result = await campaignCollection.updateOne(
      filter,
      updateDoc,
      options
    );
    res.send(result);
  });



  // D
  // Deletes a specific campaign based on its ID.
  app.delete("/campaigns/:id", verifyJWT, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await campaignCollection.deleteOne(query);
    res.send(result);
  });



  let transporter = nodemailer.createTransport(config);

  let MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "FundFuture",
      link: "https://mailgen.js/",
    },
  });

  let response = {
    body: {
      name: donor_name,
      intro: "",
      table: {
        data: [
          {
            campaign: campaign_name || charity_name,
            description: "Thank you for your donation. Wish you all the best!",
            amount: amount,
          },
        ],
      },
      outro: "Thank you for being with us!",
    },
  };

  let mail = MailGenerator.generate(response);

  let message = {
    from: process.env.GOOGLE_EMAIL,
    to: donor_mail,
    subject: `You have donated ${amount} to ${campaign_name || charity_name}`,
    html: mail,
  };

  transporter
    .sendMail(message)
    .then(() => {
      // return res.status(201).json({
      //     msg: "you should receive an email"
      // })
    })
    .catch((error) => {
      // return res.status(500).json({ error })
    });
}





//================================
function sendContactMail(mailInfo) {

    const { mailTo, mailBody, mailSubject, mailToName } = mailInfo;


    let config = {
        service: 'gmail',
        auth: {
            user: process.env.GOOGLE_EMAIL,
            pass: process.env.GOOGLE_EMAIL_PASS
        }
    }


    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "FundFuture",
            link: 'https://mailgen.js/'
        }
    })

    let response = {
        body: {
            name: mailToName,
            intro: mailBody,

            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }

    let mail = MailGenerator.generate(response)

    let message = {
        from: process.env.GOOGLE_EMAIL,
        to: mailTo,
        subject: mailSubject,
        html: mail
    }

    transporter.sendMail(message).then(() => {
        // return res.status(201).json({
        //     msg: "you should receive an email"
        // })
    }).catch(error => {
        // return res.status(500).json({ error })
    })

}


run().catch(err => console.error(err));








app.listen(port, (port, () => {
    console.log("SERVER IS RUNNING");
}))