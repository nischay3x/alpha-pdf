import fs from "fs/promises";
import fsc from "fs";
import archiver from "archiver";
import path from "path";
import env from "./env.js";


// const output = fs.createWriteStream('directory_archive.zip'); // Name for the resulting ZIP file
// const archive = archiver('zip', {
//   zlib: { level: 9 } // Set compression level (0-9)
// });

// output.on('close', () => {
//   console.log('Directory archived successfully.');
// });

// archive.on('error', (err) => {
//   console.error('Error creating archive:', err);
// });

// archive.pipe(output);

// // Replace 'directory_to_zip' with the path to the directory you want to archive
// archive.directory('directory_to_zip', false);

// archive.finalize();

export async function cleanUp() {
    const directory = path.join(env.root, 'processed');
    await fs.rm(directory, { recursive: true });
    await fs.mkdir(directory);
}

// fs.rmdir(directoryPath, { recursive: true }, (err) => {
//     if (err) {
//       console.error('Error removing directory:', err);
//       return;
//     }
  
//     console.log('Directory removed successfully.');
  
//     // Recreate the directory
//     fs.mkdir(directoryPath, { recursive: true }, (err) => {
//       if (err) {
//         console.error('Error creating directory:', err);
//         return;
//       }
//       console.log('Directory created successfully.');
//     });
//   });


export default function archive(jobId) {
    return new Promise((resolve, rejects) => {
        const output = fsc.createWriteStream(`${jobId}.zip`);
        const archive = archiver('zip', {
            zlib: { level: 9 } 
        });

        output.on('close', () => {
            resolve();
        });

        archive.on('error', (err) => {
            rejects(err);
        });

        archive.pipe(output);

        archive.directory(path.join(env.root, "processed"), false);

        archive.finalize();
    })
}