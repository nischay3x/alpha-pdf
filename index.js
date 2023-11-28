import express from "express";
import Joi from "joi";
import readXlsxFile from "./utils/xl-processor.js";
import downloadFromS3 from "./utils/downloadFromS3.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const bulkOrderSchema = Joi.object().keys({
    template: Joi.string().required().regex(/\.html$/),
    xlFile: Joi.string().required().regex(/\.xlsx$/),
    mapping: Joi.object()
});
app.post('/bulk', async (req, res) => {
    const {error , value} = bulkOrderSchema.validate(req.body);
    if(error) {
        return res.status(400).json( error )
    };

    const body = value;
    try {
        await downloadFromS3(body.template, "templates");
        await downloadFromS3(body.xlFile, "xls-file");
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Error in fetching files!" });
    }

    readXlsxFile(body.xlFile, body.template, body.mapping);
    return res.status(200).json({ msg: "Processing!" });
});

app.listen(3000, (err) => {
    if(err) {
        console.log(err);
        process.exit(1);
    } else {
        console.log("Server Running on 3000");
    }
})
