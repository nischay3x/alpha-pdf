import mustache from "mustache";
import fs from "fs/promises";
import { Worker } from "worker_threads";
import xlsx from "xlsx";


const filePath = "./xls-file/file.xlsx";

const mapping = {
    masterpolicy_no: "Master Policy Number",
    reference_id: "Reference ID",
    name: "Name",
    email: "Personal Email ID",
    mobile_no: "Mobile No",
    gender: "Gender",
    date_of_birth: "Date of Birth",
    product_name: "Product name",
    type: "Type",
    coverage: "Coverage",
    premium: "Premium",
    igst: "IGST",
    premium_with_gst: "Premium with GST",
    trip_start: "Trip start date",
    trip_end: "Trip end date",
    no_of_days: "No of Days",
    transaction_date: "Transaction Date",
    plan: "Plan",
    policy_type: "Policy Type",
    coi_number: "COI Number",
    __id: "Reference ID",
    __counter: "S.No"
}

function sliceInParts(arr, parts, chunkSize) {
    if (!Array.isArray(arr) || typeof parts !== 'number' || parts <= 0) {
        // Check if the input is valid
        throw new Error('Invalid input. Please provide a valid array and a positive number of parts.');
    }

    const length = arr.length;
    const partSize = Math.ceil(length / parts); // Calculate the size of each part

    const result = [];

    for (let i = 0; i < length; i += partSize) {
        const part = arr.slice(i, i + partSize);
        result.push(part);
    }

    return result;
}

function getChunkGroups(array, chunkSize, groupSize) {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunkedArray.push(array.slice(i, i + chunkSize));
    }

    const groupedArray = [];
    for (let i = 0; i < chunkedArray.length; i += groupSize) {
        groupedArray.push(chunkedArray.slice(i, i + groupSize));
    }

    return groupedArray;
}

async function readXlsxFile() {
    try {
        console.info(`Reading XLSX file`);
        let workbook = xlsx.readFile(filePath);
        const template = await fs.readFile(`./templates/air.html`, { encoding: 'utf-8' });


        let chunkSize = 10;
        let threadCount = 2;
        let processed = 0;

        let sheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[sheetName];

        const json = xlsx.utils.sheet_to_json(worksheet);
        const totalRows = json.length;
        if (totalRows < chunkSize) {
            chunkSize = Math.ceil(totalRows / threadCount);
            console.log("Chunk size is reduced to equally distribute load on all threads!");
        }
        console.log(`Chunk Size: ${chunkSize} || Thread Count: ${threadCount}`);
        console.log(`Total Rows to Process: ${totalRows}`);
        console.log("------------------------------------");
        // let chunkSize = parseInt(totalRows / threadCount);
        // let tail = chunkSize;

        let start = Date.now();

        let chunksGroups = getChunkGroups(json, chunkSize, threadCount);
        for (let i = 0; i < chunksGroups.length; i++) {
            const group = chunksGroups[i];
            let tasks = [];
            for (let j = 0; j < group.length; j++) {
                const chunk = group[j];
                tasks.push(processChunk(chunk, template, mapping))
            }
            let results = await Promise.all(tasks);

            processed += results.reduce((a, b) => a + b);

            console.log(`-------- ${processed} Rows Processed -------`);
        }

        let end = Date.now();
        console.log(`Time Taken: ${end - start} ms`)

    } catch (error) {
        console.error(`reading XLSX file: ${error.message}`);
    }
}

readXlsxFile();

function mapForHtml(data) {
    return {
        masterpolicy_no: data["Master Policy Number"],
        reference_id: data["Reference ID"],
        name: data["Name"],
        email: data["Personal Email ID"],
        mobile_no: data["Mobile No"],
        gender: data["Gender"],
        date_of_birth: data["Date of Birth"],
        product_name: data["Product name"],
        type: data["Type"],
        coverage: data["Coverage"],
        premium: data["Premium"],
        igst: data["IGST"],
        premium_with_gst: data["Premium with GST"],
        trip_start: data["Trip start date"],
        tripe_end: data["Trip end date"],
        no_of_days: data["No of Days"],
        transaction_date: data["Transaction Date"],
        plan: data["Plan"],
        policy_type: data["Policy Type"],
        coi_number: data["COI Number"]
    }
}

function processChunk(chunk, template, mapping) {
    const worker = new Worker("./chunk-processor.js", {
        workerData: {
            chunk, template, mapping
        }
    });
    // console.log(` --------- ${worker.threadId} spawned -------`);
    return new Promise((resolve, reject) => {
        worker.once('message', (length) => {
            worker.terminate();
            let count = parseInt(length);
            resolve(count);
        })
        worker.once('error', (err) => {
            console.log(err);
            reject();
        })
    })
}


async function templateReader(name) {
    const template = await fs.readFile(`./templates/${name}.html`, { encoding: 'utf-8' });
    const html = mustache.render(template, {
        masterpolicy_no: "CD32ASDFSD",
        coi_number: "asdfhi3223",
        chartData: [12, 19, 3, 5, 2, 3]
    });
    // await doGenerate(html, 'testwdata.pdf');
    // await Promise.all()
    await Promise.all([
        doGenerate(html, 'test1.pdf'),
        doGenerate(html, 'test2.pdf'),
        doGenerate(html, 'test3.pdf'),
        doGenerate(html, 'test4.pdf'),
        doGenerate(html, 'test5.pdf'),
        doGenerate(html, 'test6.pdf'),
        doGenerate(html, 'test7.pdf'),
        doGenerate(html, 'test8.pdf'),
        doGenerate(html, 'test9.pdf'),
        doGenerate(html, 'test10.pdf'),
    ])
    // for (let index = 0; index < 10; index++) {
    //     await doGenerate(html, `test-${index}.pdf`)
    // }
}

function doGenerate(htmlContent, name) {
    const worker = new Worker('./generator.js', {
        workerData: {
            htmlContent, name
        }
    })
    console.log(`Thread ID: ${worker.threadId}`);
    return new Promise((resolve, reject) => {
        worker.once('message', (data) => {
            console.log(`${name} Generated!`);
            worker.terminate();
            resolve();
        })
        worker.once('error', (err) => {
            console.log(err);
            reject();
        })
    })
}


// templateReader("air");