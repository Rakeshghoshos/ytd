import express,{Request,Response} from 'express';
import  ytdl  from 'ytdl-core';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import {formatTime ,calculateDuration} from './utilities/helpers.js';
import {ExtendedChapter} from './types.js';
import _ from 'lodash';
import youtubedl from 'youtube-dl-exec';
import { Readable } from 'stream';

let router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


router.post('/fetchDetails', async (req: Request, res: Response):Promise<void> => {
    const { url } = req.body;
    try {
        const info = await ytdl.getInfo(url);
        // const description = info.videoDetails;
        // const timestamps = extractTimestamps(description);

        let videoLengthSeconds:number = Number(info.videoDetails.lengthSeconds);
        const isHourFormat = videoLengthSeconds >= 3600;
        let chapters: ExtendedChapter[]  = info.videoDetails.chapters;

    for (let i = 0; i < chapters.length; i++) {
    const startTime = chapters[i].start_time;
    const endTime = (i < chapters.length - 1) ? chapters[i + 1].start_time : videoLengthSeconds;

    chapters[i].start_time_formatted = formatTime(startTime, isHourFormat);
    chapters[i].end_time = endTime;
    chapters[i].end_time_formatted = formatTime(endTime, isHourFormat);
    }

    let videoLengthFormatted = formatTime(videoLengthSeconds, isHourFormat);
        res.status(200).json({ success: true, data : {videoLengthFormatted ,videoLengthSeconds ,chapters} });
    } catch (error) {
       res.status(500).json({ success: false, error: 'Error fetching video information.' });
    }
});

router.post('/downloadVideo', async (req: Request, res: Response): Promise<void> => {
    try {
      const { url, start_time, end_time } = req.body;

    if (!url || !ytdl.validateURL(url)) {
      res.status(400).json({ success: false, error: 'Please enter a valid YouTube URL' });
      return;
    }
  
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.videoId;
      const filePath = path.resolve(__dirname, `${title}.mp4`);
      const chunks: Buffer[] = [];
      const timeSection = `${start_time}-${end_time}`;

      if (typeof ffmpegPath === 'string') {
        
        ffmpeg.setFfmpegPath(ffmpegPath);
      } else {
        console.error('Error: ffmpeg-static did not return a valid path.');
      }

      const ffmpegBinaryPath = ffmpegPath as unknown as string;
      const youtubeDlProcess = youtubedl.exec(url, {
        output: '-',
        format: 'best',
       downloadSections:`*${timeSection}`,
       ffmpegLocation : ffmpegBinaryPath
      });
      
      youtubeDlProcess.stdout?.on('data', (chunk) => chunks.push(chunk));
      youtubeDlProcess.stdout?.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const stream = Readable.from(buffer);

        const ffmpegCommand = ffmpeg(stream).toFormat('mp4');

      //   if (start_time) ffmpegCommand.setStartTime(start_time);
      // if (end_time) ffmpegCommand.setDuration(calculateDuration(start_time, end_time));

      ffmpegCommand
        .save(filePath)
        .on('end', () => {
          res.download(filePath, `${title}.mp4`, (err) => {
            if (err) {
              console.error("Error sending file:", err);
              res.status(500).send("Error downloading file");
            }
            // Delete the file after sending it
            res.on('close', () => {
              try {
                fs.unlinkSync(filePath);
                console.log("File deleted successfully");
              } catch (error) {
                console.error("Error deleting file:", error);
              }
            });
          });
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          res.status(500).send("Error processing video");
        });
    });
  } catch (error) {
    if (!res.headersSent) {
      console.error(error);
      res.status(500).json({ success: false, error });
    }
  }
});

  router.post('/downloadAudio', async (req: Request, res: Response): Promise<void> => {
    try {
      const { url } = req.body;
      if (!url && ytdl.validateURL(url)) {
        res.status(400).json({ success: false, error: 'Please enter a valid YouTube URL' });
        return;
      }
  
      const info = await ytdl.getInfo(url);

      const title = info.videoDetails.videoId;
      const filePath = path.resolve(__dirname, `${title}.mp3`);
      const chunks: Buffer[] = [];
      const youtubeDlProcess = youtubedl.exec(url, {
        output: '-',
        format: 'bestaudio',
      });
  
      // Collect the data in chunks
      youtubeDlProcess.stdout?.on('data', (chunk) => chunks.push(chunk));
      youtubeDlProcess.stdout?.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const stream = Readable.from(buffer);
      if (typeof ffmpegPath === 'string') {
        ffmpeg.setFfmpegPath(ffmpegPath);
      } else {
        console.error('Error: ffmpeg-static did not return a valid path.');
      }

      ffmpeg(stream)
        .audioBitrate(128)
        .audioCodec('libmp3lame')
        .audioFrequency(44100)
        .audioChannels(2)
        .toFormat('mp3')
        .save(filePath)
        .on("end", () => {
          res.download(filePath, `${title}.mp3`, (err) => {
            if (err) {
              console.error("Error downloading file:", err);
              res.status(500).send("Error downloading file");
            }
            res.on('close', () => {
              try {
                fs.unlinkSync(filePath);
                console.log("File deleted successfully");
              } catch (error) {
                console.error("Error deleting file:", error);
              }
            });
          });
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          res.status(500).send("Error processing audio");
        });
      });
      // res.status(200).json({ success: true, info });
    } catch (error) {    
      if (!res.headersSent) {
        console.error(error);
        res.status(500).json({ success: false, error: error});
      }
    }   
    });

export default router;