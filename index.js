import express from "express";
import fileUpload from "express-fileupload";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const app = express();

app.use(fileUpload());

app.post("/sign-ssl", (req, res) => {
    const CertificateSigningRequest = req.files?.CertificateSigningRequest;
    const DomainName = req.body?.DomainName;

    let errorMessages = [];

    if (!DomainName) {
        errorMessages.push("The name wasn't added")
    }
        
    if (!CertificateSigningRequest) {
        errorMessages.push("The file wasn't added")
    }   

    if (errorMessages.length > 0 ) {
        return res.status(400).json({ "error": errorMessages });
    }
    
    fs.writeFileSync(`reqs/${DomainName}.req`, CertificateSigningRequest.data);

    try {
        execSync(`openssl req -in reqs/${DomainName}.req -noout`);
    } catch (error) {
        res.status(400).send({ "errr": "Invalid cert" });    
    }

    execSync(
        `openssl x509 -req -sha256 -days 365 \
         -in reqs/${DomainName}.req \
         -CA ca/ca.pem -CAkey ca/ca-key.pem \
         -out issued/${DomainName}.pem \
         -CAcreateserial \
         -passin pass:${process.env.CA_root_password} \
         -copy_extensions copy`,
        { stdio: "inherit" }
      );

    return res.status(200).sendFile(
        path.join(path.resolve(), `./issued/${DomainName}.pem`)
    );
});

app.listen(process.env.node_port, process.env.node_hostname, () => console.log("SSL Signer API running on port 3000"));